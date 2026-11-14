// Presentation queue for incoming network deltas. Reveals words immediately as
// data arrives, and catches up adaptively when a provider batches many tokens.
export function createTextReveal({
  onUpdate,
  signal,
  immediate = false,
  interval = 24,
  schedule = setTimeout,
  unschedule = clearTimeout,
}) {
  let pieces = [],
    head = 0,
    visible = "",
    timer = null,
    stopped = false,
    reason = null,
    waiters = [];
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  const settle = () => {
    if (head < pieces.length) return;
    pieces = [];
    head = 0;
    for (const waiter of waiters) waiter.resolve(visible);
    waiters = [];
  };
  function tick() {
    timer = null;
    if (stopped) return;
    const remaining = pieces.length - head;
    const count = immediate
      ? remaining
      : Math.max(1, Math.ceil(remaining / 32));
    if (remaining) {
      visible += pieces.slice(head, head + count).join("");
      head = Math.min(pieces.length, head + count);
      onUpdate(visible);
    }
    if (head < pieces.length) timer = schedule(tick, interval);
    else settle();
  }
  function cancel(error = new DOMException("Stopped", "AbortError")) {
    if (stopped) return;
    stopped = true;
    reason = error;
    unschedule(timer);
    timer = null;
    pieces = [];
    head = 0;
    signal?.removeEventListener("abort", onAbort);
    for (const waiter of waiters) waiter.reject(error);
    waiters = [];
  }
  const onAbort = () =>
    cancel(signal.reason || new DOMException("Stopped", "AbortError"));
  signal?.addEventListener("abort", onAbort, { once: true });
  if (signal?.aborted) onAbort();
  return {
    push(text) {
      if (stopped || !text) return;
      for (const piece of text.match(/\s*\S+\s*|\s+/gu) || []) {
        if (piece.length <= 64) pieces.push(piece);
        else {
          const units = segmenter
            ? [...segmenter.segment(piece)].map((item) => item.segment)
            : Array.from(piece);
          for (let i = 0; i < units.length; i += 16)
            pieces.push(units.slice(i, i + 16).join(""));
        }
      }
      if (timer === null) tick();
    },
    finish() {
      if (stopped) return Promise.reject(reason);
      if (head >= pieces.length) return Promise.resolve(visible);
      return new Promise((resolve, reject) =>
        waiters.push({ resolve, reject }),
      );
    },
    cancel,
    get text() {
      return visible;
    },
  };
}
