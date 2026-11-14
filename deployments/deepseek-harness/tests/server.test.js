import test from "node:test";
import assert from "node:assert/strict";
import { createHarnessServer } from "../server.js";
import {
  openTutorStream,
  getTutorReply,
} from "../../../server/tutor-service.js";

const token = "test-bridge-token-" + "a".repeat(40);
const apiKey = "test-private-provider-credential";
const question = {
  lessonId: "bellman",
  sectionKey: "proof",
  model: "qwen3.8-flash",
  messages: [{ role: "user", content: "Explain contraction." }],
};
async function fixture(t, fetchImpl) {
  const server = createHarnessServer({
    token,
    apiKey,
    fetchImpl,
    maxConcurrent: 1,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    fetchImpl: (url, options) =>
      fetch(url.replace("https://harness.test", base), options),
  };
}
function providerJSON(text = "A clear explanation.") {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: text }, finish_reason: "stop" }],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

test("Vercel transport and actual Harness runtime round-trip JSON without exposing either credential", async (t) => {
  let upstream;
  const runtime = await fixture(t, async (_url, options) => {
    upstream = options;
    return providerJSON("A clear explanation. " + apiKey);
  });
  const result = await getTutorReply(question, {
    apiKey: "unused-on-vercel",
    harnessUrl: "https://harness.test/v1",
    harnessToken: token,
    fetchImpl: runtime.fetchImpl,
  });
  assert.equal(upstream.headers.Authorization, "Bearer " + apiKey);
  assert.match(result.reply, /A clear explanation.*\[redacted\]/);
  assert.equal(JSON.stringify(result).includes(apiKey), false);
  assert.equal(JSON.stringify(result).includes(token), false);
  const prompt = JSON.parse(upstream.body);
  assert.match(prompt.messages[0].content, /COURSE REFERENCE/);
  assert.equal(prompt.messages.at(-1).content, question.messages[0].content);
});

test("actual HTTP delivers Harness text before provider completion and limits concurrent requests", async (t) => {
  let complete;
  const runtime = await fixture(
    t,
    async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Visible now"}}]}\n\n',
              ),
            );
            complete = () => {
              c.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
                ),
              );
              c.close();
            };
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      ),
  );
  const options = {
    apiKey: "unused",
    harnessUrl: "https://harness.test/v1",
    harnessToken: token,
    fetchImpl: runtime.fetchImpl,
  };
  const stream = await openTutorStream(question, options);
  const reader = stream[Symbol.asyncIterator]();
  assert.equal((await reader.next()).value.event, "meta");
  assert.deepEqual((await reader.next()).value, {
    event: "delta",
    data: { text: "Visible now" },
  });
  await assert.rejects(
    getTutorReply(question, options),
    (e) => e.status === 429,
  );
  complete();
  assert.deepEqual((await reader.next()).value, {
    event: "done",
    data: { truncated: false },
  });
  assert.equal((await reader.next()).done, true);
});

test("runtime health is read-only; requests require bridge auth and validate model/context roles", async (t) => {
  let calls = 0;
  const runtime = await fixture(t, async () => {
    calls++;
    return providerJSON();
  });
  assert.equal((await fetch(runtime.base + "/healthz")).status, 200);
  assert.equal(
    (await fetch(runtime.base + "/v1/chat/completions", { method: "POST" }))
      .status,
    401,
  );
  for (const body of [
    { model: "unknown", messages: [], stream: true },
    {
      model: "qwen3.8-flash",
      stream: true,
      messages: [
        { role: "system", content: "S" },
        { role: "system", content: "Another system" },
        { role: "user", content: "Q" },
      ],
    },
  ]) {
    const response = await fetch(runtime.base + "/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(calls, 0);
});

test("provider diagnostics are sanitized through the runtime and Vercel layers", async (t) => {
  const runtime = await fixture(t, async () => {
    throw new Error("Secret diagnostic: " + apiKey);
  });
  const events = [];
  await assert.rejects(
    async () => {
      const stream = await openTutorStream(question, {
        apiKey: "unused",
        harnessUrl: "https://harness.test/v1",
        harnessToken: token,
        fetchImpl: runtime.fetchImpl,
      });
      for await (const event of stream) events.push(event);
    },
    (e) => e.status === 502 && !e.message.includes(apiKey),
  );
  assert.equal(JSON.stringify(events).includes(apiKey), false);
  assert.equal(
    events.some((event) => event.event === "done"),
    false,
  );
});

test("agent tool progress and plan updates survive both HTTP relay layers before the final answer", async (t) => {
  let requests = 0;
  const runtime = await fixture(t, async (_url, options) => {
    const payload = JSON.parse(options.body);
    requests++;
    if (requests === 1)
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: "",
                tool_calls: [
                  {
                    id: "update-plan-test",
                    type: "function",
                    function: {
                      name: "update_plan",
                      arguments: JSON.stringify({
                        steps: [{ title: "Derive Bellman", status: "pending" }],
                      }),
                    },
                  },
                ],
              },
              finish_reason: "tool_calls",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    assert.ok(
      payload.messages.some(
        (m) => m.role === "tool" && m.content.includes("Derive Bellman"),
      ),
    );
    return providerJSON("Your learning plan is saved.");
  });
  const events = [];
  const stream = await openTutorStream(
    {
      ...question,
      agent: {
        mode: "plan",
        skill: "proof",
        webSearch: false,
        state: { goal: "Learn Bellman", steps: [] },
      },
    },
    {
      apiKey: "unused",
      harnessUrl: "https://harness.test/v1",
      harnessToken: token,
      fetchImpl: runtime.fetchImpl,
    },
  );
  for await (const event of stream) events.push(event);
  assert.equal(requests, 2);
  const plan = events.findIndex(
    (e) => e.event === "agent" && e.data.type === "plan",
  );
  const answer = events.findIndex((e) => e.event === "delta");
  assert.ok(plan > 0 && answer > plan);
  assert.equal(events[plan].data.state.steps[0].title, "Derive Bellman");
  assert.equal(events.at(-1).event, "done");
});
