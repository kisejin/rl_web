import { uiIcon } from "./ui-icons.js";
import katex from "katex";
import { filmPlayer, mountFilm } from "./films.js";

const C = {
  blue: "#65b9ff",
  green: "#74e0bd",
  yellow: "#f7cf72",
  pink: "#ef91b8",
  muted: "#9cacc3",
  grid: "#2a394f",
  white: "#edf3ff",
};
const fmt = (n, digits = 2) => Number(n).toFixed(digits);
const tex = (s) =>
  katex.renderToString(s, { displayMode: true, throwOnError: false });
export const visualChapters = {
  foundations: {
    title: "Watch a return take shape",
    subtitle: "A reward now and a reward later are not worth the same amount.",
    parameter: "Discount γ",
    min: 0.1,
    max: 0.95,
    value: 0.8,
    steps: [
      "Collect rewards",
      "Discount the future",
      "Add the first two",
      "Bring it together",
      "See the full return",
    ],
  },
  probability: {
    title: "Expectation is a balance point",
    subtitle:
      "A probability distribution becomes a weighted average, one outcome at a time.",
    parameter: "P(reward = 10)",
    min: 0.05,
    max: 0.95,
    value: 0.25,
    steps: [
      "List the outcomes",
      "Assign probability",
      "Weight each outcome",
      "Add the contributions",
      "Locate the expectation",
    ],
  },
  mdp: {
    title: "One action, a world of possibilities",
    subtitle:
      "Follow a transition, then turn the branching diagram into an expectation.",
    parameter: "P(next = A)",
    min: 0.05,
    max: 0.95,
    value: 0.7,
    steps: [
      "A state and an action",
      "Follow branch A",
      "Follow branch B",
      "Average the outcomes",
      "Check normalization",
    ],
  },
  bellman: {
    title: "Why Bellman updates converge",
    subtitle:
      "Two guesses move toward the same fixed point. Their distance shrinks by γ.",
    parameter: "Discount γ",
    min: 0.2,
    max: 0.9,
    value: 0.75,
    steps: [
      "Start with two guesses",
      "Apply one backup",
      "Apply a second backup",
      "Keep contracting",
      "Approach the fixed point",
      "Read the error bound",
    ],
  },
  dp: {
    title: "Value travels backward",
    subtitle:
      "On a known five-state chain, synchronous backups move information one edge per sweep.",
    parameter: "Discount γ",
    min: 0.1,
    max: 0.95,
    value: 0.9,
    steps: [
      "Initialize at zero",
      "First sweep",
      "Second sweep",
      "Third sweep",
      "Fourth sweep",
    ],
  },
  td: {
    title: "Learn from a single transition",
    subtitle:
      "A sample creates a target. The TD error tells your estimate which way to move.",
    parameter: "Learning rate α",
    min: 0.1,
    max: 1,
    value: 0.5,
    steps: [
      "Observe a transition",
      "Build the target",
      "Measure the TD error",
      "Update the estimate",
      "Handle a terminal transition",
    ],
  },
  policy: {
    title: "Turn feedback into probability",
    subtitle:
      "One REINFORCE sample increases the probability of the selected, rewarded action.",
    parameter: "Learning rate η",
    min: 0.1,
    max: 2,
    value: 1,
    steps: [
      "Start with a policy",
      "Sample action A",
      "Differentiate log probability",
      "Follow the gradient",
      "Read the new policy",
    ],
  },
  reward: {
    title: "Watch a telescoping sum cancel",
    subtitle:
      "Potential shaping changes return by a state-dependent constant, not a policy preference.",
    parameter: "Discount γ",
    min: 0.1,
    max: 0.95,
    value: 0.9,
    steps: [
      "Choose a potential",
      "Shape each transition",
      "Discount the shaping",
      "Cancel the middle terms",
      "Keep only the boundary",
    ],
  },
  rubric: {
    title: "Build a reward you can inspect",
    subtitle:
      "Separate scores, weights, aggregation, and the hard gate before optimizing.",
    parameter: "Correctness score",
    min: 0,
    max: 1,
    value: 0.9,
    steps: [
      "Score each criterion",
      "Apply the weights",
      "Add the contributions",
      "Pass the hard gate",
      "Fail the hard gate",
    ],
  },
  kl: {
    title: "Reward pulls. KL pulls back.",
    subtitle:
      "A two-answer policy shows how a reference penalty changes an exact gradient update.",
    parameter: "KL strength β",
    min: 0,
    max: 2,
    value: 0.4,
    steps: [
      "Meet the reference",
      "Compare the policy",
      "Measure KL divergence",
      "Form the objective",
      "Compute the gradient",
      "Update the policy",
    ],
  },
};

