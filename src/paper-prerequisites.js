// Recommended mathematical background, not a claim that the authors list prerequisites.
export const mathConcepts = [
  {
    id: "probability",
    title: "Probability and conditional expectation",
    foundation: true,
    terms: /expectation|probabilit|stochastic|distribution/i,
    why: "Read policies, transitions and returns as distributions and expectations, rather than single sampled outcomes.",
    formula: String.raw`\mathbb E[X\mid S=s]=\sum_x x\,p(x\mid s)`,
    link: "expectation",
    level: "Foundation",
  },
  {
    id: "linear-algebra",
    title: "Vectors, matrices and norms",
    foundation: true,
    terms: /linear|matrix|vector|norm|feature|embedding/i,
    why: "Follow feature representations, parameter vectors, matrix transitions and norm-based error bounds.",
    formula: String.raw`\|x\|_2=\sqrt{x^\top x},\qquad (Ax)_i=\sum_j A_{ij}x_j`,
    link: "function-approximation",
    level: "Foundation",
  },
  {
    id: "calculus",
    title: "Gradients and the chain rule",
    terms: /gradient|differentiab|backprop|optimi[sz]|distill|policy learning/i,
    why: "Understand how a model or policy is updated by differentiating a loss through its parameters.",
    formula: String.raw`\nabla_\theta f(g(\theta))=J_g(\theta)^\top\nabla_g f`,
    link: "policy-gradient",
    level: "Core",
  },
  {
    id: "mdp",
    title: "Markov chains and Bellman equations",
    terms:
      /\bMDPs?\b|Markov|Bellman|value iteration|value function|Q.function/i,
    why: "Interpret state transitions, value functions and the recursion linking immediate rewards to future value.",
    formula: String.raw`V^\pi=r_\pi+\gamma P_\pi V^\pi`,
    link: "bellman",
    level: "Core",
  },
  {
    id: "information",
    title: "Entropy, cross-entropy and KL divergence",
    terms: /Kullback|\bKL\b|entropy|distill|log.probabilit|relative entropy/i,
    why: "Read distribution matching, teacher/student losses and penalties that keep a policy near a reference.",
    formula: String.raw`D_{\mathrm{KL}}(p\|q)=\sum_i p_i\log\frac{p_i}{q_i}`,
    link: "rlhf",
    level: "Core",
  },
  {
    id: "importance",
    title: "Importance sampling and change of measure",
    terms: /importance|off.policy|likelihood ratio|policy ratio/i,
    why: "Understand how a loss or return estimated under one sampling policy is corrected for another.",
    formula: String.raw`\mathbb E_{x\sim p}[f(x)]=\mathbb E_{x\sim q}\!\left[\frac{p(x)}{q(x)}f(x)\right]`,
    link: "off-policy-evaluation",
    level: "Core",
  },
  {
    id: "policy-gradient",
    title: "Score-function policy gradients",
    terms: /policy gradient|REINFORCE|\bGRPO\b|\bPPO\b|actor.critic/i,
    why: "Connect sampled rewards or advantages to the gradient of a stochastic policy objective.",
    formula: String.raw`\nabla_\theta\mathbb E_{a\sim\pi_\theta}R(a)=\mathbb E[R(a)\nabla_\theta\log\pi_\theta(a)]`,
    link: "policy-gradient",
    level: "Core",
  },
  {
    id: "trust-regions",
    title: "Clipping, trust regions and local geometry",
    terms: /trust.region|\bTRPO\b|\bPPO\b|clipped|clipping|Fisher/i,
    why: "Interpret constrained policy updates, probability-ratio clipping and local quadratic approximations.",
    formula: String.raw`\ell(r,A)=\min\!\left(rA,\operatorname{clip}(r,1-\epsilon,1+\epsilon)A\right)`,
    link: "ppo",
    level: "Advanced",
  },
  {
    id: "concentration",
    title: "Concentration inequalities and martingales",
    terms:
      /high.probability|Hoeffding|Azuma|Bernstein|martingale|concentration|confidence bound/i,
    why: "Read high-probability guarantees and distinguish a sample deviation bound from an expected-value result.",
    formula: String.raw`\Pr(|\bar X_n-\mu|\geq\epsilon)\leq2e^{-2n\epsilon^2}\quad(X_i\in[0,1]\text{ independent})`,
    link: "exploration",
    level: "Advanced",
  },
  {
    id: "regret",
    title: "Online learning, regret and asymptotic rates",
    terms: /regret|adversarial|online learning|no.regret|lower bound/i,
    why: "Understand comparison to a best policy in hindsight, upper/lower bounds and what square-root rates mean.",
    formula: String.raw`\operatorname{Regret}_K=\sum_{k=1}^K\ell_k(\pi_k)-\min_\pi\sum_{k=1}^K\ell_k(\pi)`,
    link: "exploration",
    level: "Advanced",
  },
  {
    id: "group-statistics",
    title: "Variance and group-normalized advantages",
    terms:
      /\bGRPO\b|group.relative|group.normaliz|standard deviation|group advantage/i,
    why: "Follow within-group baselines, standardization conventions and constant-reward edge cases.",
    formula: String.raw`A_i=\frac{R_i-\bar R}{\sigma_R+\epsilon}`,
    link: "rubric-grpo",
    level: "Core",
  },
  {
    id: "preference",
    title: "Logistic likelihood and preference models",
    terms: /\bDPO\b|Bradley.Terry|preference|pairwise/i,
    why: "Understand how chosen/rejected examples become a pairwise likelihood rather than an environment reward.",
    formula: String.raw`P(y_w\succ y_l)=\sigma(r_w-r_l),\qquad\sigma(x)=\frac1{1+e^{-x}}`,
    link: "dpo",
    level: "Core",
  },
  {
    id: "duality",
    title: "Constrained optimization and Lagrange multipliers",
    terms:
      /Lagrang|primal.dual|dual ascent|cost constraint|constrained reinforcement|safety constraint/i,
    why: "Interpret reward/cost tradeoffs and the signs of primal and dual updates.",
    formula: String.raw`\mathcal L(\theta,\lambda)=J_R(\theta)-\lambda(J_C(\theta)-d),\quad\lambda\geq0`,
    link: "constrained-rl",
    level: "Advanced",
  },
  {
    id: "evaluation",
    title: "Statistical estimation and uncertainty",
    terms:
      /confidence interval|standard error|bootstrap|statistical signific|seed variance|evaluation protocol/i,
    why: "Separate a reported average from uncertainty, paired comparisons and reproducibility evidence.",
    formula: String.raw`\operatorname{SE}(\bar X)=\frac{\sigma}{\sqrt n}\quad\text{for independent samples}`,
    link: "evaluation",
    level: "Core",
  },
  {
    id: "games",
    title: "Game theory and mixed strategies",
    terms: /multi.agent|Nash|zero.sum|equilibrium|Markov game/i,
    why: "Read objectives involving multiple adapting policies and reason about unilateral deviations.",
    formula: String.raw`v(p,q)=p^\top A q`,
    link: "multi-agent",
    level: "Advanced",
  },
  {
    id: "distributional",
    title: "Distributional targets and quantiles",
    terms: /distributional|Wasserstein|quantile|\bC51\b|optimal transport/i,
    why: "Distinguish distributions of returns from their means and understand categorical or quantile approximations.",
    formula: String.raw`\mathbb E[Z]=\sum_i p_i z_i`,
    link: "distributional",
    level: "Advanced",
  },
  {
    id: "bayes",
    title: "Bayesian conditioning and belief states",
    terms: /Bayes|belief state|\bPOMDP\b|partially observ/i,
    why: "Track hidden-state uncertainty with prediction and observation updates.",
    formula: String.raw`b'(s')\propto O(o\mid s')\sum_s P(s'\mid s,a)b(s)`,
    link: "pomdp",
    level: "Advanced",
  },
  {
    id: "models",
    title: "Dynamics models and planning",
    terms: /model.based|model predictive|\bMPC\b|learned dynamics|world model/i,
    why: "Understand planning through an estimated transition model and how model errors affect predicted returns.",
    formula: String.raw`\widehat V_{h+1}(s)=\max_a\left[r(s,a)+\gamma\sum_{s'}\widehat P(s'\mid s,a)\widehat V_h(s')\right]`,
    link: "model-based",
    level: "Advanced",
  },
  {
    id: "rubric",
    title: "Weighted rewards, gates and bounds",
    terms: /rubric|weighted reward|reward aggregat|hard gate|criterion.score/i,
    why: "Check normalization, monotonicity and how hard constraints interact with a multi-criterion reward.",
    formula: String.raw`R=g\frac{\sum_k w_k s_k}{\sum_k w_k},\quad w_k\geq0,\quad\sum_k w_k>0,\quad s_k\in[0,1]`,
    link: "rubric-grpo",
    level: "Core",
  },
];
export function inferPrerequisites(paper, fullText = "") {
  const abstract = (paper.title + ". " + paper.abstract).replace(/\s+/g, " ");
  const body = String(fullText).replace(/\s+/g, " ");
  return mathConcepts.flatMap((concept) => {
    const a = concept.terms.exec(abstract),
      b = a ? null : concept.terms.exec(body);
    if (!concept.foundation && !a && !b) return [];
    const matched = a || b,
      source = a ? abstract : body;
    const evidence = matched
      ? source
          .slice(
            Math.max(0, matched.index - 85),
            matched.index + matched[0].length + 125,
          )
          .trim()
      : null;
    return [
      {
        ...concept,
        terms: undefined,
        basis: a ? "abstract" : b ? "full-text" : "foundation",
        evidence,
        note: matched
          ? `Recommended because the ${a ? "title/abstract" : "HTML full text"} discusses “${matched[0]}”.`
          : "General background recommended for reading RL research; not an explicit prerequisite statement by the authors.",
      },
    ];
  });
}
