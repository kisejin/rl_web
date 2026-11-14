import test from "node:test";
import assert from "node:assert/strict";
import { loadProgress } from "../src/progress.js";
function withSaved(saved, check) {
  const before = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify(saved) };
  try {
    check(loadProgress());
  } finally {
    if (before === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = before;
  }
}
test("Python migration archives JavaScript attempts and retains theory and proofs", () => {
  const saved = {
    code: { return: "function discountedReturn() { return 0; }" },
    submissions: { return: [{ status: "Accepted", code: "old code" }] },
    solved: ["return"],
    read: ["bellman"],
    notes: { bellman: "A note" },
    proofs: { bellman: "A proof" },
    checks: { bellman: { 0: true } },
  };
  withSaved(saved, (progress) => {
    assert.equal(progress.codeLanguage, "python");
    assert.deepEqual(progress.code, {});
    assert.deepEqual(progress.solved, []);
    assert.deepEqual(progress.submissions, {});
    assert.deepEqual(progress.legacyJavaScript.code, saved.code);
    assert.deepEqual(progress.legacyJavaScript.submissions, saved.submissions);
    assert.deepEqual(progress.legacyJavaScript.solved, saved.solved);
    assert.deepEqual(progress.read, saved.read);
    assert.deepEqual(progress.notes, saved.notes);
    assert.deepEqual(progress.proofs, saved.proofs);
    assert.deepEqual(progress.checks, saved.checks);
  });
});
test("existing Python drafts and accepted attempts survive subsequent loads", () => {
  const saved = {
    codeLanguage: "python",
    code: { return: "def discounted_return(rewards, gamma):\n    return 0" },
    solved: ["return"],
    submissions: { return: [{ status: "Accepted", language: "python" }] },
    legacyJavaScript: { code: { return: "old source" } },
  };
  withSaved(saved, (progress) => {
    for (const key of Object.keys(saved))
      assert.deepEqual(progress[key], saved[key]);
  });
});
