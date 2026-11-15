// Run inside the built, non-root Docker image with external networking disabled.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createHarnessServer } from "./server.js";
const key = "container-test-only-provider-key";
const token = "container-test-only-bridge-token-" + "x".repeat(32);
let complete, providerMessages;
const gateway = createServer(async (req, res) => {
  assert.equal(req.headers.authorization, "Bearer " + key);
  assert.match(req.headers["user-agent"], /deepseek-harness/);
  let body = "";
  for await (const chunk of req) body += chunk;
  providerMessages = JSON.parse(body).messages;
  assert.ok(
    JSON.parse(body).tools.some((t) => t.function.name === "course_search"),
  );
  res.setHeader("Content-Type", "text/event-stream");
  res.write(
    'data: {"choices":[{"delta":{"content":"Container streaming works."}}]}\n\n',
  );
  complete = () =>
    res.end(
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    );
});
gateway.listen(0, "127.0.0.1");
await once(gateway, "listening");
const runtime = createHarnessServer({
  token,
  apiKey: key,
  baseUrl: `http://127.0.0.1:${gateway.address().port}/v1`,
});
runtime.listen(0, "127.0.0.1");
await once(runtime, "listening");
const base = `http://127.0.0.1:${runtime.address().port}`;
try {
  assert.notEqual(process.getuid(), 0);
  assert.equal((await fetch(base + "/healthz")).status, 200);
  assert.equal(
    (await fetch(base + "/v1/chat/completions", { method: "POST" })).status,
    401,
  );
  const messages = [
    { role: "system", content: "Teach RL with LaTeX." },
    { role: "user", content: "Explain discounting." },
  ];
  const response = await fetch(base + "/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.8-flash",
      messages,
      max_tokens: 1800,
      stream: true,
      rl_atlas: {
        enabled: true,
        mode: "ask",
        skill: "proof",
        webSearch: false,
        state: { steps: [] },
        attachments: [],
      },
    }),
  });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  let first = "";
  while (!first.includes("Container streaming works.")) {
    const next = await reader.read();
    assert.equal(next.done, false);
    first += new TextDecoder().decode(next.value);
  }
  assert.match(first, /Built-in MCP connected/);
  assert.match(first, /Loaded skill/);
  assert.match(first, /Container streaming works/);
  assert.equal(first.includes("[DONE]"), false);
  assert.deepEqual(providerMessages, messages);
  complete();
  let tail = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    tail += new TextDecoder().decode(value);
  }
  assert.match(tail, /\[DONE\]/);
  assert.equal((first + tail).includes(key), false);
  console.log(
    "PASS: built Docker image runs the official Harness core as non-root, with read-only filesystem and no external network; authenticated SSE arrives before provider completion.",
  );
} finally {
  runtime.closeAllConnections();
  gateway.closeAllConnections();
  await Promise.all([
    new Promise((resolve) => runtime.close(resolve)),
    new Promise((resolve) => gateway.close(resolve)),
  ]);
}

// The optional server can discuss collected abstracts without external network access.
const { createTutorMCP } = await import("../../server/tutor-mcp.js");
const { loadPaperLibrary } = await import("../../server/paper-library.js");
const collection = await loadPaperLibrary();
assert.equal(collection.source, "bundled");
const papersMcp = await createTutorMCP({
  options: {
    mode: "ask",
    skill: "intuition",
    webSearch: false,
    state: { steps: [] },
  },
});
try {
  const result = await papersMcp.client.callTool({
    name: "read_paper",
    arguments: { id: collection.papers[0].id },
  });
  assert.match(result.content[0].text, /Full paper\/PDF has NOT been read/);
  console.log(
    "PASS: built Docker image reads the collected paper library through MCP without network or filesystem writes.",
  );
} finally {
  await papersMcp.close();
}
