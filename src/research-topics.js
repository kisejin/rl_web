export const researchTopics = [
  {
    id: "rl",
    label: "RL & new methods",
    description: "Policy optimization, agents, model-based and offline RL",
  },
  {
    id: "rlvr",
    label: "RLVR",
    description: "Reinforcement learning with verifiable rewards",
  },
  {
    id: "self-distillation",
    label: "On-policy self-distillation",
    description: "On-policy learning and self-distilled supervision",
  },
  {
    id: "rubric",
    label: "Rubric as reward",
    description: "Rubric-driven rewards, judges and criteria",
  },
];
export const RESEARCH_SCHEDULE =
  "Daily at 09:00 Asia/Ho_Chi_Minh (02:00 UTC). Scheduled execution can be delayed.";
export function classifyResearch(title, abstract = "") {
  const text = (title + " " + abstract).toLowerCase().replace(/[‐‑–—-]/g, " ");
  const tags = [];
  if (
    /reinforcement learning|policy optimiz|policy optimisation|actor critic|offline rl|model based rl|\b(?:rlhf|grpo|dpo|ppo|rlvr)\b/.test(
      text,
    )
  )
    tags.push("rl");
  if (
    /verifiable rewards?|verifiable reinforcement|\brlvr\b|rule based rewards?/.test(
      text,
    )
  )
    tags.push("rlvr");
  if (/self distill|self teach/.test(text) && /on policy/.test(text))
    tags.push("self-distillation");
  if (
    /rubric/.test(text) &&
    /reward|reinforcement|language model|\bllm|policy|judge/.test(text)
  )
    tags.push("rubric");
  return tags;
}
