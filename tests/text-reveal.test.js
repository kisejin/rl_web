import test from "node:test";
import assert from "node:assert/strict";
import { createTextReveal } from "../src/text-reveal.js";

function harness(options = {}) {
  const tasks = new Map();
  const updates = [];
  let id = 0;
  const reveal = createTextReveal({
    onUpdate: (text) => updates.push(text),
    schedule: (fn) => {
      tasks.set(++id, fn);
      return id;
    },
    unschedule: (key) => tasks.delete(key),
    ...options,
  });
  function drain() {
    let ticks = 0;
    while (tasks.size) {
      assert.ok(++ticks < 500, "backlog should catch up promptly");
      const [key, fn] = tasks.entries().next().value;
      tasks.delete(key);
      fn();
    }
    return ticks;
  }
  return { reveal, updates, tasks, drain };
}

test("batched output reveals a prefix immediately and preserves all text across deltas", async () => {
  const h = harness();
  const first = "Hello  world!\n\n" + "word ".repeat(200);
  const second = "Tiếng Việt 🧠\n```python\nx = 1\n```\n\\[V(s)\\]";
  h.reveal.push(first);
  assert.ok(h.reveal.text.length > 0 && h.reveal.text.length < first.length);
  h.reveal.push(second);
  const finished = h.reveal.finish();
  assert.ok(h.drain() < 150);
  assert.equal(await finished, first + second);
  for (const update of h.updates)
    assert.ok((first + second).startsWith(update));
  h.reveal.cancel();
});

test("abort discards queued words and retains only the visible prefix", async () => {
  const controller = new AbortController();
  const h = harness({ signal: controller.signal });
  h.reveal.push("word ".repeat(500));
  const shown = h.reveal.text;
  const finished = h.reveal.finish();
  controller.abort();
  await assert.rejects(finished, { name: "AbortError" });
  h.reveal.push("must not appear");
  h.drain();
  assert.equal(h.reveal.text, shown);
  assert.equal(h.tasks.size, 0);
});

test("reduced motion reveals incoming batches immediately", async () => {
  const h = harness({ immediate: true });
  h.reveal.push("first ".repeat(100));
  assert.equal(h.reveal.text, "first ".repeat(100));
  h.reveal.push("next");
  assert.equal(await h.reveal.finish(), "first ".repeat(100) + "next");
  assert.equal(h.tasks.size, 0);
  h.reveal.cancel();
});

test("long unspaced output preserves graphemes and exact content", async () => {
  const h = harness();
  const grapheme = "👨‍👩‍👧‍👦";
  const text = grapheme.repeat(150);
  h.reveal.push(text);
  const finished = h.reveal.finish();
  h.drain();
  assert.equal(await finished, text);
  for (const update of h.updates)
    assert.equal(update.split(grapheme).join(""), "");
  h.reveal.cancel();
});
