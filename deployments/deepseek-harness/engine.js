import { randomUUID } from "node:crypto";
import { Context } from "@deepseek-ai/cordis";
import AgentRegistry from "@deepseek-ai/dsh-agent";
import AgentLoop from "@deepseek-ai/dsh-agent-loop";
import LlmRuntime, {
  LlmAdapter,
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  attributionHeaders,
} from "@deepseek-ai/dsh-llm";
import SessionStore from "@deepseek-ai/dsh-session";
import SessionProjectionRegistry from "@deepseek-ai/dsh-session-projection";
import SystemPrompt from "@deepseek-ai/dsh-system-prompt";
import ToolRuntime from "@deepseek-ai/dsh-tools";
import * as NativeToolExecutor from "@deepseek-ai/dsh-tool-executor-native";
import { readSSE } from "../../src/sse.js";
import { secretFilter } from "../../server/secret-filter.js";

// The official Harness agent loop owns prompt assembly, session history,
// streamed attempts and cancellation. Only an OpenAI transport adapter is custom.
class GatewayAdapter extends LlmAdapter {
  constructor({ apiKey, baseUrl, fetchImpl = fetch }) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
  }
  async *stream(options) {
    const messages = options.messages.map((message) => ({
      role: message.role,
      content: message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join(""),
    }));
    const response = await this.fetchImpl(
      this.baseUrl.replace(/\/$/, "") + "/chat/completions",
      {
        method: "POST",
        headers: {
          ...attributionHeaders(),
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Accept-Encoding": "identity",
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          max_tokens: options.maxTokens,
          stream: true,
        }),
        signal: options.signal,
      },
    );
    if (!response.ok) throw new Error("The model gateway is unavailable.");
    const filter = secretFilter(this.apiKey);
    let text = "",
      started = false,
      finished = false,
      truncated = false;
    const append = (part) => {
      const piece = part.slice(0, 14000 - text.length);
      text += piece;
      if (text.length >= 14000) truncated = true;
      return piece;
    };
    const start = { type: "block-start", index: 0, blockType: "text" };
    if (response.headers.get("content-type")?.includes("application/json")) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim())
        throw new Error("The model gateway returned no answer.");
      yield start;
      started = true;
      const piece = append(filter.push(content) + filter.finish());
      if (piece) yield { type: "text-delta", index: 0, text: piece };
      truncated ||= data.choices[0].finish_reason === "length";
      finished = true;
    } else {
      for await (const frame of readSSE(response.body, {
        signal: options.signal,
      })) {
        if (!frame.data) continue;
        if (frame.data.trim() === "[DONE]") {
          finished = true;
          break;
        }
        const data = JSON.parse(frame.data);
        if (frame.event === "error" || data.error)
          throw new Error("The model gateway interrupted the answer.");
        const choice = data.choices?.[0];
        if (choice?.finish_reason) {
          finished = true;
          truncated ||= choice.finish_reason === "length";
          if (!["stop", "length"].includes(choice.finish_reason))
            throw new Error("The model gateway could not complete the answer.");
        }
        const content = choice?.delta?.content;
        const delta =
          typeof content === "string"
            ? content
            : Array.isArray(content)
              ? content
                  .filter(
                    (part) =>
                      part.type === "text" && typeof part.text === "string",
                  )
                  .map((part) => part.text)
                  .join("")
              : "";
        if (delta) {
          const piece = append(filter.push(delta));
          if (piece) {
            if (!started) {
              yield start;
              started = true;
            }
            yield { type: "text-delta", index: 0, text: piece };
          }
        }
        if (truncated || choice?.finish_reason) break;
      }
      const tail = append(filter.finish());
      if (tail) {
        if (!started) {
          yield start;
          started = true;
        }
        yield { type: "text-delta", index: 0, text: tail };
      }
    }
    if (!text.trim() || (!finished && !truncated))
      throw new Error("The model connection ended before completion.");
    yield { type: "block-end", index: 0, block: { type: "text", text } };
    yield {
      type: "finish",
      reason: { kind: truncated ? "max-tokens" : "stop" },
    };
  }
}

export async function runHarnessCompletion(
  body,
  { signal, onText = () => {}, ...gateway },
) {
  const ctx = new Context();
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
    ctx.llm.registerAdapter(["rl-atlas-gateway"], new GatewayAdapter(gateway));
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
        if (!["stop", "max-tokens"].includes(finish))
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
        content: [{ type: "text", text: body.messages.at(-1).content }],
        source: { kind: "user" },
      }),
    );
    await handle.agent.whenIdle();
    signal?.throwIfAborted();
    if (failure) throw failure;
    if (!text.trim() || !["stop", "max-tokens"].includes(finish))
      throw new Error("The Harness returned no completed answer.");
    return { text, truncated: finish === "max-tokens" };
  } finally {
    signal?.removeEventListener("abort", cancel);
    await ctx.fiber.dispose();
  }
}
