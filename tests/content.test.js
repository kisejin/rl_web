import { execFileSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { lessons, labs } from "../src/content.js";
import {
  closeEnough,
  move,
  solveGrid,
  START,
  GOAL,
  TRAP,
  rubricScore,
} from "../src/engine.js";
function pythonCall(lab, args) {
  return JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        lab.solution +
          "\nimport json, sys\nprint(json.dumps(" +
          lab.fn +
          "(*json.load(sys.stdin))))",
      ],
      {
        input: JSON.stringify(args),
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    ),
  );
}
for (const lab of labs) {
  test(`${lab.title}: reference solution passes ${lab.tests.length} cases`, () => {
    const fn = (...args) => pythonCall(lab, args);
    for (const item of lab.tests) {
      if (item.throws) assert.throws(() => fn(...structuredClone(item.args)));
      else
        assert.ok(
          closeEnough(fn(...structuredClone(item.args)), item.expected),
          `${lab.id} ${JSON.stringify(item.args)}`,
        );
    }
  });
}
test("all lesson equations and proof steps render as valid TeX", () => {
  for (const lesson of lessons)
    for (const tex of [
      lesson.eq,
      ...lesson.proof.map((p) => p[1]),
      ...(lesson.extraProof?.steps.map((p) => p[1]) || []),
    ]) {
      assert.doesNotThrow(
        () => katex.renderToString(tex, { throwOnError: true }),
        lesson.id,
      );
    }
});
test("grid boundaries, walls and terminal states obey dynamics", () => {
  assert.equal(move(0, 0), 0);
  assert.equal(move(0, 3), 0);
  assert.equal(move(6, 1), 6);
  assert.equal(move(GOAL, 2), GOAL);
  assert.equal(move(TRAP, 0), TRAP);
});
test("optimal discounted grid policy reaches goal without trap", () => {
  for (const gamma of [0.5, 0.9, 0.99]) {
    const { policy, values } = solveGrid(gamma);
    let state = START;
    let steps = 0;
    while (state !== GOAL && steps < 25) {
      state = move(state, policy[state]);
      steps++;
      assert.notEqual(state, TRAP);
    }
    assert.equal(state, GOAL);
    assert.equal(steps, 8);
    assert.ok(values.every(Number.isFinite));
  }
});
test("rubric playground computes gated weighted mean", () => {
  assert.ok(closeEnough(rubricScore([1, 0.5, 0.8], [0.5, 0.3, 0.2]), 0.81));
  assert.equal(rubricScore([1, 1, 1], [0.5, 0.3, 0.2], false), 0);
});

test("capstone is invariant to additive reward baseline and improves the objective for a small step", () => {
  const lab = labs.find((l) => l.id === "rubric-policy");
  const fn = (...args) => pythonCall(lab, args);
  const a = fn([0.2, -0.1, 0.4], [0.9, 0.3, 0.6], [0.3, 0.3, 0.4], 0.1, 0.01);
  const b = fn([0.2, -0.1, 0.4], [7.9, 7.3, 7.6], [0.3, 0.3, 0.4], 0.1, 0.01);
  assert.ok(closeEnough(a, b));
  assert.ok(
    closeEnough(
      a.reduce((x, y) => x + y, 0),
      1,
    ),
  );
  const softmax = (z) => {
    const e = z.map(Math.exp),
      sum = e.reduce((x, y) => x + y, 0);
    return e.map((x) => x / sum);
  };
  const objective = (p) =>
    p.reduce(
      (sum, x, i) =>
        sum +
        x * [0.9, 0.3, 0.6][i] -
        0.1 * x * Math.log(x / [0.3, 0.3, 0.4][i]),
      0,
    );
  assert.ok(objective(a) > objective(softmax([0.2, -0.1, 0.4])));
});

test("all course text is English and translations retain course structure", () => {
  const vietnamese =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  function inspect(value, path) {
    if (typeof value === "string")
      assert.ok(!vietnamese.test(value), `Untranslated text at ${path}`);
    else if (Array.isArray(value))
      value.forEach((item, i) => inspect(item, `${path}[${i}]`));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([key, item]) =>
        inspect(item, `${path}.${key}`),
      );
  }
  inspect(lessons, "lessons");
  inspect(labs, "labs");
  assert.equal(lessons.length, 9);
  assert.equal(labs.length, 9);
  assert.equal(
    labs.reduce((sum, lab) => sum + lab.tests.length, 0),
    45,
  );
  for (const lesson of lessons) {
    assert.equal(lesson.answers.length, 3);
    assert.ok(lesson.correct >= 0 && lesson.correct < lesson.answers.length);
    assert.ok(labs.some((lab) => lab.id === lesson.lab));
  }
});
