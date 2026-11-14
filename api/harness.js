import { createHarnessHandler } from "../deployments/deepseek-harness/server.js";
export const config = { maxDuration: 60 };

// One private handler per warm function instance. It owns no listener, child
// process or filesystem session. Built-in MCP tools run per request; Vercel owns HTTP and HTTPS.
let runtime;
export default async function handler(req, res) {
  try {
    runtime ??= createHarnessHandler();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error: { message: "The Harness runtime is not configured yet." },
      }),
    );
    return;
  }
  req.url = req.method === "GET" ? "/healthz" : "/v1/chat/completions";
  return runtime(req, res);
}
