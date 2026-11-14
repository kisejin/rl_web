export const sceneColors = ["#6db9ff", "#67e8c4", "#ffd184", "#ff8ea1"];
const cfg = (label, min, max, value, steps) => ({
  label,
  min,
  max,
  value,
  steps,
});
export const atlasSceneConfigs = {
  expectation: cfg("Probability of reward 3", 0.05, 0.95, 0.25, [
    "List outcomes",
    "Assign probabilities",
    "Weight rewards",
    "Find the balance point",
    "Distinguish mean from samples",
  ]),
  returns: cfg("Discount γ", 0.05, 0.95, 0.5, [
    "First reward",
    "Add the next reward",
    "Discount the third reward",
    "Include the fourth reward",
    "Compare the full return",
  ]),
  mdp: cfg("Transition probability p", 0.05, 0.95, 0.6, [
    "Condition on a state",
    "Choose an action",
    "Branch over next states",
    "Weight both outcomes",
    "Take an expectation",
  ]),
  bellman: cfg("Discount γ", 0.05, 0.95, 0.75, [
    "Start with two guesses",
    "Apply one Bellman backup",
    "Repeat the same operator",
    "Watch the gap contract",
    "Approach one fixed point",
  ]),
  dp: cfg("Discount γ", 0.05, 0.95, 0.5, [
    "Initialize all values",
    "One synchronous sweep",
    "Propagate one more edge",
    "Reach the earlier states",
    "Reward reaches the start",
  ]),
  td: cfg("Next-state value estimate", 0, 6, 3, [
    "Observe one transition",
    "Form a bootstrap target",
    "Compare with the old value",
    "Apply the TD correction",
    "Check the terminal boundary",
  ]),
  "q-control": cfg("Exploration ε", 0, 1, 0.3, [
    "List action values",
    "Mix greedy and uniform actions",
    "Compute expected SARSA",
    "Compare with the greedy maximum",
    "Separate behavior from target",
  ]),
  approximation: cfg("Gradient step size α", 0.05, 1.95, 0.5, [
    "Start away from the minimum",
    "Take one gradient step",
    "Re-evaluate the slope",
    "Observe contraction or oscillation",
    "Inspect the remaining error",
  ]),
  dqn: cfg("Largest next target Q", 0, 5, 3, [
    "Read the replay transition",
    "Freeze the target network",
    "Construct the detached label",
    "Move the online prediction",
    "Keep target updates separate",
  ]),
  double: cfg("Estimation-noise magnitude", 0, 1.5, 0.8, [
    "Compare noisy online estimates",
    "Select with the online network",
    "Evaluate with the target network",
    "Center dueling advantages",
    "Recover the shared value head",
  ]),
  per: cfg("Priority exponent α", 0, 1, 0.7, [
    "Inspect positive priorities",
    "Change the sampling distribution",
    "Draw from its cumulative mass",
    "Apply inverse-probability weights",
    "Recover the uniform expectation",
  ]),
  c51: cfg("Transported unit-mass location", 0, 4, 1.3, [
    "Start with one atom",
    "Move its target location",
    "Find neighboring atoms",
    "Split probability mass",
    "Check mass and mean",
  ]),
  "policy-gradient": cfg("Final policy logit z", -3, 3, 1, [
    "Parameterize a policy",
    "Map logits to probabilities",
    "Measure expected reward",
    "Differentiate the score objective",
    "Inspect the policy gradient",
  ]),
  baseline: cfg("State-only baseline b", 0, 2, 1, [
    "Fix policy and rewards",
    "Generate both gradient samples",
    "Shift the baseline",
    "Compare sample spread",
    "Keep the same expected gradient",
  ]),
  "actor-critic": cfg("Observed TD residual δ", -2, 2, 1, [
    "Observe the TD signal",
    "Correct the critic",
    "Use a detached advantage",
    "Update action probability",
    "Keep the two roles distinct",
  ]),
  gae: cfg("Trace parameter λ", 0, 1, 0.5, [
    "Read the current residual",
    "Carry the next residual",
    "Weight the longer continuation",
    "Accumulate the trace",
    "Inspect the full advantage",
  ]),
  trpo: cfg("Local KL budget Δ", 0.005, 0.3, 0.08, [
    "Choose a local KL metric",
    "Contrast gradient directions",
    "Precondition by the Fisher metric",
    "Scale to the KL boundary",
    "Check the quadratic budget",
  ]),
  ppo: cfg("Advantage A (change its sign)", -2, 2, 1, [
    "Start near the old policy",
    "Move the probability ratio",
    "Approach the clipping boundary",
    "Cross into the flat region",
    "Compare advantage signs",
  ]),
  ddpg: cfg("Actor gradient step α", 0.05, 0.5, 0.2, [
    "Start at a poor action",
    "Read the critic slope",
    "Move the deterministic actor",
    "Follow the action gradient",
    "Approach the critic optimum",
  ]),
  td3: cfg("Spurious critic peak height", 0, 1.5, 0.8, [
    "Compare two action-value curves",
    "Inspect the false peak",
    "Take the smaller target estimate",
    "Average two nearby target actions",
    "Do not confuse the minimum with truth",
  ]),
  sac: cfg("Entropy temperature α", 0.05, 2, 0.6, [
    "Set action values",
    "Interpolate from a uniform policy",
    "Balance reward and entropy",
    "Approach the soft optimum",
    "Check the soft-value identity",
  ]),
  bandits: cfg("Optimism coefficient c", 0, 1, 0.3, [
    "Read sample means",
    "Inspect unequal sample counts",
    "Add uncertainty bonuses",
    "Select the optimistic arm",
    "Distinguish uncertainty from reward",
  ]),
  "model-based": cfg("One-step mismatch probability ε", 0.01, 0.3, 0.1, [
    "Plan one step",
    "Extend the imagined horizon",
    "Accumulate model mismatch",
    "Compare with a union bound",
    "Connect to a discounted value bound",
  ]),
  belief: cfg("Sensor correctness p", 0.5, 0.95, 0.7, [
    "Start with an uncertain belief",
    "Add one observation",
    "Update posterior odds",
    "Accumulate independent evidence",
    "Inspect residual uncertainty",
  ]),
  cql: cfg("Conservative weight α", 0, 2, 1, [
    "Inspect dataset support",
    "Notice an unsupported high value",
    "Compute the conservative gradient",
    "Reduce extrapolated optimism",
    "Remember the TD anchoring term",
  ]),
  iql: cfg("Expectile level τ", 0.05, 0.95, 0.8, [
    "Observe dataset action values",
    "Weight positive and negative residuals",
    "Move the value estimate",
    "Balance weighted residuals",
    "Reach the expectile",
  ]),
  shaping: cfg("Discount γ", 0.05, 0.95, 0.8, [
    "Write the potential sequence",
    "Add the first shaping term",
    "Cancel an interior potential",
    "Carry the boundary term",
    "Check the constant return offset",
  ]),
  rlhf: cfg("Reference KL coefficient β", 0.1, 2, 0.6, [
    "Start from the reference",
    "Tilt toward reward",
    "Trade reward against divergence",
    "Normalize the tilted distribution",
    "Reach the analytic bandit optimum",
  ]),
  dpo: cfg("Preference scale β", 0.1, 3, 1, [
    "Start with a wrong preference margin",
    "Approach an ambiguous pair",
    "Cross zero log-ratio margin",
    "Favor the preferred response",
    "Inspect the likelihood gradient",
  ]),
  grpo: cfg("Group reward spread", 0, 0.5, 0.3, [
    "Score the response group",
    "Center each reward",
    "Divide by the group deviation",
    "Inspect group-relative signs",
    "Close one rubric gate",
  ]),
  safety: cfg("Cost multiplier λ", 0, 4, 2.5, [
    "List reward and cost",
    "Increase the cost penalty",
    "Approach the action crossover",
    "Inspect the selected action cost",
    "Check the multiplier update sign",
  ]),
  importance: cfg("Target probability π(action 1)", 0.05, 0.95, 0.2, [
    "Fix behavior support",
    "Specify the target policy",
    "Compute importance ratios",
    "Reweight rewards",
    "Inspect estimator variance",
  ]),
  "multi-agent": cfg("Player 1 probability of heads q", 0.05, 0.95, 0.5, [
    "Define a joint strategy",
    "Change the opponent mixture",
    "Compare pure-action payoffs",
    "Inspect the mixed payoff",
    "Check the worst-case guarantee",
  ]),
  imitation: cfg("Per-step classification error ε", 0.01, 0.3, 0.1, [
    "Fit covered expert states",
    "Extend the rollout horizon",
    "Accumulate a mistake bound",
    "Compare quadratic and linear scaling",
    "Distinguish a bound from measured loss",
  ]),
  evaluation: cfg("Final number of independent runs", 5, 100, 40, [
    "Start with a small sample",
    "Add independent runs",
    "Recompute the mean",
    "Shrink the confidence interval",
    "Distinguish uncertainty from performance",
  ]),
};
const softmax = (v) => {
  const m = Math.max(...v),
    a = v.map((x) => Math.exp(x - m)),
    z = a.reduce((s, x) => s + x, 0);
  return a.map((x) => x / z);
};
const sum = (a) => a.reduce((s, x) => s + x, 0),
  sigmoid = (x) => 1 / (1 + Math.exp(-x));