// Pure models shared by rendering and numerical tests. Each scene is a small,
// explicitly specified example, rather than a claim about arbitrary RL runs.
export function visualModel(id, step, p) {
  const cfg = visualChapters[id];
  if (!cfg) throw new Error("Unknown visualization");
  step = Math.max(0, Math.min(cfg.steps.length - 1, Math.round(step)));
  if (id === "foundations") {
    const rewards = [1, 2, 3, 4],
      weighted = rewards.map((r, i) => r * p ** i);
    return {
      step,
      rewards,
      weighted,
      total: weighted.reduce((a, b) => a + b, 0),
      partial: weighted
        .slice(0, Math.min(4, step + 1))
        .reduce((a, b) => a + b, 0),
    };
  }
  if (id === "probability")
    return {
      step,
      probabilities: [1 - p, p],
      outcomes: [0, 10],
      expected: 10 * p,
    };
  if (id === "mdp")
    return { step, probabilities: [p, 1 - p], expected: 10 * p - 5 * (1 - p) };
  if (id === "bellman") {
    const fixed = 1 / (1 - p),
      a = fixed * (1 - p ** step),
      b = fixed + (12 - fixed) * p ** step;
    return { step, fixed, a, b, gap: 12 * p ** step };
  }
  if (id === "dp") {
    let values = [0, 0, 0, 0, 0];
    for (let k = 0; k < step; k++)
      values = values.map((_, s) =>
        s === 4 ? 0 : s === 3 ? 10 : p * values[s + 1],
      );
    return { step, values };
  }
  if (id === "td") {
    const terminal = step === 4,
      target = terminal ? 1 : 1 + 0.9 * 4;
    return {
      step,
      target,
      error: target - 2,
      updated: 2 + p * (target - 2),
      terminal,
    };
  }
  if (id === "policy") {
    const selected = step >= 4,
      prob = 1 / (1 + Math.exp(-p));
    return {
      step,
      gradient: [0.5, -0.5],
      probabilities: selected ? [prob, 1 - prob] : [0.5, 0.5],
      next: prob,
    };
  }
  if (id === "reward") {
    const phi = [3, 2, 1, 0],
      shaping = [0, 1, 2].map((i) => p * phi[i + 1] - phi[i]),
      discounted = shaping.map((f, i) => p ** i * f),
      original = 10 * p * p;
    return {
      step,
      phi,
      shaping,
      discounted,
      original,
      shaped: original - 3,
      offset: discounted.reduce((a, b) => a + b, 0),
    };
  }
  if (id === "rubric") {
    const scores = [p, 0.5, 0.8],
      weights = [0.5, 0.3, 0.2],
      parts = scores.map((s, i) => s * weights[i]),
      raw = parts.reduce((a, b) => a + b, 0),
      gate = step < 4;
    return { step, scores, weights, parts, raw, gate, reward: gate ? raw : 0 };
  }
  const probs = [0.8, 0.2],
    ref = [0.5, 0.5],
    kl = probs.reduce((sum, v, i) => sum + v * Math.log(v / ref[i]), 0),
    gradient = 0.8 * (1 - 0.8 - p * (Math.log(0.8 / 0.5) - kl)),
    next = 1 / (1 + Math.exp(-(Math.log(4) + 2 * gradient)));
  return {
    step,
    probs,
    ref,
    kl,
    gradient,
    objective: 0.8 - p * kl,
    next,
    beta: p,
  };
}
const label = (x, y, s, color = C.muted, size = 20, anchor = "middle") =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" font-family="DM Sans, sans-serif">${s}</text>`;
const line = (x1, y1, x2, y2, color = C.grid, width = 2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const circle = (x, y, r, color, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${extra}/>`;
function bars(
  values,
  names,
  max = 1,
  colors = [C.blue, C.green, C.yellow],
  baseline = 240,
) {
  return (
    line(50, baseline, 590, baseline) +
    values
      .map((v, i) => {
        const x = 95 + i * (440 / Math.max(1, values.length - 1)),
          h = Math.max(2, (Math.abs(v) / max) * 150);
        return `<rect class="visual-bar" x="${x - 35}" y="${baseline - h}" width="70" height="${h}" rx="7" fill="${colors[i % colors.length]}" opacity=".85"/>${label(x, baseline - h - 14, fmt(v), colors[i % colors.length], 23)}${label(x, baseline + 32, names[i], C.muted, 19)}`;
      })
      .join("")
  );
}
function scene(id, m, p) {
  const k = m.step;
  let drawing = "",
    equation = "",
    narration = "",
    legend = "";
  if (id === "foundations") {
    const vals = k === 0 ? m.rewards : m.weighted;
    drawing = bars(
      vals,
      k === 0 ? ["r₁", "r₂", "r₃", "r₄"] : ["r₁", "γr₂", "γ²r₃", "γ³r₄"],
      4,
    );
    equation = `G_0=1+${fmt(p)}\\cdot2+${fmt(p)}^2\\cdot3+${fmt(p)}^3\\cdot4=\\color{#74e0bd}{${fmt(m.total)}}`;
    narration = [
      "The episode produces rewards 1, 2, 3, and 4. These are immediate rewards, not state values.",
      "Each later reward is scaled by another power of γ. The bars now show discounted contributions.",
      `The first two contributions add to ${fmt(m.weighted[0] + m.weighted[1])}.`,
      `Include the third contribution: ${fmt(m.weighted.slice(0, 3).reduce((a, b) => a + b, 0))}.`,
      `All four terms give a finite-episode return of ${fmt(m.total)}. Increase γ to give later rewards more weight.`,
    ][k];
    legend = "Blue → teal → gold: successive rewards in time";
  }
  if (id === "probability") {
    drawing =
      bars(
        k < 2 ? m.probabilities : [0, m.expected],
        ["Reward 0", "Reward 10"],
        k < 2 ? 1 : 10,
      ) +
      line(65, 65, 575, 65, C.grid, 3) +
      circle(65 + m.expected * 51, 65, 8, C.yellow) +
      label(320, 35, `E[R] = ${fmt(m.expected)}`, C.yellow, 25);
    equation = `\\mathbb E[R]=(1-${fmt(p)})\\cdot0+${fmt(p)}\\cdot10=\\color{#f7cf72}{${fmt(m.expected)}}`;
    narration = [
      "There are two possible outcomes: zero points and ten points.",
      `Their probabilities are ${fmt(1 - p)} and ${fmt(p)}; they sum to 1.`,
      "Multiply each outcome by its probability. The chart now shows contributions to the expectation.",
      `Add the contributions: ${fmt(m.expected)} points. This need not be an outcome you can observe.`,
      "The gold point marks the weighted balance point on the 0–10 scale. Move the probability slider to shift it.",
    ][k];
    legend =
      k < 2
        ? "Bar height: probability · Gold point: expected reward"
        : "Bar height: outcome × probability · Gold point: expected reward";
  }
  if (id === "mdp") {
    drawing = `<path d="M 170 155 Q 300 65 440 90" fill="none" stroke="${C.blue}" stroke-width="4"/><path d="M 170 155 Q 300 245 440 220" fill="none" stroke="${C.pink}" stroke-width="4"/>${circle(125, 155, 43, C.blue)}${label(125, 164, "s₀", "#102032", 27)}${circle(485, 90, 43, C.green)}${label(485, 99, "A", "#102032", 27)}${circle(485, 220, 43, C.pink)}${label(485, 229, "B", "#102032", 27)}${label(310, 70, `p = ${fmt(p)}`, C.blue, 23)}${label(310, 260, `1 − p = ${fmt(1 - p)}`, C.pink, 23)}${label(565, 97, "+10", C.green, 23)}${label(565, 227, "−5", C.pink, 23)}${k === 1 ? circle(350, 89, 10, C.yellow) : k === 2 ? circle(350, 221, 10, C.yellow) : ""}`;
    equation =
      k === 4
        ? `${fmt(p)}+${fmt(1 - p)}=1`
        : `\\mathbb E[R\\mid s_0,a]=${fmt(p)}(10)+${fmt(1 - p)}(-5)=\\color{#f7cf72}{${fmt(m.expected)}}`;
    narration = [
      "Fix one action in state s₀. The environment can transition to either of two terminal outcomes.",
      "The blue branch reaches A and receives +10. Its probability is p.",
      "The pink branch reaches B and receives −5. Its probability is 1 − p.",
      "Expected reward averages both outcomes; it is not the reward of the most likely branch.",
      "Every valid transition row sums to 1. Changing p automatically changes the other branch.",
    ][k];
    legend =
      "Blue: current state · Teal: positive outcome · Pink: negative outcome";
  }
  if (id === "bellman") {
    const x = (v) => 65 + (v / 14) * 500;
    drawing =
      line(65, 180, 585, 180, C.muted, 2) +
      [0, 4, 8, 12]
        .map(
          (v) =>
            line(x(v), 170, x(v), 190, C.grid) + label(x(v), 215, String(v)),
        )
        .join("") +
      line(x(m.fixed), 70, x(m.fixed), 245, C.green, 2) +
      label(x(m.fixed), 48, `V* = ${fmt(m.fixed)}`, C.green, 23) +
      line(x(m.a), 125, x(m.b), 125, C.yellow, 3) +
      circle(x(m.a), 180, 11, C.blue) +
      circle(x(m.b), 180, 11, C.pink) +
      label(x(m.a), 265, `Vₖ = ${fmt(m.a)}`, C.blue, 22, "start") +
      label(x(m.b), 295, `Wₖ = ${fmt(m.b)}`, C.pink, 22, "end") +
      label(320, 105, `gap = ${fmt(m.gap)}`, C.yellow, 25);
    equation = `T(V)=1+\\gamma V,\\quad |V_${k}-W_${k}|=12\\gamma^{${k}}=${fmt(m.gap)}`;
    narration = `One-state MDP: reward 1, deterministic self-loop, γ = ${fmt(p)}. After ${k} backups, the gap is ${fmt(m.gap)}. Each backup multiplies the previous gap by γ; both guesses converge to 1/(1−γ).`;
    legend =
      "Blue: first guess · Pink: second guess · Teal: unique fixed point";
  }
  if (id === "dp") {
    drawing =
      m.values
        .map((v, i) => {
          const x = 75 + i * 120;
          return `${i < 4 ? line(x + 43, 150, x + 77, 150, C.blue, 3) : ""}<rect x="${x - 43}" y="105" width="86" height="90" rx="12" fill="${i === 4 ? "#334f44" : v ? "#25465a" : "#1d2d42"}" stroke="${i === 4 ? C.green : C.blue}" stroke-width="2"/>${label(x, 155, i === 4 ? "END" : fmt(v, 1), i === 4 ? C.green : C.blue, 23)}${label(x, 230, "s" + i, C.muted, 21)}`;
        })
        .join("") +
      label(320, 65, `Synchronous sweep ${k}`, C.yellow, 26) +
      label(
        320,
        285,
        "Reward +10 only on the transition into END",
        C.muted,
        20,
      );
    equation = `V_{k+1}(s)=\\max_a[r+\\gamma V_k(s')],\\qquad V(\\mathrm{END})=0`;
    narration = [
      "Every value starts at zero. The terminal state has zero continuation value.",
      "Sweep 1: only the state immediately before END sees the +10 reward.",
      "Sweep 2: the reward information reaches the next state to the left, scaled by γ.",
      "Sweep 3: information travels back one more edge. All updates read the previous sweep.",
      "Sweep 4: the leftmost state now knows the discounted value of reaching the goal.",
    ][k];
    legend =
      "Blue: estimated value · Teal: terminal state · Arrow: deterministic action";
  }
  if (id === "td") {
    drawing =
      bars(
        [2, k >= 1 ? m.target : 0, k >= 3 ? m.updated : 0],
        ["Old V", "TD target", "New V"],
        5,
        [C.blue, C.yellow, C.green],
      ) +
      label(
        320,
        48,
        m.terminal ? "terminal = true" : "r = 1 · γ = 0.9 · V(next) = 4",
        C.muted,
        22,
      );
    equation = `\\delta=${fmt(m.target)}-2=${fmt(m.error)},\\qquad V_{new}=2+${fmt(p)}(${fmt(m.error)})=\\color{#74e0bd}{${fmt(m.updated)}}`;
    narration = [
      "Our current value estimate is 2. A sampled transition returns reward 1 and a next-state estimate of 4.",
      "For a nonterminal transition, target = 1 + 0.9 × 4 = 4.6. This target bootstraps from an estimate.",
      "The TD error is target minus current value. Its sign sets the update direction.",
      `Move α = ${fmt(p)} of the way toward the target. The updated estimate is ${fmt(m.updated)}.`,
      "Now mark the same transition terminal. Continuation value disappears: target = 1. Terminal masking changes the update.",
    ][k];
    legend = "Blue: old estimate · Gold: target · Teal: updated estimate";
  }
  if (id === "policy") {
    drawing =
      bars(m.probabilities, ["Action A", "Action B"], 1, [C.blue, C.pink]) +
      label(
        320,
        50,
        k === 0
          ? "π = softmax([0, 0])"
          : k < 4
            ? "Sample: A · reward 1 · baseline 0"
            : `New π(A) = ${fmt(m.next, 3)}`,
        C.yellow,
        25,
      );
    equation =
      k < 3
        ? `\\nabla_z\\log\\pi(A)=[1,0]-[0.5,0.5]=[0.5,-0.5]`
        : `z'=[0,0]+${fmt(p)}[0.5,-0.5],\\quad\\pi'(A)=${fmt(m.next, 3)}`;
    narration = [
      "Both actions start with probability 0.5. The parameterization is softmax over two logits.",
      "Take one observed sample: action A received reward 1, with a baseline of zero.",
      "The score-function gradient for action A is [0.5, −0.5]. This is a sampled REINFORCE estimate, not an exact expected gradient.",
      "Gradient ascent increases A’s logit and decreases B’s. η controls the step size.",
      "Softmax turns the new logits into valid probabilities. A single rewarded sample shifts the policy; it does not guarantee overall improvement.",
    ][k];
    legend =
      "Blue: probability of A · Pink: probability of B · Reward is fixed at 1";
  }
  if (id === "reward") {
    drawing =
      m.phi
        .map((v, i) => {
          const x = 90 + i * 153;
          return `${i < 3 ? line(x + 37, 120, x + 116, 120, k >= 3 ? C.muted : C.blue, 3) : ""}${circle(x, 120, 36, i === 3 ? C.green : C.blue)}${label(x, 129, String(v), "#102032", 28)}${label(x, 65, `Φ(s${i})`, C.muted, 21)}${i < 3 ? label(x + 76, 180, fmt(k >= 2 ? m.discounted[i] : m.shaping[i]), C.pink, 20) : ""}`;
        })
        .join("") +
      (k >= 3
        ? label(320, 250, "γΦ₁ − γΦ₁ + γ²Φ₂ − γ²Φ₂", C.muted, 24) +
          line(115, 242, 525, 242, C.pink, 2)
        : label(320, 250, "Fₜ = γΦ(sₜ₊₁) − Φ(sₜ)", C.yellow, 24)) +
      label(320, 290, "Φ(terminal) = 0", C.muted, 21);
    equation =
      k < 3
        ? `\\sum_{t=0}^{2}\\gamma^t F_t=-\\Phi(s_0)+\\gamma^3\\Phi(s_3)=-3`
        : `G'=G-\\Phi(s_0)=${fmt(m.original)}-3=${fmt(m.shaped)}`;
    narration = [
      "Set potentials [3, 2, 1, 0]. The final state is terminal, with zero potential.",
      "Each pink number is the shaping reward for an edge. These may be negative even on a useful path.",
      "Multiply every shaping term by its time discount. Those are now the pink edge labels.",
      "Positive and negative middle potential terms cancel. Only −Φ(s₀) and a terminal boundary remain.",
      "The zero terminal potential removes the boundary. For a fixed starting state, every policy gets the same shift −3; policy ordering is preserved.",
    ][k];
    legend =
      k >= 2
        ? "Blue: potential · Pink: discounted shaping · Teal: zero terminal potential"
        : "Blue: potential · Pink: shaping reward · Teal: terminal";
  }
  if (id === "rubric") {
    drawing =
      bars(
        k === 0 ? m.scores : m.parts,
        ["Correctness", "Reasoning", "Clarity"],
        1,
        [C.blue, C.green, C.yellow],
      ) +
      label(
        320,
        45,
        k === 0
          ? "Criterion scores in [0, 1]"
          : k < 3
            ? "Weighted contributions"
            : "Hard gate: " + (m.gate ? "PASS" : "FAIL"),
        k === 4 ? C.pink : C.white,
        25,
      );
    equation = `R=g(0.5\\cdot${fmt(p)}+0.3\\cdot0.5+0.2\\cdot0.8)=${m.gate ? 1 : 0}\\cdot${fmt(m.raw, 3)}=\\color{${m.gate ? C.green : C.pink}}{${fmt(m.reward, 3)}}`;
    narration = [
      "The three scores are separately observable. Change correctness without changing reasoning or clarity.",
      "Multiply by weights [0.5, 0.3, 0.2]. The weights sum to 1.",
      "Adding the contributions gives a reward in [0, 1]. Monotonicity alone does not make the rubric a good measure.",
      "When the essential criterion passes, the hard gate is 1 and the weighted score is retained.",
      "When the essential criterion fails, the hard gate is 0 and the final reward is zero, regardless of the scores.",
    ][k];
    legend = "Blue: correctness · Teal: reasoning · Gold: clarity";
  }
  if (id === "kl") {
    const values = k === 0 ? m.ref : k === 5 ? [m.next, 1 - m.next] : m.probs;
    drawing =
      bars(values, ["Answer A", "Answer B"], 1, [C.blue, C.pink]) +
      line(60, 165, 580, 165, C.green, 2) +
      label(
        320,
        45,
        k === 0
          ? "Reference q = [0.5, 0.5]"
          : k === 5
            ? "One exact gradient ascent step"
            : "Current π = [0.8, 0.2]",
        C.white,
        24,
      ) +
      label(540, 150, "q = 0.5", C.green, 19);
    equation =
      k < 3
        ? `D_{KL}(\\pi\\|q)=0.8\\log(1.6)+0.2\\log(0.4)=${fmt(m.kl, 4)}`
        : k === 3
          ? `J=\\mathbb E[R]-\\beta D_{KL}=0.8-${fmt(p)}(${fmt(m.kl, 4)})=${fmt(m.objective, 4)}`
          : `\\partial_{z_A}J=${fmt(m.gradient, 4)},\\quad\\pi_{new}(A)=${fmt(m.next, 4)}`;
    narration = [
      "The reference policy assigns equal probability to both answers. Rewards are fixed at [1, 0].",
      "The current policy favors the rewarded answer A with probability 0.8.",
      "KL is the sum of two weighted log-ratios. One term is negative, but their total is nonnegative.",
      `The objective trades expected reward against KL. At β = ${fmt(p)}, J = ${fmt(m.objective, 4)}.`,
      `The reward gradient pulls toward A; KL pulls toward the reference. Their combined logit gradient is ${fmt(m.gradient, 4)}.`,
      `After a learning-rate-1 exact gradient step, π(A) = ${fmt(m.next, 4)}. Increase β enough and the penalty can reverse the update.`,
    ][k];
    legend =
      "Blue/pink: answer probabilities · Teal line: reference probability";
  }
  return { drawing, equation, narration, legend };
}
export function visualLesson(id) {
  const c = visualChapters[id];
  return `<section class="visual-theater" data-visual="${id}" aria-label="${c.title}"><div class="visual-heading"><span class="visual-kicker">THE MATH, IN MOTION</span><h2>${c.title}</h2><p>${c.subtitle}</p><span class="visual-mobile-hint">Scroll the diagram horizontally to see every label.</span></div><div class="film-tabs" role="tablist" aria-label="Visualization mode"><button type="button" role="tab" id="${id}-film-tab" aria-controls="${id}-film" aria-selected="true" data-film-tab="film">${uiIcon("play")} Watch Manim</button><button type="button" role="tab" id="${id}-explore-tab" aria-controls="${id}-explore" aria-selected="false" tabindex="-1" data-film-tab="explore">${uiIcon("sliders")} Explore parameters</button></div>${filmPlayer(id)}<div class="visual-explore" role="tabpanel" id="${id}-explore" aria-labelledby="${id}-explore-tab" data-film-explore hidden><span class="visual-mobile-hint">Scroll the diagram horizontally to see every label.</span><div class="visual-scene"><svg viewBox="0 0 640 330" role="img" aria-label="Interactive ${c.title.toLowerCase()} diagram"></svg></div><div class="visual-legend"></div><div class="visual-equation"></div><div class="visual-story"><span class="visual-step-label"></span><p aria-live="polite"></p></div><div class="visual-controls"><div class="visual-transport"><button data-visual-play aria-label="Play concept animation">${uiIcon("play")} Play</button><button data-visual-back aria-label="Previous animation step">${uiIcon("arrow-left")}</button><button data-visual-next aria-label="Next animation step">${uiIcon("arrow-right")}</button><button data-visual-reset aria-label="Reset concept animation">${uiIcon("reset")} Reset</button></div><label class="visual-parameter">${c.parameter}<output>${fmt(c.value)}</output><input type="range" data-visual-parameter aria-label="${c.parameter}" min="${c.min}" max="${c.max}" step="0.01" value="${c.value}"></label><label class="visual-timeline">Explore the steps<output data-step-counter></output><input type="range" data-visual-timeline aria-label="Animation step" min="0" max="${c.steps.length - 1}" step="1" value="0"></label></div></div></section>`;
}
export function mountVisuals(root = document) {
  const cleanups = [];
  root.querySelectorAll("[data-visual]").forEach((el) => {
    const id = el.dataset.visual,
      c = visualChapters[id];
    let step = 0,
      p = c.value,
      timer = null;
    const abort = new AbortController();
    const on = (s, event, fn) =>
      el.querySelector(s).addEventListener(event, fn, { signal: abort.signal });
    const stop = () => {
      clearInterval(timer);
      timer = null;
      el.querySelector("[data-visual-play]").innerHTML =
        uiIcon("play") + " Play";
      el.querySelector("[data-visual-play]").setAttribute(
        "aria-label",
        "Play concept animation",
      );
    };
    const draw = () => {
      const oldBars = [...el.querySelectorAll(".visual-bar")].map(
        (x) => +x.getAttribute("height"),
      );
      const oldPoints = [
        ...el.querySelectorAll(".visual-scene > svg > circle"),
      ].map((x) => [+x.getAttribute("cx"), +x.getAttribute("cy")]);
      const m = visualModel(id, step, p),
        v = scene(id, m, p);
      el.querySelector(".visual-scene > svg").innerHTML =
        `<defs><pattern id="dots-${id}" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#2a394f"/></pattern></defs><rect width="640" height="330" fill="url(#dots-${id})"/>${v.drawing}`;
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.querySelectorAll(".visual-bar").forEach((bar, i) => {
          if (oldBars[i] !== undefined)
            bar.animate(
              [
                {
                  transform: `scaleY(${oldBars[i] / Math.max(1, +bar.getAttribute("height"))})`,
                },
                { transform: "scaleY(1)" },
              ],
              { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" },
            );
        });
        el.querySelectorAll(".visual-scene > svg > circle").forEach(
          (point, i) => {
            if (oldPoints[i])
              point.animate(
                [
                  {
                    transform: `translate(${oldPoints[i][0] - +point.getAttribute("cx")}px,${oldPoints[i][1] - +point.getAttribute("cy")}px)`,
                  },
                  { transform: "translate(0,0)" },
                ],
                { duration: 850, easing: "cubic-bezier(.22,1,.36,1)" },
              );
          },
        );
      }
      el.querySelector(".visual-legend").textContent = v.legend;
      el.querySelector(".visual-equation").innerHTML = tex(v.equation);
      el.querySelector(".visual-step-label").textContent =
        `${String(step + 1).padStart(2, "0")} / ${c.steps[step]}`;
      el.querySelector(".visual-story p").textContent = v.narration;
      el.querySelector("[data-visual-timeline]").value = step;
      el.querySelector("[data-step-counter]").textContent =
        `${step + 1} / ${c.steps.length}`;
      el.querySelector(".visual-parameter output").textContent = fmt(p);
      el.querySelector("[data-visual-back]").disabled = step === 0;
      el.querySelector("[data-visual-next]").disabled =
        step === c.steps.length - 1;
    };
    on("[data-visual-play]", "click", () => {
      if (timer) {
        stop();
        return;
      }
      if (step === c.steps.length - 1) step = 0;
      el.querySelector("[data-visual-play]").innerHTML =
        uiIcon("pause") + " Pause";
      el.querySelector("[data-visual-play]").setAttribute(
        "aria-label",
        "Pause concept animation",
      );
      draw();
      timer = setInterval(() => {
        step++;
        draw();
        if (step === c.steps.length - 1) stop();
      }, 1800);
    });
    on("[data-visual-next]", "click", () => {
      stop();
      step = Math.min(c.steps.length - 1, step + 1);
      draw();
    });
    on("[data-visual-back]", "click", () => {
      stop();
      step = Math.max(0, step - 1);
      draw();
    });
    on("[data-visual-reset]", "click", () => {
      stop();
      step = 0;
      p = c.value;
      el.querySelector("[data-visual-parameter]").value = p;
      draw();
    });
    on("[data-visual-timeline]", "input", (e) => {
      stop();
      step = +e.target.value;
      draw();
    });
    on("[data-visual-parameter]", "input", (e) => {
      p = +e.target.value;
      draw();
    });
    draw();
    const cleanFilm = mountFilm(el, stop);
    cleanups.push(() => {
      cleanFilm();
      stop();
      abort.abort();
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

export function mountProofWalkthroughs(root = document) {
  const cleanups = [];
  root.querySelectorAll(".proof-details").forEach((details) => {
    const rows = [...details.querySelectorAll(".proof-step")];
    if (!rows.length) return;
    let current = -1;
    const controls = document.createElement("div");
    controls.className = "proof-walk-controls";
    controls.innerHTML =
      '<span>Follow the derivation</span><button type="button" data-proof-forward>Next step →</button><button type="button" data-proof-all>Show all</button>';
    details.querySelector(".proof-steps").prepend(controls);
    const show = () =>
      rows.forEach((row, i) => {
        row.classList.toggle("proof-current", i === current);
        row.classList.toggle("proof-pending", current >= 0 && i > current);
      });
    const next = () => {
      current = (current + 1) % rows.length;
      show();
    };
    const all = () => {
      current = -1;
      show();
    };
    controls
      .querySelector("[data-proof-forward]")
      .addEventListener("click", next);
    controls.querySelector("[data-proof-all]").addEventListener("click", all);
    cleanups.push(() => {
      controls.remove();
    });
  });
  return () => cleanups.forEach((fn) => fn());
}

export function visualFrame(id, step, parameter) {
  return scene(id, visualModel(id, step, parameter), parameter);
}
