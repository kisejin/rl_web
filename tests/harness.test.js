import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import handler from "../api/harness.js";

test("Vercel Harness handler accepts parsed bodies, protects its endpoint and runs the real core", async (t) => {
  const keys = [
    "QWENCODER_API_KEY",
    "QWENCODER_BASE_URL",
    "HARNESS_BRIDGE_TOKEN",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  for (const key of keys) delete process.env[key];
  t.after(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
  let calls = 0;
  const provider = createServer(async (req, res) => {
    calls++;
    assert.equal(req.headers.authorization, "Bearer test-provider-private");
    let body = "";
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body);
    assert.equal(data.messages[0].content, "Teach reinforcement learning.");
    assert.equal(data.messages.at(-1).content, "Explain discounting.");
    res.setHeader("Content-Type", "text/event-stream");
    res.end(
      'data: {"choices":[{"delta":{"content":"Discounting makes the operator contractive."}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    );
  });
  await new Promise((resolve) => provider.listen(0, "127.0.0.1", resolve));
  const vercel = createServer(async (req, res) => {
    if (req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try {
        req.body = JSON.parse(raw);
      } catch {
        req.body = raw;
      }
    }
    await handler(req, res);
  });
  await new Promise((resolve) => vercel.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    provider.closeAllConnections();
    vercel.closeAllConnections();
    await Promise.all([
      new Promise((resolve) => provider.close(resolve)),
      new Promise((resolve) => vercel.close(resolve)),
    ]);
  });
  const url = `http://127.0.0.1:${vercel.address().port}/api/harness`;
  assert.equal((await fetch(url)).status, 503);
  process.env.QWENCODER_API_KEY = "test-provider-private";
  process.env.QWENCODER_BASE_URL = `http://127.0.0.1:${provider.address().port}/v1`;
  process.env.HARNESS_BRIDGE_TOKEN = "test-private-bridge-" + "x".repeat(40);
  const health = await fetch(url);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).runtime, "deepseek-harness");
  assert.equal((await fetch(url, { method: "POST", body: "{}" })).status, 401);
  const headers = {
    Authorization: "Bearer " + process.env.HARNESS_BRIDGE_TOKEN,
    "Content-Type": "application/json",
  };
  assert.equal(
    (await fetch(url, { method: "POST", headers, body: "{}" })).status,
    400,
  );
  assert.equal(
    (
      await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ payload: "x".repeat(64000) }),
      })
    ).status,
    413,
  );
  assert.equal(calls, 0);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "qwen3.8-flash",
      stream: true,
      max_tokens: 1800,
      messages: [
        { role: "system", content: "Teach reinforcement learning." },
        { role: "user", content: "Explain discounting." },
      ],
    }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const text = await response.text();
  assert.match(text, /Discounting makes the operator contractive/);
  assert.match(text, /\[DONE\]/);
  assert.equal(text.includes(process.env.QWENCODER_API_KEY), false);
  assert.equal(calls, 1);
});
