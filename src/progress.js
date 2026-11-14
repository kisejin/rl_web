export function loadProgress() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("rl-atlas-v1") || "{}") || {};
  } catch {}
  if (saved.codeLanguage !== "python") {
    // Preserve old code and attempts rather than interpreting JavaScript as Python.
    if (
      Object.keys(saved.code || {}).length ||
      Object.keys(saved.submissions || {}).length ||
      saved.solved?.length
    ) {
      saved.legacyJavaScript = {
        code: saved.code || {},
        submissions: saved.submissions || {},
        solved: saved.solved || [],
      };
    }
    saved.code = {};
    saved.submissions = {};
    saved.solved = [];
    saved.codeLanguage = "python";
  }
  return {
    read: [],
    solved: [],
    code: {},
    notes: {},
    lessonProofs: {},
    lessonReviewed: {},
    proofs: {},
    submissions: {},
    checks: {},
    quiz: {},
    ...saved,
  };
}
