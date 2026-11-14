import { randomUUID, createHash } from "node:crypto";
import { Context } from "@deepseek-ai/cordis";
import AgentRegistry from "@deepseek-ai/dsh-agent";
import AgentLoop from "@deepseek-ai/dsh-agent-loop";
import LlmRuntime, {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
} from "@deepseek-ai/dsh-llm";
import SessionStore from "@deepseek-ai/dsh-session";
import SessionProjectionRegistry from "@deepseek-ai/dsh-session-projection";
import SystemPrompt from "@deepseek-ai/dsh-system-prompt";
import ToolRuntime from "@deepseek-ai/dsh-tools";
import * as NativeToolExecutor from "@deepseek-ai/dsh-tool-executor-native";
import { GatewayAdapter } from "../../server/harness-gateway.js";
import { createTutorMCP } from "../../server/tutor-mcp.js";

export async function runHarnessCompletion(
  body,
  { signal, onText = () => {}, onAgent = () => {}, ...gateway },
) {
  const ctx = new Context();
  let mcp,
    toolCount = 0;
  const images = new Map();
  const attachments = body.rl_atlas?.attachments || [];
  const imageBlocks = attachments
    .filter((f) => f.kind === "image")
    .map((file) => {
      const bytes = Buffer.from(file.dataUrl.split(",")[1], "base64");
      const attachmentId = createHash("sha256").update(bytes).digest("hex");
      images.set(attachmentId, file.dataUrl);
      return {
        type: "image",
        attachment: {
          attachmentId,
          mediaType: file.dataUrl.startsWith("data:image/png;")
            ? "image/png"
            : "image/jpeg",
          bytes: bytes.length,
          width: file.width,
          height: file.height,
          name: file.name,
        },
      };
    });
  let handle,
    failure,
    finish,
    text = "";
  const cancel = () => handle?.agent.cancel();
  signal?.throwIfAborted();
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    for (const plugin of [LlmRuntime, SessionStore, SessionProjectionRegistry])
      await ctx.plugin(plugin);
    await ctx.plugin(SystemPrompt, {
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
    });
    ctx.systemPrompt.section({
      name: "rl-atlas",
      order: 0,
      text: body.messages[0].content,
      interpolate: false,
      complete: true,
    });
    for (const plugin of [ToolRuntime, NativeToolExecutor, AgentRegistry])
      await ctx.plugin(plugin);
    await ctx.plugin(AgentLoop, { agents: [] });
    ctx.llm.registerAdapter(
      ["rl-atlas-gateway"],
      new GatewayAdapter({ ...gateway, images }),
    );
    if (body.rl_atlas?.enabled) {
      mcp = await createTutorMCP({
        options: body.rl_atlas,
        attachments,
        onAgent,
        fetchImpl: gateway.fetchImpl,
        signal,
      });
      for (const tool of mcp.tools)
        ctx.tools.register({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => [
              { type: "text", text: JSON.stringify(value) },
            ],
          },
          async execute(args, exec) {
            if (++toolCount > 8)
              throw new Error("The request reached its tool-call limit.");
            onAgent({ type: "tool", name: tool.name, status: "running" });
            try {
              const result = await mcp.client.callTool(
                { name: tool.name, arguments: args },
                undefined,
                { signal: exec.signal, timeout: 9000 },
              );
              if (result.isError) throw new Error("MCP tool failed.");
              const value = JSON.parse(
                result.content.find((p) => p.type === "text")?.text || "{}",
              );
              onAgent({ type: "tool", name: tool.name, status: "done" });
              return value;
            } catch {
              onAgent({ type: "tool", name: tool.name, status: "error" });
              throw new Error(
                "This tool could not complete. Do not invent its results.",
              );
            }
          },
        });
    }
    ctx.on("agent/pre-step", async (_payload, next) => {
      if (text) {
        text += "\n\n";
        onText("\n\n");
      }
      return next();
    });
    ctx.on("agent/error", () => {
      failure = new Error("The Harness model request failed.");
    });
    ctx.on("agent/assistant-stream", ({ frame }) => {
      if (frame.type !== "chunk") return;
      if (frame.chunk.type === "text-delta") {
        text += frame.chunk.text;
        onText(frame.chunk.text);
      }
      if (frame.chunk.type === "finish") {
        finish = frame.chunk.reason.kind;
        if (!["stop", "max-tokens", "tool-calls"].includes(finish))
          failure = new Error("The Harness answer did not finish.");
      }
    });
    handle = await ctx.agents.create({
      sessionId: randomUUID(),
      agentOptions: {
        provider: "rl-atlas-gateway",
        model: body.model,
        maxTokens: body.max_tokens,
      },
      setup: (_agentCtx, agent) => {
        agent.session.append(
          "system/message",
          {
            turn: 1,
            step: 1,
            message: createSystemMessage(body.messages[0].content),
          },
          { surfaceOp: "append" },
        );
        // Import prior text-only conversation into this request's private session.
        // The browser owns durable history; no sessions are shared across requests.
        for (const message of body.messages.slice(1, -1)) {
          const content = [{ type: "text", text: message.content }];
          if (message.role === "user") {
            agent.session.append(
              "user/message",
              createUserMessage({ content, source: { kind: "user" } }),
              { surfaceOp: "append" },
            );
          } else {
            agent.session.append(
              "assistant/message",
              {
                turn: 1,
                step: 1,
                stream: [],
                message: createAssistantMessage({
                  content,
                  source: { provider: "rl-atlas-gateway", model: body.model },
                }),
              },
              { surfaceOp: "append" },
            );
          }
        }
      },
    });
    signal?.throwIfAborted();
    handle.agent.followup(
      createUserMessage({
        content: [
          { type: "text", text: body.messages.at(-1).content },
          ...imageBlocks,
        ],
        source: { kind: "user" },
      }),
    );
    await handle.agent.whenIdle();
    signal?.throwIfAborted();
    if (failure) throw failure;
    if (!text.trim() || !["stop", "max-tokens"].includes(finish))
      throw new Error("The Harness returned no completed answer.");
    return {
      text,
      truncated: finish === "max-tokens",
      ...(mcp ? { agentState: mcp.state } : {}),
    };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await ctx.fiber.dispose();
    await mcp?.close();
  }
}
