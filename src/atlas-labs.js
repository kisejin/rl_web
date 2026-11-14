import { atlasTopics } from "./atlas-content.js";
import { atlasLabData } from "./atlas-lab-data.js";
const topics = new Map(atlasTopics.map((topic) => [topic.id, topic]));
const coreTopic = {
  return: "returns",
  expectation: "expectation",
  bellman: "bellman",
  "value-iteration": "dynamic-programming",
  "q-learning": "q-control",
  reinforce: "policy-gradient",
  shaping: "reward-shaping",
  rubric: "rubric-grpo",
  "rubric-policy": "rlhf",
};
export const atlasLabs = atlasLabData.map((lab, index) => ({
  ...lab,
  hint: lab.hint + " Key expression: \\[" + lab.equation + "\\]",
  number: String(index + 10).padStart(3, "0"),
  topic: topics.get(lab.atlasTopic).stage,
  lesson: "atlas-" + lab.atlasTopic,
  assumptions: topics.get(lab.atlasTopic).assumptions,
  sources: topics.get(lab.atlasTopic).sources,
}));
const warmupProofs = {
  return: {
    assumptions:
      "Finite horizon T, finite rewards and gamma in [0,1]. The infinite-horizon extension additionally requires bounded rewards and gamma<1.",
    steps: [
      [
        "Separate the first reward from the finite discounted sum.",
        String.raw`G_t=r_{t+1}+\sum_{k=1}^{T-t-1}\gamma^k r_{t+k+1}`,
      ],
      [
        "Factor gamma from the remaining terms to obtain the backward recurrence.",
        String.raw`G_t=r_{t+1}+\gamma G_{t+1},\quad G_T=0`,
      ],
      [
        "Induction backward from the empty suffix proves that the loop returns the requested sum. For bounded rewards, the finite sum has this bound.",
        String.raw`|G_0|\leq R_{\max}\sum_{k=0}^{T-1}\gamma^k=\begin{cases}R_{\max}(1-\gamma^T)/(1-\gamma)&\gamma<1,\\TR_{\max}&\gamma=1.\end{cases}`,
      ],
    ],
  },
  expectation: {
    assumptions:
      "Finite real values and nonnegative probabilities whose sum is one.",
    steps: [
      [
        "By definition, the expectation under the transition distribution is a weighted sum.",
        String.raw`\mathbb E[V(S\prime)]=\sum_i p_iV_i`,
      ],
      [
        "After visiting k entries the accumulator equals their partial sum; adding one product preserves the invariant.",
        String.raw`e_0=0,\quad e_{k+1}=e_k+p_kV_k\Rightarrow e_n=\sum_{k=0}^{n-1}p_kV_k`,
      ],
      [
        "Normalization and nonnegativity also bound the result between the smallest and largest values.",
        String.raw`\min_iV_i\leq\sum_ip_iV_i\leq\max_iV_i`,
      ],
    ],
  },
  "q-learning": {
    assumptions:
      "One fixed sampled transition, detached target y, alpha in [0,1] and gamma in [0,1]. A true terminal has zero continuation. These local identities alone do not prove convergence.",
    steps: [
      [
        "Construct the max-bootstrap target only when the next state is nonterminal; a terminal may have no next actions.",
        String.raw`y=\begin{cases}r&d=1,\\r+\gamma\max_{a\prime}Q(s\prime,a\prime)&d=0.\end{cases}`,
      ],
      [
        "Differentiate the half-squared loss while holding this target fixed.",
        String.raw`\partial_q\tfrac12(q-y)^2=q-y\Rightarrow q^+=q-\alpha(q-y)`,
      ],
      [
        "The result is a convex interpolation, with the expected zero/one learning-rate endpoints.",
        String.raw`q^+=(1-\alpha)q+\alpha y,\quad\alpha=0\Rightarrow q^+=q,\quad\alpha=1\Rightarrow q^+=y`,
      ],
    ],
  },
};
export function enrichCoreLabs(labs, lessons) {
  for (const lab of labs) {
    lab.atlasTopic = coreTopic[lab.id];
    const topic = topics.get(lab.atlasTopic);
    lab.assumptions = topic.assumptions;
    lab.sources = topic.sources;
    const lessonId =
      lab.lesson ||
      { return: "foundations", expectation: "probability", "q-learning": "td" }[
        lab.id
      ];
    const lesson = lessons.find((item) => item.id === lessonId);
    const proof = lab.id === "rubric-policy" ? lesson.extraProof : null;
    lab.proofSteps = (proof?.steps || lesson.proof).map(([text, tex]) => ({
      text,
      tex,
    }));
    lab.proofAssumptions = proof?.assume || lesson.assume;
    if (warmupProofs[lab.id]) {
      lab.proofSteps = warmupProofs[lab.id].steps.map(([text, tex]) => ({
        text,
        tex,
      }));
      lab.proofAssumptions = warmupProofs[lab.id].assumptions;
    }
    lab.complexity = {
      return: "O(T) time and O(1) auxiliary space.",
      expectation: "O(S) time and O(1) auxiliary space.",
      bellman: "O(S) time and O(1) auxiliary space for one action backup.",
      "value-iteration":
        "O(K E) time for K sweeps and E total listed transitions; O(S) auxiliary value space.",
      "q-learning":
        "O(A) time to maximize next-state action values; O(1) auxiliary space.",
      reinforce: "O(A) time and O(A) output space.",
      shaping: "O(1) time and O(1) space.",
      rubric:
        "O(K) time to validate and aggregate K criteria; O(1) auxiliary space.",
      "rubric-policy": "O(A) time and O(A) auxiliary space.",
    }[lab.id];
  }
}
export function labGuideHref(lab) {
  return lab.atlasTopic
    ? "/#atlas/" + lab.atlasTopic
    : "/#lesson/" + (lab.lesson || "foundations");
}
