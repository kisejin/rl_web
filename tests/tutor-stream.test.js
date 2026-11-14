import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readSSE } from "../src/sse.js";
import { openTutorStream } from "../server/tutor-service.js";
import handler from "../api/tutor.js";
const encoder = new TextEncoder();
const key = "test-only-stream-credential";
const question = {
  lessonId: "bellman",
  sectionKey: "proof",
  model: "gemini-3.8-flash",
  stream: true,
  messages: [{ role: "user", content: "Explain the contraction inequality." }],
};
const frame = (data) => "data: " + JSON.stringify(data) + "\n\n";
const chunk = (text) =>
  frame({ choices: [{ delta: { content: text }, finish_reason: null }] });
const ending =
  frame({ choices: [{ delta: {}, finish_reason: "stop" }] }) +
  "data: [DONE]\n\n";
function controlled() {
  let controller,
    cancelled = false;
  const body = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      cancelled = true;
    },
  });
  return {
    body,
    write(text) {
      controller.enqueue(encoder.encode(text));
    },
    close() {
      controller.close();
    },
    get cancelled() {
      return cancelled;
    },
  };
}
async function collect(iterable) {
  const result = [];
  for await (const event of iterable) result.push(event);
  return result;
}
function streaming(body) {
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
test("SSE decoder handles fragmented UTF-8, CRLF, multiline data and trailing frames", async () => {
  const text =
    ': heartbeat\r\nevent: delta\r\ndata: {"text":\r\ndata: "Tiếng Việt 🧠"}\r\n\r\ndata: [DONE]';
  const bytes = encoder.encode(text);
  const body = new ReadableStream({
    start(c) {
      for (const byte of bytes) c.enqueue(new Uint8Array([byte]));
      c.close();
    },
  });
  const events = await collect(readSSE(body));
  assert.deepEqual(events, [
    { event: "delta", data: '{"text":\n"Tiếng Việt 🧠"}' },
    { event: "message", data: "[DONE]" },
  ]);
});
test("SSE decoder cancels pending reads and bounds event sizes", async () => {
  const source = controlled(),
    abort = new AbortController();
  const pending = readSSE(source.body, { signal: abort.signal }).next();
  abort.abort();
  await assert.rejects(pending);
  assert.equal(source.cancelled, true);
  const big = controlled();
  big.write("data: " + "x".repeat(30) + "\n\n");
  await assert.rejects(
    collect(readSSE(big.body, { maxEventSize: 20 })),
    /too large/,
  );
  assert.equal(big.cancelled, true);
});
test("provider text is yielded before completion and credentials split across deltas are redacted", async () => {
  const source = controlled();
  let sent;
  const stream = await openTutorStream(question, {
    apiKey: key,
    fetchImpl: async (url, options) => {
      assert.equal(options.headers["Accept-Encoding"], "identity");
      sent = JSON.parse(options.body);
      return streaming(source.body);
    },
  });
  assert.equal(sent.stream, true);
  assert.equal(sent.model, "gemini-3.8-flash");
  const iterator = stream[Symbol.asyncIterator]();
  assert.equal((await iterator.next()).value.data.model, "gemini-3.8-flash");
  source.write(
    frame({
      choices: [
        { delta: { reasoning_content: "Private reasoning, not answer text." } },
      ],
    }) + chunk("First words "),
  );
  const first = (await iterator.next()).value;
  assert.deepEqual(first, { event: "delta", data: { text: "First words " } });
  assert.equal(source.cancelled, false);
  source.write(
    chunk(key.slice(0, 10)) + chunk(key.slice(10) + " remain safe.") + ending,
  );
  source.close();
  const rest = await collect(iterator);
  const reply = [first, ...rest]
    .filter((e) => e.event === "delta")
    .map((e) => e.data.text)
    .join("");
  assert.equal(reply, "First words [redacted] remain safe.");
  assert.ok(!reply.includes(key));
  assert.ok(!reply.includes("Private reasoning"));
  assert.equal(rest.at(-1).event, "done");
});
test("stream failures are safe and an unfinished connection is not marked complete", async () => {
  for (const text of [
    chunk("Partial answer."),
    "data: not-json\n\n",
    "event: error\ndata: " + JSON.stringify({ error: key }) + "\n\n",
  ]) {
    const source = controlled();
    source.write(text);
    source.close();
    const stream = await openTutorStream(question, {
      apiKey: key,
      fetchImpl: async () => streaming(source.body),
    });
    await assert.rejects(
      collect(stream),
      (error) => error.status === 502 && !error.message.includes(key),
    );
  }
});
test("streaming bounds output, cancels the provider at the limit and supports JSON fallback", async () => {
  const source = controlled();
  source.write(chunk("x".repeat(15000)));
  const events = await collect(
    await openTutorStream(question, {
      apiKey: key,
      fetchImpl: async () => streaming(source.body),
    }),
  );
  assert.equal(
    events
      .filter((e) => e.event === "delta")
      .map((e) => e.data.text)
      .join("").length,
    14000,
  );
  assert.equal(events.at(-1).data.truncated, true);
  assert.equal(source.cancelled, true);
  const fallback = await collect(
    await openTutorStream(question, {
      apiKey: key,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: "JSON fallback " + key },
                finish_reason: "stop",
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    }),
  );
  assert.deepEqual(
    fallback.map((e) => e.event),
    ["meta", "delta", "done"],
  );
  assert.equal(fallback[1].data.text, "JSON fallback [redacted]");
});
async function apiFixture(t, fetchImpl) {
  const nativeFetch = globalThis.fetch,
    previousKey = process.env.QWENCODER_API_KEY;
  process.env.QWENCODER_API_KEY = key;
  globalThis.fetch = fetchImpl;
  const server = createServer((req, res) => {
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    globalThis.fetch = nativeFetch;
    if (previousKey === undefined) delete process.env.QWENCODER_API_KEY;
    else process.env.QWENCODER_API_KEY = previousKey;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const base = "http://127.0.0.1:" + server.address().port;
  return {
    request: (signal) =>
      nativeFetch(base + "/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify(question),
        signal,
      }),
  };
}
test(
  "real HTTP tutor response flushes SSE deltas while the provider is still open",
  { timeout: 5000 },
  async (t) => {
    const source = controlled();
    source.write(chunk("Visible before completion."));
    const fixture = await apiFixture(t, async () => streaming(source.body));
    const response = await fixture.request();
    assert.match(response.headers.get("content-type"), /text\/event-stream/);
    assert.equal(response.headers.get("x-accel-buffering"), "no");
    assert.equal(response.headers.get("content-encoding"), "identity");
    const iterator = readSSE(response.body)[Symbol.asyncIterator]();
    assert.equal((await iterator.next()).value.event, "meta");
    assert.equal(
      JSON.parse((await iterator.next()).value.data).text,
      "Visible before completion.",
    );
    assert.equal(source.cancelled, false);
    source.write(ending);
    source.close();
    const remaining = await collect(iterator);
    assert.equal(remaining.at(-1).event, "done");
  },
);
test(
  "disconnecting the HTTP client aborts the upstream model request",
  { timeout: 5000 },
  async (t) => {
    const source = controlled();
    let notifyAbort;
    const aborted = new Promise((resolve) => {
      notifyAbort = resolve;
    });
    const fixture = await apiFixture(t, async (url, options) => {
      options.signal.addEventListener("abort", notifyAbort, { once: true });
      return streaming(source.body);
    });
    const controller = new AbortController();
    const response = await fixture.request(controller.signal);
    const iterator = readSSE(response.body)[Symbol.asyncIterator]();
    assert.equal((await iterator.next()).value.event, "meta");
    controller.abort();
    await aborted;
    await iterator.return().catch(() => {});
    assert.equal(source.cancelled, true);
  },
);
