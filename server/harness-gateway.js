import { randomUUID } from "node:crypto";
import { LlmAdapter, attributionHeaders } from "@deepseek-ai/dsh-llm";
import { readSSE } from "../src/sse.js";
import { secretFilter } from "./secret-filter.js";

export class GatewayAdapter extends LlmAdapter {
  constructor({ apiKey, baseUrl, fetchImpl = fetch, images = new Map() }) {
    super();
    Object.assign(this, { apiKey, baseUrl, fetchImpl, images });
    this.calls = 0;
  }
  async resolveModel(provider, model) {
    return {
      provider,
      id: model,
      name: model,
      ...(this.images.size ? { inputModalities: ["text", "image"] } : {}),
    };
  }
  async *stream(options) {
    if (++this.calls > 4)
      throw new Error("The agent reached its four-step request limit.");
    const messages = options.messages.map((message) => {
      const text = message.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (message.role === "tool")
        return {
          role: "tool",
          tool_call_id: message.toolCallId,
          content: text,
        };
      const calls = message.content
        .filter((b) => b.type === "tool-call")
        .map((b) => ({
          id: b.id,
          type: "function",
          function: { name: b.name, arguments: b.arguments },
        }));
      const images = message.content
        .filter((b) => b.type === "image")
        .map((b) => ({
          type: "image_url",
          image_url: {
            url: this.images.get(b.attachment.attachmentId),
            detail: "auto",
          },
        }));
      return {
        role: message.role,
        content: images.length ? [{ type: "text", text }, ...images] : text,
        ...(calls.length ? { tool_calls: calls } : {}),
      };
    });
    const tools = options.tools?.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
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
          ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
        }),
        signal: options.signal,
      },
    );
    if (!response.ok)
      throw new Error(
        "The selected model could not process this request. Try Gemini Flash for images or a model supporting tools.",
      );
    const filter = secretFilter(this.apiKey),
      calls = new Map();
    let text = "",
      textIndex = null,
      nextIndex = 0,
      finished = false,
      reason = null,
      limited = false;
    const append = (part) => {
      const piece = part.slice(0, 14000 - text.length);
      text += piece;
      if (text.length >= 14000) limited = true;
      return piece;
    };
    const self = this;
    async function* consume(choice, json = false) {
      const delta = json ? choice?.message : choice?.delta;
      const content = delta?.content;
      const raw =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .filter((p) => p.type === "text")
                .map((p) => p.text || "")
                .join("")
            : "";
      if (raw) {
        const piece = append(filter.push(raw));
        if (piece) {
          if (textIndex === null) {
            textIndex = nextIndex++;
            yield { type: "block-start", index: textIndex, blockType: "text" };
          }
          yield { type: "text-delta", index: textIndex, text: piece };
        }
      }
      for (const part of delta?.tool_calls || []) {
        const key = part.index ?? calls.size;
        let call = calls.get(key);
        if (!call) {
          if (calls.size >= 6 || !part.id || String(part.id).length > 128)
            throw new Error("Invalid model tool call.");
          call = {
            id: part.id || "call_" + randomUUID(),
            index: nextIndex++,
            name: "",
            arguments: "",
          };
          calls.set(key, call);
          yield {
            type: "block-start",
            index: call.index,
            blockType: "tool-call",
          };
        }
        call.name += part.function?.name || "";
        const args = part.function?.arguments || "";
        if (
          typeof args !== "string" ||
          call.arguments.length + args.length > 12000 ||
          call.name.length > 80
        )
          throw new Error("Tool arguments are too large.");
        call.arguments += args;
        yield {
          type: "tool-call-delta",
          index: call.index,
          id: call.id,
          ...(call.name ? { name: call.name } : {}),
          argumentsDelta: args,
        };
      }
      if (choice?.finish_reason) {
        reason = choice.finish_reason;
        finished = true;
      }
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
      const data = await response.json();
      if (data.error) throw new Error("Gateway failure.");
      yield* consume(data.choices?.[0], true);
      finished = true;
      reason ||= "stop";
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
        yield* consume(data.choices?.[0]);
        if (limited || finished) break;
      }
    }
    const tail = append(filter.finish());
    if (tail) {
      if (textIndex === null) {
        textIndex = nextIndex++;
        yield { type: "block-start", index: textIndex, blockType: "text" };
      }
      yield { type: "text-delta", index: textIndex, text: tail };
    }
    if ((!finished && !limited) || (!text.trim() && !calls.size))
      throw new Error("The model connection ended before completion.");
    if (reason && !["stop", "length", "tool_calls"].includes(reason))
      throw new Error("The model could not complete this request.");
    if (textIndex !== null)
      yield {
        type: "block-end",
        index: textIndex,
        block: { type: "text", text },
      };
    for (const call of calls.values()) {
      if (!call.name) throw new Error("The model returned an unnamed tool.");
      yield {
        type: "block-end",
        index: call.index,
        block: {
          type: "tool-call",
          id: call.id,
          name: call.name,
          arguments: call.arguments.replaceAll(self.apiKey, "[redacted]"),
        },
      };
    }
    yield {
      type: "finish",
      reason: {
        kind:
          limited || reason === "length"
            ? "max-tokens"
            : calls.size
              ? "tool-calls"
              : "stop",
      },
    };
  }
}
