import test from "node:test";
import assert from "node:assert/strict";
import { visualChapters, visualModel } from "../src/visuals.js";
import { closeEnough } from "../src/engine.js";
import { lessons } from "../src/content.js";
test("every lesson has its own mathematical visualization and rubric has KL", () => {
  for (const lesson of lessons) assert.ok(visualChapters[lesson.id]);
  assert.ok(visualChapters.kl);
  for (const [id, c] of Object.entries(visualChapters))
    for (const p of [c.min, c.value, c.max])
      for (let k = 0; k < c.steps.length; k++) {
        const model = visualModel(id, k, p);
        assert.equal(model.step, k);
        const check = (v) => {
          if (typeof v === "number")
            assert.ok(Number.isFinite(v), `${id}: non-finite value`);
          else if (Array.isArray(v)) v.forEach(check);
          else if (v && typeof v === "object") Object.values(v).forEach(check);
        };
        check(model);
      }
});
test("discounted return and expectation use the actual parameter", () => {
  assert.ok(closeEnough(visualModel("foundations", 4, 0.5).total, 3.25));
  assert.equal(visualModel("probability", 4, 0.25).expected, 2.5);
  assert.ok(closeEnough(visualModel("mdp", 4, 0.7).expected, 5.5));
});
test("Bellman animation exhibits contraction at each frame", () => {
  for (const gamma of [0.2, 0.75, 0.9])
    for (let k = 1; k <= 5; k++) {
      const prev = visualModel("bellman", k - 1, gamma),
        m = visualModel("bellman", k, gamma);
      assert.ok(closeEnough(m.gap, gamma * prev.gap));
      assert.ok(closeEnough(m.b - m.a, m.gap));
      assert.ok(closeEnough(m.a, 1 + gamma * prev.a));
    }
});
test("synchronous DP propagates reward exactly one edge per sweep", () => {
  assert.deepEqual(visualModel("dp", 1, 0.5).values, [0, 0, 0, 10, 0]);
  assert.deepEqual(visualModel("dp", 2, 0.5).values, [0, 0, 5, 10, 0]);
  assert.deepEqual(visualModel("dp", 4, 0.5).values, [1.25, 2.5, 5, 10, 0]);
});
test("TD terminal mask and REINFORCE update match their equations", () => {
  assert.ok(closeEnough(visualModel("td", 3, 0.5).updated, 3.3));
  assert.equal(visualModel("td", 4, 0.5).updated, 1.5);
  assert.ok(
    closeEnough(visualModel("policy", 4, 1).next, 1 / (1 + Math.exp(-1))),
  );
});
test("potential shaping telescopes at all supported discounts", () => {
  for (const gamma of [0.1, 0.5, 0.9, 0.95]) {
    const m = visualModel("reward", 4, gamma);
    assert.ok(closeEnough(m.offset, -3));
    assert.ok(closeEnough(m.shaped - m.original, -3));
  }
});
test("rubric gate and KL penalty are numerically correct", () => {
  assert.ok(closeEnough(visualModel("rubric", 3, 0.9).reward, 0.76));
  assert.equal(visualModel("rubric", 4, 0.9).reward, 0);
  const low = visualModel("kl", 5, 0),
    high = visualModel("kl", 5, 2);
  assert.ok(low.kl >= 0);
  assert.ok(low.next > 0.8);
  assert.ok(high.next < 0.8);
});

test("every animation equation renders at every step and parameter endpoint", async () => {
  const { visualFrame } = await import("../src/visuals.js");
  const { default: katex } = await import("katex");
  for (const [id, c] of Object.entries(visualChapters))
    for (const p of [c.min, c.value, c.max])
      for (let k = 0; k < c.steps.length; k++) {
        const frame = visualFrame(id, k, p);
        assert.ok(frame.narration.trim());
        assert.doesNotThrow(
          () => katex.renderToString(frame.equation, { throwOnError: true }),
          `${id}, step ${k}, parameter ${p}`,
        );
      }
});
