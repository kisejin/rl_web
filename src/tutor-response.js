import { readSSE } from "./sse.js";
// Read real network deltas. JSON remains supported for older server deployments.
export async function readTutorResponse(
  response,
  { onDelta, onMeta, signal } = {},
) {
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/event-stream")
  ) {
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The tutor returned an unreadable response. Please retry.",
      );
    }
    if (!response.ok)
      throw new Error(data.error || "The tutor is unavailable. Please retry.");
    if (typeof data.reply !== "string" || !data.reply.trim())
      throw new Error("No answer was returned. Please retry.");
    onMeta?.(data);
    onDelta?.(data.reply.slice(0, 14000));
    return {
      model: data.model,
      truncated: !!data.truncated || data.reply.length > 14000,
    };
  }
  let model,
    count = 0;
  for await (const frame of readSSE(response.body, { signal })) {
    let data;
    try {
      data = JSON.parse(frame.data);
    } catch {
      throw new Error("The tutor returned an unreadable stream. Please retry.");
    }
    if (frame.event === "meta") {
      model = data.model;
      onMeta?.(data);
    } else if (frame.event === "delta") {
      if (typeof data.text !== "string")
        throw new Error(
          "The tutor returned an unreadable stream. Please retry.",
        );
      const text = data.text.slice(0, 14000 - count);
      count += text.length;
      if (text) onDelta?.(text);
      if (text.length < data.text.length)
        throw new Error("The answer exceeded its display limit. Please retry.");
    } else if (frame.event === "error")
      throw new Error(
        typeof data.error === "string"
          ? data.error.slice(0, 300)
          : "The answer was interrupted. Please retry.",
      );
    else if (frame.event === "done") {
      if (!count) throw new Error("No answer was returned. Please retry.");
      return { model, truncated: !!data.truncated };
    }
  }
  throw new Error(
    "The connection ended before the answer finished. Please retry.",
  );
}
