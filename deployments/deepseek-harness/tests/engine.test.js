import test from "node:test";
import assert from "node:assert/strict";
import { runHarnessCompletion } from "../engine.js";

const question = {
  model: "qwen3.8-flash",
  max_tokens: 1800,
  messages: [
    { role: "system", content: "You teach RL. Keep {{literal}} TeX." },
    { role: "user", content: "My question" },
    { role: "assistant", content: "Previous answer" },
    { role: "user", content: "Explain the Bellman equation." },
  ],
};
const key = "test-provider-key-123456789";
function streamResponse(parts) {
  return new Response(
    parts.map((part) => `data: ${JSON.stringify(part)}\n\n`).join("") +
      "data: [DONE]\n\n",
    { headers: { "Content-Type": "text/event-stream" } },
  );
}

test("real Harness core preserves system/history, streams safely, and advertises no tools", async () => {
  let sent;
  const updates = [];
  const result = await runHarnessCompletion(question, {
    apiKey: key,
    baseUrl: "https://gateway.test/v1",
    onText: (text) => updates.push(text),
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://gateway.test/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer " + key);
      assert.match(options.headers["user-agent"], /deepseek-harness/);
      sent = JSON.parse(options.body);
      assert.equal(sent.stream, true);
      assert.equal(sent.max_tokens, 1800);
      assert.equal(sent.tools, undefined);
      return streamResponse([
        { choices: [{ delta: { content: "First " } }] },
        {
          choices: [
            {
              delta: {
                content: "answer.",
                reasoning_content: "private thought",
              },
            },
          ],
        },
        { choices: [{ delta: {}, finish_reason: "stop" }] },
      ]);
    },
  });
  assert.deepEqual(sent.messages, question.messages);
  assert.deepEqual(updates, ["First ", "answer."]);
  assert.deepEqual(result, { text: "First answer.", truncated: false });
});

test("runtime redacts credentials split over deltas and respects output truncation", async () => {
  const result = await runHarnessCompletion(question, {
    apiKey: key,
    baseUrl: "https://gateway.test/v1",
    fetchImpl: async () =>
      streamResponse([
        { choices: [{ delta: { content: "Secret " + key.slice(0, 9) } }] },
        { choices: [{ delta: { content: key.slice(9) } }] },
        { choices: [{ delta: {}, finish_reason: "length" }] },
      ]),
  });
  assert.equal(result.text, "Secret [redacted]");
  assert.equal(result.truncated, true);
});

test("an interrupted answer is not reported as a completed Harness turn", async () => {
  const visible = [];
  await assert.rejects(
    runHarnessCompletion(question, {
      apiKey: key,
      baseUrl: "https://gateway.test/v1",
      onText: (text) => visible.push(text),
      fetchImpl: async () =>
        new Response(
          'data: {"choices":[{"delta":{"content":"Partial answer"}}]}\n\n',
          { headers: { "Content-Type": "text/event-stream" } },
        ),
    }),
  );
  assert.equal(visible.join(""), "Partial answer");
});

test("Stop cancels the actual provider request and tears down the private context", async () => {
  const controller = new AbortController();
  let providerAborted = false;
  await assert.rejects(
    runHarnessCompletion(question, {
      apiKey: key,
      baseUrl: "https://gateway.test/v1",
      signal: controller.signal,
      onText: () => controller.abort(),
      fetchImpl: async (_url, options) =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"Started"}}]}\n\n',
                ),
              );
              options.signal.addEventListener(
                "abort",
                () => {
                  providerAborted = true;
                  c.error(new DOMException("Stopped", "AbortError"));
                },
                { once: true },
              );
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
    }),
  );
  assert.equal(providerAborted, true);
});
