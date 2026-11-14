import { createServer } from "node:http";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { findTutorModel } from "../../src/tutor-models.js";
import { runHarnessCompletion } from "./engine.js";

const digest = (value) => createHash("sha256").update(value).digest();
export function validateCompletion(body) {
  if (
    !body ||
    !findTutorModel(body.model) ||
    typeof body.stream !== "boolean" ||
    !Array.isArray(body.messages) ||
    body.messages.length < 2 ||
    body.messages.length > 13 ||
    body.messages[0]?.role !== "system" ||
    body.messages.at(-1)?.role !== "user"
  )
    throw new Error("Invalid completion request.");
  const messages = body.messages.map((message, index) => {
    if (
      !message ||
      ![...(index === 0 ? ["system"] : ["user", "assistant"])].includes(
        message.role,
      ) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length >
        (index === 0 ? 40000 : message.role === "user" ? 2000 : 14000)
    )
      throw new Error("Invalid conversation message.");
    return { role: message.role, content: message.content };
  });
  if (
    body.max_tokens !== undefined &&
    (!Number.isInteger(body.max_tokens) ||
      body.max_tokens < 1 ||
      body.max_tokens > 1800)
  )
    throw new Error("Invalid output limit.");
  return {
    model: body.model,
    stream: body.stream,
    messages,
    max_tokens: body.max_tokens ?? 1800,
  };
}
export function createHarnessHandler({
  token = process.env.HARNESS_BRIDGE_TOKEN,
  apiKey = process.env.QWENCODER_API_KEY,
  baseUrl = process.env.QWENCODER_BASE_URL ||
    "https://api.qwencoder.cloud/api/v1",
  maxConcurrent = 2,
  fetchImpl,
} = {}) {
  if (!token || token.length < 32 || !apiKey)
    throw new Error(
      "Set HARNESS_BRIDGE_TOKEN (at least 32 characters) and QWENCODER_API_KEY before starting.",
    );
  const upstream = new URL(baseUrl);
  if (
    upstream.protocol !== "https:" &&
    !(
      upstream.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(upstream.hostname)
    )
  )
    throw new Error("Use an HTTPS model gateway.");
  const expected = digest("Bearer " + token);
  let active = 0;
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const json = (status, body) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/healthz")
      return json(200, {
        status: "ready",
        runtime: "deepseek-harness",
        version: "0.2.2-rc.3",
      });
    if (req.url !== "/v1/chat/completions")
      return json(404, { error: { message: "Not found." } });
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(405, { error: { message: "Use POST." } });
    }
    if (
      !timingSafeEqual(
        expected,
        digest(String(req.headers.authorization || "")),
      )
    )
      return json(401, { error: { message: "Unauthorized." } });
    if (active >= maxConcurrent) {
      res.setHeader("Retry-After", "5");
      return json(429, { error: { message: "The Harness runtime is busy." } });
    }
    if (!String(req.headers["content-type"]).includes("application/json"))
      return json(415, { error: { message: "Send JSON." } });
    active++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const disconnect = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on("close", disconnect);
    req.on("aborted", disconnect);
    let streaming = false;
    const event = (data) => {
      if (controller.signal.aborted || res.destroyed)
        throw new Error("Request stopped.");
      res.write(
        "data: " +
          (typeof data === "string" ? data : JSON.stringify(data)) +
          "\n\n",
      );
    };
    try {
      let size = 0;
      const chunks = [];
      // Vercel parses JSON before calling a function; Docker receives a stream.
      if (req.body !== undefined) {
        const value =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        size = Buffer.byteLength(value);
        if (size > 64000)
          return json(413, { error: { message: "Request is too large." } });
        chunks.push(Buffer.from(value));
      } else {
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 64000)
            return json(413, { error: { message: "Request is too large." } });
          chunks.push(chunk);
        }
      }
      let body;
      try {
        body = validateCompletion(
          JSON.parse(Buffer.concat(chunks).toString("utf8")),
        );
      } catch {
        return json(400, { error: { message: "Invalid completion request." } });
      }
      streaming = body.stream;
      const id = "chatcmpl-" + randomUUID();
      if (streaming) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-store, no-transform");
        res.setHeader("Content-Encoding", "identity");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders();
      }
      const delta = (content, finish_reason = null) => ({
        id,
        object: "chat.completion.chunk",
        model: body.model,
        choices: [
          { index: 0, delta: content ? { content } : {}, finish_reason },
        ],
      });
      const result = await runHarnessCompletion(body, {
        apiKey,
        baseUrl,
        fetchImpl,
        signal: controller.signal,
        onText: (text) => {
          if (streaming) event(delta(text));
        },
      });
      const finish = result.truncated ? "length" : "stop";
      if (streaming) {
        event(delta("", finish));
        event("[DONE]");
        res.end();
      } else
        json(200, {
          id,
          object: "chat.completion",
          model: body.model,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: result.text },
              finish_reason: finish,
            },
          ],
        });
    } catch {
      // Do not log or relay SDK/provider exceptions: they may contain prompts,
      // credentials, local paths or gateway account diagnostics.
      if (res.destroyed) return;
      const message =
        "The Harness runtime could not finish the answer. Please retry.";
      if (streaming && res.headersSent) {
        if (!controller.signal.aborted) event({ error: { message } });
        res.end();
      } else json(502, { error: { message } });
    } finally {
      clearTimeout(timer);
      res.removeListener("close", disconnect);
      req.removeListener("aborted", disconnect);
      active--;
    }
  };
}
export function createHarnessServer(options) {
  return createServer(createHarnessHandler(options));
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = createHarnessServer();
  server.requestTimeout = 60000;
  server.headersTimeout = 10000;
  const port = Number(process.env.PORT || 3080);
  server.listen(port, "0.0.0.0", () =>
    console.log(`RL Atlas Harness runtime listening on port ${port}`),
  );
  process.on("SIGTERM", () => {
    server.close();
    server.closeAllConnections();
  });
}
