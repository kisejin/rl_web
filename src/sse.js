// Incremental SSE decoding shared by the provider proxy and browser client.
// UTF-8 characters, CRLF lines, and events may all cross network chunk boundaries.
export async function* readSSE(body, { signal, maxEventSize = 262144 } = {}) {
  if (!body?.getReader) throw new Error("A readable event stream is required.");
  const reader = body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    data = [],
    event = "",
    size = 0;
  const aborted = () => {
    if (signal?.aborted)
      throw signal.reason || new DOMException("Aborted", "AbortError");
  };
  const cancel = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  function line(text) {
    if (text.length > maxEventSize)
      throw new Error("Event stream frame is too large.");
    if (!text) {
      const frame = data.length
        ? { event: event || "message", data: data.join("\n") }
        : null;
      data = [];
      event = "";
      size = 0;
      return frame;
    }
    if (text.startsWith(":")) return null;
    size += text.length;
    if (size > maxEventSize)
      throw new Error("Event stream frame is too large.");
    const colon = text.indexOf(":"),
      field = colon < 0 ? text : text.slice(0, colon);
    let value = colon < 0 ? "" : text.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") data.push(value);
    else if (field === "event") event = value;
    return null;
  }
  try {
    while (true) {
      aborted();
      const { value, done } = await reader.read();
      aborted();
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      while (true) {
        const index = buffer.search(/[\r\n]/);
        if (
          index < 0 ||
          (!done && index === buffer.length - 1 && buffer[index] === "\r")
        )
          break;
        const text = buffer.slice(0, index);
        const width =
          buffer[index] === "\r" && buffer[index + 1] === "\n" ? 2 : 1;
        buffer = buffer.slice(index + width);
        const frame = line(text);
        if (frame) yield frame;
      }
      if (buffer.length > maxEventSize)
        throw new Error("Event stream frame is too large.");
      if (done) break;
    }
    if (buffer) {
      const frame = line(buffer);
      if (frame) yield frame;
    }
    const last = line("");
    if (last) yield last;
  } finally {
    signal?.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
