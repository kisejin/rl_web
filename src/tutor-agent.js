export const tutorSkills = [
  {
    id: "default",
    name: "Auto",
    description: "Adapt to the question and selected lesson.",
  },
  {
    id: "intuition",
    name: "Explain concepts",
    description: "Build intuition with examples, then connect the math.",
  },
  {
    id: "proof",
    name: "Proof coach",
    description: "State assumptions and justify every mathematical step.",
  },
  {
    id: "python",
    name: "Python lab coach",
    description:
      "Hints, invariants and edge cases for algorithms from scratch.",
  },
  {
    id: "review",
    name: "Review files",
    description: "Ground an explanation in attached documents, images or code.",
  },
];
export function normalizeAgentState(value = {}) {
  return {
    goal: typeof value.goal === "string" ? value.goal.slice(0, 240) : "",
    status: ["active", "paused", "done"].includes(value.status)
      ? value.status
      : "active",
    steps: Array.isArray(value.steps)
      ? value.steps
          .slice(0, 8)
          .filter((s) => s && typeof s.title === "string")
          .map((s, i) => ({
            id: String(i + 1),
            title: s.title.slice(0, 180),
            status: ["pending", "in_progress", "done"].includes(s.status)
              ? s.status
              : "pending",
          }))
      : [],
  };
}
export function validateAgentOptions(value) {
  if (value === undefined) return undefined;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !["ask", "plan"].includes(value.mode) ||
    !tutorSkills.some((s) => s.id === value.skill) ||
    typeof value.webSearch !== "boolean"
  )
    throw new Error("Choose valid agent settings.");
  const state = normalizeAgentState(value.state);
  if (
    value.state &&
    (JSON.stringify(value.state).length > 3000 ||
      !Array.isArray(value.state.steps))
  )
    throw new Error("The plan is too large.");
  return {
    enabled: true,
    mode: value.mode,
    skill: value.skill,
    webSearch: value.webSearch,
    state,
  };
}
export function normalizeAgentEvent(value) {
  if (!value || typeof value !== "object") return null;
  if (value.type === "plan" || value.type === "goal")
    return { type: value.type, state: normalizeAgentState(value.state) };
  if (value.type === "tool")
    return {
      type: "tool",
      name: String(value.name || "").slice(0, 60),
      status: ["running", "done", "error"].includes(value.status)
        ? value.status
        : "error",
    };
  if (value.type === "status" || value.type === "skill")
    return { type: value.type, label: String(value.label || "").slice(0, 160) };
  if (value.type === "sources" && Array.isArray(value.sources))
    return {
      type: "sources",
      sources: value.sources
        .slice(0, 6)
        .filter(
          (s) =>
            s &&
            typeof s.url === "string" &&
            (/^https:\/\//.test(s.url) ||
              /^\/(#(?:lesson|atlas)\/|atlas\/[a-z0-9-]+\/|lab\.html#)/.test(s.url)),
        )
        .map((s) => ({
          title: String(s.title || "").slice(0, 160),
          url: s.url.slice(0, 1000),
        })),
    };
  return null;
}