const curve = (name, fn, x0, x1, color = sceneColors[0]) => ({
  name,
  color,
  points: Array.from({ length: 81 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 80;
    return [x, fn(x)];
  }),
});
const bar = (name, value, index = 0) => ({
  name,
  value,
  color: sceneColors[index % 4],
});
const metric = (name, value) => ({ name, value });
const gaussianData = (() => {
  let seed = 421;
  const u = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
  return Array.from(
    { length: 100 },
    () => 1 + 2 * Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()),
  );
})();
export function atlasSceneModel(id, frame = 0, parameter) {
  const c = atlasSceneConfigs[id];
  if (!c) throw new Error("Unknown atlas scene");
  const p = Math.max(c.min, Math.min(c.max, parameter ?? c.value)),
    k = Math.max(0, Math.min(4, frame)),
    t = k / 4,
    stage = Math.min(4, Math.floor(k + 0.000001));
  const m = {
    id,
    parameter: p,
    frame: k,
    stage,
    caption: c.steps[stage],
    bars: [],
    plots: [],
    points: [],
    metrics: [],
    xLabel: "",
    yLabel: "",
    tex: "",
    note: "",
  };
  const graph = (plots, x, y, xLabel, yLabel) =>
    Object.assign(m, { plots, x, y, xLabel, yLabel });
  switch (id) {
    case "expectation": {
      const weights = [1 - p, p],
        r = [-1, 3],
        mean = sum(weights.map((w, i) => w * r[i]));
      m.bars = [bar("P(−1)", weights[0]), bar("P(3)", weights[1], 1)];
      m.metrics = [
        metric("Expected reward", mean),
        metric("Variance", sum(weights.map((w, i) => w * (r[i] - mean) ** 2))),
      ];
      m.tex = `\\mathbb E[X]=(1-${p.toFixed(2)})(-1)+${p.toFixed(2)}(3)=${mean.toFixed(3)}`;
      m.note =
        "Bar heights are probabilities, not the sizes of the reward outcomes.";
      break;
    }
    case "returns": {
      const r = [1, -1, 2, 4],
        w = r.map((v, i) => v * p ** i),
        n = Math.min(4, stage + 1);
      m.bars = w.map((v, i) => bar("γ^" + i + " r" + i, i < n ? v : 0, i));
      m.metrics = [
        metric("Visible prefix return", sum(w.slice(0, n))),
        metric("Full return", sum(w)),
      ];
      m.tex = `G_0=1-\\gamma+2\\gamma^2+4\\gamma^3=${sum(w).toFixed(4)}`;
      m.note = "Each bar is one signed, discounted contribution.";
      break;
    }
    case "mdp": {
      m.network = { kind: "fork", p, values: [0, 2, 10], active: stage };
      const expected = 2 + 8 * p;
      m.metrics = [
        metric("P(high reward)", p),
        metric("Expected next reward", expected),
      ];
      m.tex = `\\mathbb E[r]=(1-${p.toFixed(2)})2+${p.toFixed(2)}10=${expected.toFixed(3)}`;
      break;
    }
    case "bellman": {
      const n = Math.round(k),
        v0 = (1 - p ** n) / (1 - p),
        v1 = v0 + 10 * p ** n;
      graph(
        [
          curve("Backup from V₀=0", (x) => (1 - p ** x) / (1 - p), 0, 8),
          curve(
            "Backup from W₀=10",
            (x) => (1 - p ** x) / (1 - p) + 10 * p ** x,
            0,
            8,
            sceneColors[1],
          ),
        ],
        [0, 8],
        [0, Math.max(11, 1 / (1 - p) + 1)],
        "Bellman backups",
        "Value",
      );
      m.points = [
        { x: n, y: v0, color: sceneColors[0] },
        { x: n, y: v1, color: sceneColors[1] },
      ];
      m.metrics = [
        metric("Current value gap", v1 - v0),
        metric("Fixed point", 1 / (1 - p)),
      ];
      m.tex = `|V_${n}-W_${n}|=10\\gamma^{${n}}=${(10 * p ** n).toFixed(4)}`;
      break;
    }
    case "dp": {
      const n = Math.round(k),
        v = Array.from({ length: 5 }, (_, i) =>
          i === 4 ? 0 : 4 - i <= n ? 10 * p ** (3 - i) : 0,
        );
      m.network = { kind: "chain", values: v, active: n };
      m.metrics = [
        metric("Synchronous sweeps", n),
        metric("Start-state value", v[0]),
      ];
      m.tex = `V_k(s_0)=${v[0].toFixed(4)},\\quad V^*(s_0)=10\\gamma^3=${(10 * p ** 3).toFixed(4)}`;
      m.note =
        "Reward 10 arrives on entering the terminal; the terminal continuation value is zero.";
      break;
    }
    case "td": {
      const terminal = stage === 4,
        y = 1 + 0.9 * (terminal ? 0 : p),
        v = 2 + 0.1 * t * (y - 2);
      m.bars = [bar("Old V", 2), bar("Target", y, 2), bar("Updated V", v, 1)];
      m.metrics = [
        metric("TD residual", y - 2),
        metric("Bootstrap mask", terminal ? 0 : 1),
      ];
      m.tex = `y=1+0.9\\cdot ${terminal ? 0 : 1}\\cdot${p.toFixed(2)}=${y.toFixed(3)}`;
      m.note =
        "The last frame switches to a true terminal transition, with the same immediate reward.";
      break;
    }
    case "q-control": {
      const probs = [p / 3, 1 - p + p / 3, p / 3],
        expected = 3 - p;
      m.bars = probs.map((v, i) => bar("Action " + (i + 1), v, i));
      m.metrics = [
        metric("Expected next Q", expected),
        metric("Expected SARSA target", 1 + 0.9 * expected),
        metric("Q-learning target", 3.7),
      ];
      m.tex = `\\mathbb E_{\\pi_\\epsilon}Q=3-\\epsilon=${expected.toFixed(3)}`;
      m.note =
        "Bars show behavior probabilities for next-state Q values [1, 3, 2].";
      break;
    }
    case "approximation": {
      const n = Math.round(k),
        w = 2 - 2.5 * (1 - p) ** n;
      graph(
        [curve("Fixed quadratic loss", (x) => 0.5 * (x - 2) ** 2, -1, 5)],
        [-1, 5],
        [0, 5],
        "Parameter w",
        "Loss",
      );
      m.points = [{ x: w, y: 0.5 * (w - 2) ** 2, color: sceneColors[2] }];
      m.metrics = [
        metric("Gradient steps", n),
        metric("Parameter w", w),
        metric("Loss", 0.5 * (w - 2) ** 2),
      ];
      m.tex = `w_k-2=(1-\\alpha)^k(w_0-2),\\quad k=${n}`;
      break;
    }
    case "dqn": {
      const y = 1 + 0.9 * p,
        q = 0.4 + t * (y - 0.4);
      m.bars = [
        bar("Frozen max Q′", p),
        bar("Detached y", y, 2),
        bar("Online Q", q, 1),
      ];
      m.metrics = [
        metric("Detached TD label", y),
        metric("Online sample loss", 0.5 * (q - y) ** 2),
      ];
      m.tex = `L=\\tfrac12(Q_\\theta-\\operatorname{sg}(1+0.9\\cdot${p.toFixed(2)}))^2`;
      m.note =
        "Only the online prediction moves during this illustration; the target is frozen.";
      break;
    }
    case "double": {
      if (stage < 3) {
        m.bars = [
          bar("Online a₁", 2 + p),
          bar("Online a₂", 2 - p),
          bar("Target a₁", 1.8, 1),
          bar("Target a₂", 2.2, 1),
        ];
        m.metrics = [
          metric("Selected target Q", 1.8),
          metric("Target-network maximum", 2.2),
          metric("Noisy online maximum", 2 + p),
        ];
        m.tex =
          "Q_{\\bar\\theta}(\\arg\\max Q_\\theta)=1.8\\ne\\max Q_{\\bar\\theta}=2.2";
        m.note =
          "Action 1 is selected by the online network, including the fixed tie-break at zero noise.";
      } else {
        m.bars = [
          bar("Shared V", 2),
          bar("Centered A₁", -p, 2),
          bar("Centered A₂", p, 2),
          bar("Q₁ = V+A₁", 2 - p, 1),
          bar("Q₂ = V+A₂", 2 + p, 1),
        ];
        m.metrics = [
          metric("Mean centered advantage", 0),
          metric("Mean combined Q", 2),
        ];
        m.tex = "\\tfrac12[(V-A)+(V+A)]=V";
        m.note =
          "This separate dueling illustration centers advantages uniformly over actions.";
      }
      break;
    }
    case "per": {
      const priority = [0.2, 0.8, 1.7],
        z = sum(priority.map((v) => v ** p)),
        prob = priority.map((v) => v ** p / z),
        weights = prob.map((v) => 1 / (3 * v)),
        corrected = sum(prob.map((v, i) => v * weights[i] * [1, 2, 4][i]));
      m.bars = prob.map((v, i) => bar("Entry " + (i + 1), v, i));
      m.metrics = [
        metric("Corrected expected f", corrected),
        metric("Uniform expected f", 7 / 3),
        metric("Largest raw weight", Math.max(...weights)),
      ];
      m.tex = "\\sum_iP(i)\\frac{f_i}{3P(i)}=\\frac{1+2+4}{3}=\\frac73";
      m.note =
        "The equality uses beta=1 and unnormalized weights; bar heights are sampling probabilities.";
      break;
    }
    case "c51": {
      const v = 2 + t * (p - 2),
        lo = Math.floor(v),
        hi = Math.ceil(v),
        mass = Array(5).fill(0);
      if (lo === hi) mass[lo] = 1;
      else {
        mass[lo] = hi - v;
        mass[hi] = v - lo;
      }
      m.bars = mass.map((x, i) => bar("Atom " + i, x, i === lo ? 0 : 1));
      m.metrics = [
        metric("Transported location", v),
        metric("Total probability", sum(mass)),
        metric("Projected mean", sum(mass.map((x, i) => x * i))),
      ];
      m.tex = `\\sum_i m_i=${sum(mass).toFixed(1)},\\quad\\sum_i i\\,m_i=${v.toFixed(3)}`;
      m.note =
        "A unit mass moves from atom 2 to the chosen location; interpolation conserves mass.";
      break;
    }
    case "policy-gradient": {
      const z = -2 + t * (p + 2),
        prob = sigmoid(z);
      graph(
        [curve("Expected bandit reward", sigmoid, -4, 4)],
        [-4, 4],
        [0, 1.1],
        "Policy logit z",
        "Probability / expected reward",
      );
      m.points = [{ x: z, y: prob, color: sceneColors[2] }];
      m.metrics = [
        metric("Probability of reward 1", prob),
        metric("Exact logit gradient", prob * (1 - prob)),
      ];
      m.tex = "J(z)=\\sigma(z),\\quad J'(z)=\\sigma(z)(1-\\sigma(z))";
      break;
    }
    case "baseline": {
      const samples = [0.5 * p, 0.5 * (2 - p)],
        mean = 0.5,
        variance = sum(samples.map((x) => (x - mean) ** 2)) / 2;
      m.bars = samples.map((v, i) => bar("Gradient sample " + (i + 1), v, i));
      m.metrics = [
        metric("Expected gradient", mean),
        metric("Gradient variance", variance),
      ];
      m.tex = `\\mathbb E[\\widehat g]=0.5,\\quad\\operatorname{Var}(\\widehat g)=\\tfrac14(b-1)^2=${variance.toFixed(4)}`;
      m.note =
        "The policy is fixed at probability 1/2; only its state-only baseline changes.";
      break;
    }
    case "actor-critic": {
      const prob = sigmoid(0.2 * p * t),
        critic = 2 + 0.1 * p * t;
      graph(
        [
          curve(
            "Actor after a detached TD signal",
            (x) => sigmoid(0.2 * x),
            -2,
            2,
          ),
        ],
        [-2, 2],
        [0.35, 0.65],
        "Detached TD residual δ",
        "Selected-action probability",
      );
      m.points = [{ x: p * t, y: prob, color: sceneColors[2] }];
      m.metrics = [
        metric("Critic V after step", critic),
        metric("Actor selected-action probability", prob),
      ];
      m.tex = `V^+=2+0.1\\delta,\\quad\\pi^+=\\sigma(0.2\\delta)`;
      m.note =
        "The binary actor uses a single logit, initial probability 1/2 and actor step size 0.4.";
      break;
    }
    case "gae": {
      const residual = [1, -0.5, 2, 1],
        terms = residual.map((x, i) => (0.9 * p) ** i * x),
        n = Math.min(4, stage + 1);
      m.bars = terms.map((x, i) => bar("Residual " + i, i < n ? x : 0, i));
      m.metrics = [
        metric("Visible GAE prefix", sum(terms.slice(0, n))),
        metric("Complete GAE", sum(terms)),
      ];
      m.tex = `\\widehat A=\\sum_{l=0}^3(0.9\\lambda)^l\\delta_l=${sum(terms).toFixed(6)}`;
      break;
    }
    case "trpo": {
      const scale = Math.sqrt((2 * p) / 1.25),
        dx = scale * 0.25,
        dy = scale;
      const ellipse = {
        name: "Local KL boundary",
        color: sceneColors[0],
        points: Array.from({ length: 81 }, (_, i) => {
          const a = (2 * Math.PI * i) / 80;
          return [
            Math.sqrt((2 * p) / 4) * Math.cos(a),
            Math.sqrt(2 * p) * Math.sin(a),
          ];
        }),
      };
      graph(
        [
          ellipse,
          {
            name: "Natural-gradient step",
            color: sceneColors[1],
            points: [
              [0, 0],
              [t * dx, t * dy],
            ],
          },
        ],
        [-1, 1],
        [-1, 1],
        "First parameter coordinate",
        "Second parameter coordinate",
      );
      m.points = [{ x: t * dx, y: t * dy, color: sceneColors[2] }];
      m.metrics = [
        metric("Quadratic KL", 0.5 * (4 * (t * dx) ** 2 + (t * dy) ** 2)),
        metric("KL budget", p),
        metric("Linear surrogate gain", t * (dx + dy)),
      ];
      m.tex =
        "F=\\operatorname{diag}(4,1),\\quad x^*\\propto F^{-1}(1,1)^\\top";
      break;
    }
    case "ppo": {
      const r = 0.4 + 1.2 * t,
        clip = (x) => Math.max(0.8, Math.min(1.2, x)),
        f = (x) => Math.min(x * p, clip(x) * p),
        ys = [0, p * 0.4, p * 1.6, 0.8 * p, 1.2 * p];
      graph(
        [
          curve("Unclipped r A", (x) => x * p, 0.3, 1.7, sceneColors[0]),
          curve("PPO sample surrogate", f, 0.3, 1.7, sceneColors[2]),
        ],
        [0.3, 1.7],
        [Math.min(...ys) - 0.3, Math.max(...ys) + 0.3],
        "Probability ratio r",
        "Ascent objective",
      );
      m.points = [{ x: r, y: f(r), color: sceneColors[1] }];
      m.metrics = [
        metric("Current ratio", r),
        metric("Advantage", p),
        metric("Clipped objective", f(r)),
      ];
      m.tex = `\\ell(r,A)=\\min(rA,\\operatorname{clip}(r,0.8,1.2)A)=${f(r).toFixed(3)}`;
      m.note =
        "Change the advantage sign. Positive advantages flatten above 1.2; negative ones flatten below 0.8.";
      break;
    }
    case "ddpg": {
      const n = Math.round(k * 2);
      let a = -0.8;
      for (let i = 0; i < n; i++) a += p * 2 * (0.7 - a);
      const q = (x) => 1 - (x - 0.7) ** 2;
      graph(
        [curve("Fixed differentiable critic", q, -1, 1)],
        [-1, 1],
        [-2, 1.2],
        "Continuous action a",
        "Q(a)",
      );
      m.points = [{ x: a, y: q(a), color: sceneColors[2] }];
      m.metrics = [
        metric("Actor action", a),
        metric("Action gradient", 2 * (0.7 - a)),
        metric("Critic value", q(a)),
      ];
      m.tex = "\\nabla_a Q=2(0.7-a),\\quad a^+=a+\\alpha\\nabla_aQ";
      break;
    }
    case "td3": {
      const q1 = (a) => 1 - (a - 0.6) ** 2 + p * Math.exp(-50 * (a + 0.2) ** 2),
        q2 = (a) => 1 - (a - 0.6) ** 2 - 0.3 * p,
        a = -1 + 2 * t,
        low = Math.min(q1(a), q2(a)),
        smooth =
          (Math.min(q1(Math.max(-1, a - 0.08)), q2(Math.max(-1, a - 0.08))) +
            Math.min(q1(Math.min(1, a + 0.08)), q2(Math.min(1, a + 0.08)))) /
          2;
      graph(
        [
          curve("Critic 1", q1, -1, 1),
          curve("Critic 2", q2, -1, 1, sceneColors[1]),
          curve(
            "Pointwise minimum",
            (x) => Math.min(q1(x), q2(x)),
            -1,
            1,
            sceneColors[2],
          ),
        ],
        [-1, 1],
        [-2.5, 2.8],
        "Target action",
        "Estimated Q",
      );
      m.points = [{ x: a, y: low, color: sceneColors[2] }];
      m.metrics = [
        metric("Minimum estimate", low),
        metric("Two-point smoothed illustration", smooth),
      ];
      m.tex = "y=r+\\gamma b\\min(Q_1(s',\\widetilde a),Q_2(s',\\widetilde a))";
      m.note =
        "Smoothing here averages two offsets for illustration; actual TD3 samples clipped Gaussian noise.";
      break;
    }
    case "sac": {
      const q = [0, 1, 2],
        optimal = softmax(q.map((v) => v / p)),
        prob = optimal.map((v) => (1 - t) / 3 + t * v),
        entropy = -sum(prob.map((v) => v * Math.log(v))),
        reward = sum(prob.map((v, i) => v * q[i])),
        soft = 2 + p * Math.log(sum(q.map((v) => Math.exp((v - 2) / p))));
      m.bars = prob.map((v, i) => bar("Action " + i, v, i));
      m.metrics = [
        metric("Expected Q + α entropy", reward + p * entropy),
        metric("Optimal soft value", soft),
        metric("Policy entropy", entropy),
      ];
      m.tex =
        "\\pi_a^*\\propto e^{Q_a/\\alpha},\\quad V_\\alpha=\\alpha\\log\\sum_a e^{Q_a/\\alpha}";
      m.note =
        "This finite-action optimum explains entropy regularization; it is not a continuous SAC benchmark.";
      break;
    }
    case "bandits": {
      const mean = [0.6, 0.8, 0.7],
        n = [3, 6, 12],
        bonus = n.map((v) => p * Math.sqrt((2 * Math.log(21)) / v)),
        score = mean.map((v, i) => v + bonus[i]),
        chosen = score.indexOf(Math.max(...score));
      m.bars = score.map((v, i) => bar("Arm " + (i + 1), v, i));
      m.metrics = [
        metric("Selected arm", chosen + 1),
        metric("Its sample count", n[chosen]),
        metric("Its optimism bonus", bonus[chosen]),
      ];
      m.tex = "a^*=\\arg\\max_a[\\widehat\\mu_a+c\\sqrt{2\\log(21)/N_a}]";
      m.note =
        "Means are [0.6, 0.8, 0.7] and counts [3, 6, 12]. These bonuses are not empirical 95% confidence intervals.";
      break;
    }
    case "model-based": {
      const h = Math.round(1 + k),
        exact = 1 - (1 - p) ** h,
        bound = Math.min(1, h * p);
      graph(
        [
          curve(
            "Independent mismatch toy probability",
            (x) => 1 - (1 - p) ** x,
            0,
            5,
          ),
          curve("Union bound", (x) => Math.min(1, x * p), 0, 5, sceneColors[2]),
        ],
        [0, 5],
        [0, 1.05],
        "Imagined rollout horizon",
        "Probability of some mismatch",
      );
      m.points = [{ x: h, y: exact, color: sceneColors[1] }];
      m.metrics = [
        metric("Toy mismatch probability", exact),
        metric("Union bound", bound),
        metric("Discounted value bound (γ=.9, Rmax=1)", 180 * p),
      ];
      m.tex = "1-(1-\\epsilon)^H\\leq\\min(1,H\\epsilon)";
      m.note =
        "The exact curve assumes independent mismatch events; the union bound does not. The value bound is a separate worst-case quantity.";
      break;
    }
    case "belief": {
      const n = Math.round(k),
        post = (i) => sigmoid(i * Math.log(p / (1 - p))),
        v = post(n),
        entropy = -(v * Math.log(v) + (1 - v) * Math.log(1 - v));
      graph(
        [curve("Posterior of hidden state 1", post, 0, 4)],
        [0, 4],
        [0.45, 1.05],
        "Repeated matching observations",
        "Posterior belief",
      );
      m.points = [{ x: n, y: v, color: sceneColors[2] }];
      m.metrics = [
        metric("Posterior belief", v),
        metric("Belief entropy", entropy),
      ];
      m.tex = "\\frac{b_n(1)}{b_n(0)}=\\left(\\frac{p}{1-p}\\right)^n";
      m.note =
        "Fixed hidden state, prior 1/2 and conditionally independent observations are assumed.";
      break;
    }
    case "cql": {
      const q = [0.5, 1, 3],
        mu = [0.8, 0.2, 0],
        prob = softmax(q),
        grad = prob.map((v, i) => v - mu[i]),
        next = q.map((v, i) => v - 0.5 * t * p * grad[i]);
      m.bars = next.map((v, i) =>
        bar(
          i === 2 ? "Unsupported a₃" : "Dataset a" + (i + 1),
          v,
          i === 2 ? 3 : i,
        ),
      );
      m.metrics = [
        metric("Unsupported-action change", next[2] - q[2]),
        metric("Penalty gradient on unsupported action", grad[2]),
      ];
      m.tex = "\\partial_{Q_a}C=\\operatorname{softmax}(Q)_a-\\mu_D(a)";
      m.note =
        "Only one conservative-regularizer step is shown, holding its initial gradient fixed along the interpolation. The full CQL loss also includes TD fitting.";
      break;
    }
    case "iql": {
      const optimum = 2 * p,
        v = 1 + t * (optimum - 1),
        loss = (x) => 0.5 * (1 - p) * x * x + 0.5 * p * (2 - x) ** 2;
      graph(
        [curve("Two-point expectile loss", loss, 0, 2)],
        [0, 2],
        [0, 2.05],
        "Value estimate v",
        "Asymmetric squared loss",
      );
      m.points = [{ x: v, y: loss(v), color: sceneColors[2] }];
      m.metrics = [
        metric("Current value estimate", v),
        metric("Exact expectile", optimum),
        metric("First-order residual", v - optimum),
      ];
      m.tex =
        "L(v)=\\tfrac12(1-\\tau)v^2+\\tfrac12\\tau(2-v)^2,\\quad v^*=2\\tau";
      break;
    }
    case "shaping": {
      const r = [0, 1, 2],
        phi = [3, 2, 1, 0],
        orig = r.map((v, i) => p ** i * v),
        shape = r.map((v, i) => p ** i * (v + p * phi[i + 1] - phi[i])),
        n = Math.min(3, stage + 1);
      m.bars = shape.map((v, i) =>
        bar("Shaped contribution " + i, i < n ? v : 0, i),
      );
      m.metrics = [
        metric("Complete original return", sum(orig)),
        metric("Complete shaped return", sum(shape)),
        metric("Return offset", sum(shape) - sum(orig)),
      ];
      m.tex = "G'_0-G_0=-\\Phi(s_0)+\\gamma^T\\Phi(s_T)=-3";
      m.note =
        "Potentials are [3, 2, 1, 0], so the terminal boundary term vanishes.";
      break;
    }
    case "rlhf": {
      const q = [0.6, 0.3, 0.1],
        r = [0, 1, 2],
        optimal = softmax(q.map((v, i) => Math.log(v) + r[i] / p)),
        prob = q.map((v, i) => (1 - t) * v + t * optimal[i]),
        kl = sum(prob.map((v, i) => v * Math.log(v / q[i]))),
        reward = sum(prob.map((v, i) => v * r[i]));
      m.bars = prob.map((v, i) => bar("Response " + (i + 1), v, i));
      m.metrics = [
        metric("Expected reward", reward),
        metric("KL to reference", kl),
        metric("Regularized objective", reward - p * kl),
      ];
      m.tex = "\\pi_i^*=q_i e^{R_i/\\beta}/Z";
      m.note =
        "A straight-line interpolation from the reference to the exact finite-bandit optimum is shown, not a simulated PPO training trajectory.";
      break;
    }
    case "dpo": {
      const margin = -2 + 4 * t,
        loss = (x) => Math.log1p(Math.exp(-p * x)),
        prob = sigmoid(p * margin);
      graph(
        [curve("Preference negative log likelihood", loss, -2, 2)],
        [-2, 2],
        [0, Math.max(1, loss(-2) + 0.2)],
        "Policy/reference log-ratio margin Δ",
        "DPO pair loss",
      );
      m.points = [{ x: margin, y: loss(margin), color: sceneColors[2] }];
      m.metrics = [
        metric("Preferred response probability", prob),
        metric("Pair loss", loss(margin)),
        metric("Loss margin gradient", -p * (1 - prob)),
      ];
      m.tex = "\\ell(\\Delta)=-\\log\\sigma(\\beta\\Delta)";
      break;
    }
    case "grpo": {
      const rewards = [0.5 - p, 0.5, stage === 4 ? 0 : 0.5 + p],
        mean = sum(rewards) / 3,
        std = Math.sqrt(sum(rewards.map((v) => (v - mean) ** 2)) / 3),
        adv = rewards.map((v) => (v - mean) / (std + 1e-8));
      m.bars = (stage < 2 ? rewards : adv).map((v, i) =>
        bar((stage < 2 ? "Reward " : "Advantage ") + (i + 1), v, i),
      );
      m.metrics = [
        metric("Group mean", mean),
        metric("Population deviation", std),
        metric("Mean advantage", sum(adv) / 3),
      ];
      m.tex = "A_i=(R_i-\\bar R)/(s_R+\\epsilon),\\quad\\sum_iA_i=0";
      m.note =
        stage === 4
          ? "The final frame closes response 3’s rubric gate and recomputes the entire group."
          : "At zero spread and with all gates open, every group advantage is zero.";
      break;
    }
    case "safety": {
      const l = t * p,
        score = [1 - 0.1 * l, 3 - l],
        choice = score[0] >= score[1] ? 0 : 1,
        cost = [0.1, 1][choice];
      graph(
        [
          curve("Safer action: R−λC", (x) => 1 - 0.1 * x, 0, 4),
          curve("Riskier action: R−λC", (x) => 3 - x, 0, 4, sceneColors[3]),
        ],
        [0, 4],
        [-1.2, 3.2],
        "Cost multiplier λ",
        "Penalized action score",
      );
      m.points = [{ x: l, y: score[choice], color: sceneColors[2] }];
      m.metrics = [
        metric("Chosen action cost", cost),
        metric("Cost budget", 0.4),
        metric("Next projected λ", Math.max(0, l + 0.25 * (cost - 0.4))),
      ];
      m.tex = "\\lambda^+=[\\lambda+0.25(J_C-0.4)]_+";
      m.note =
        "A two-action greedy illustration; expected-cost control is not a per-trajectory hard safety guarantee.";
      break;
    }
    case "importance": {
      const mu = [0.8, 0.2],
        target = [p, 1 - p],
        rewards = [1, 3],
        ratios = target.map((v, i) => v / mu[i]);
      const mean = mu.reduce((v, x, i) => v + x * ratios[i] * rewards[i], 0),
        variance = mu.reduce(
          (v, x, i) => v + x * (ratios[i] * rewards[i] - mean) ** 2,
          0,
        );
      m.bars = ratios.map((v, i) => bar("Ratio action " + (i + 1), v, i));
      m.metrics = [
        metric("Target expected reward", 3 - 2 * p),
        metric("IS expected reward", mean),
        metric("One-sample IS variance", variance),
      ];
      m.tex = "\\sum_a\\mu(a)\\frac{\\pi(a)}{\\mu(a)}r(a)=\\sum_a\\pi(a)r(a)";
      m.note =
        "Behavior probabilities are [0.8,0.2] and rewards [1,3]. Full support holds in this toy bandit.";
      break;
    }
    case "multi-agent": {
      const opponent = 0.05 + 0.9 * t,
        payoff = (x) => (2 * p - 1) * (2 * x - 1);
      graph(
        [
          curve("Pure heads payoff", (x) => 2 * x - 1, 0, 1),
          curve("Pure tails payoff", (x) => 1 - 2 * x, 0, 1, sceneColors[3]),
          curve("Player 1 mixed payoff", payoff, 0, 1, sceneColors[2]),
        ],
        [0, 1],
        [-1.1, 1.1],
        "Opponent probability of heads",
        "Player 1 expected payoff",
      );
      m.points = [{ x: opponent, y: payoff(opponent), color: sceneColors[2] }];
      m.metrics = [
        metric("Current expected payoff", payoff(opponent)),
        metric("Worst-case payoff", -Math.abs(2 * p - 1)),
        metric("Exploitability in this game", Math.abs(2 * p - 1)),
      ];
      m.tex = "V(q,p)=(2q-1)(2p-1),\\quad\\min_pV=-|2q-1|";
      m.note =
        "Zero-sum matching pennies. At q=1/2 the payoff is zero for every opponent mixture.";
      break;
    }
    case "imitation": {
      const horizon = Math.round(1 + 19 * t),
        bound = (n) =>
          sum(
            Array.from({ length: Math.floor(n) }, (_, i) =>
              Math.min(1, (i + 1) * p),
            ),
          );
      graph(
        [
          curve("BC union-bound illustration", bound, 1, 20),
          curve("Linear Tε reference", (x) => x * p, 1, 20, sceneColors[1]),
        ],
        [1, 20],
        [0, 21],
        "Rollout horizon T",
        "Cumulative expected-loss upper bound",
      );
      m.points = [{ x: horizon, y: bound(horizon), color: sceneColors[2] }];
      m.metrics = [
        metric("Horizon", horizon),
        metric("Union-bound sum", bound(horizon)),
        metric("Linear reference only", horizon * p),
      ];
      m.tex = "\\mathbb E[L_T]\\leq\\sum_{t=1}^T\\min(1,t\\epsilon)";
      m.note =
        "This is a worst-case error-propagation illustration, not an empirical BC result or an unconditional DAgger guarantee.";
      break;
    }
    case "evaluation": {
      const n = Math.max(5, Math.round(5 + t * (Math.round(p) - 5))),
        mean = sum(gaussianData.slice(0, n)) / n,
        margin = (1.96 * 2) / Math.sqrt(n),
        meanAt = (i) =>
          sum(gaussianData.slice(0, Math.max(1, Math.round(i)))) /
          Math.max(1, Math.round(i));
      graph(
        [
          curve("Seeded running mean", meanAt, 5, 100),
          curve("True Gaussian mean", () => 1, 5, 100, sceneColors[1]),
        ],
        [5, 100],
        [-1.5, 3.5],
        "Independent Gaussian draws",
        "Mean estimate",
      );
      m.points = [{ x: n, y: mean, color: sceneColors[2] }];
      m.interval = { x: n, low: mean - margin, high: mean + margin };
      m.metrics = [
        metric("Independent samples", n),
        metric("Observed mean", mean),
        metric("95% normal margin (known σ=2)", margin),
      ];
      m.tex = "\\bar X\\pm1.96\\frac{2}{\\sqrt n}";
      m.note =
        "One seeded Gaussian illustration with known σ, not empirical RL benchmark results or a coverage estimate.";
      break;
    }
  }
  return m;
}
