import { atlasLabs, enrichCoreLabs } from "./atlas-labs.js";
// Course text and explicit LaTeX markup. Code and test data stay literal.
export const lessons = [
  {
    id: "foundations",
    n: "01",
    title: "Thinking in Reinforcement Learning",
    short: "Getting started with RL",
    tag: "FOUNDATIONS",
    time: 15,
    level: "Easy",
    color: "green",
    icon: "sparkles",
    desc: "An agent is not given the answer. It learns to make decisions from what happens next.",
    question: "What is the difference between reward and value?",
    answers: [
      "Reward is feedback for one step; value is the expected sum of future rewards.",
      "Reward is always positive; value is always negative.",
      "Reward and value are the same quantity.",
    ],
    correct: 0,
    intuition:
      "Imagine learning your way around a new city. Each turn is an action, your current location is the state, and travel time provides feedback. RL learns a decision-making strategy (a policy) from a sequence of interactions, rather than a correct label for each turn.",
    sections: [
      [
        "The agent–environment loop",
        "At step t, the agent observes state Sₜ and chooses Aₜ according to policy π. The environment then returns Rₜ₊₁ and Sₜ₊₁. Reward describes the immediate objective; return captures the long-term consequences.",
      ],
      [
        "The real objective",
        "An action can lose points now while opening a path to a better outcome. We therefore optimize expected return, rather than just the next reward.",
      ],
    ],
    eq: "G_t=\\sum_{k=0}^{\\infty}\\gamma^k R_{t+k+1},\\qquad J(\\pi)=\\mathbb E_\\pi[G_0]",
    proofTitle: "Why is discounted return bounded?",
    assume: "Assume |Rₜ| ≤ Rmax and 0 ≤ γ < 1.",
    proof: [
      [
        "Apply the triangle inequality",
        "|G_t| \\leq \\sum_{k=0}^{\\infty}\\gamma^k|R_{t+k+1}|",
      ],
      [
        "Bound each reward and sum the geometric series",
        "|G_t|\\leq R_{max}\\sum_{k=0}^{\\infty}\\gamma^k=\\frac{R_{max}}{1-\\gamma}",
      ],
    ],
    takeaway:
      "Discounting expresses a time preference and makes return finite when rewards are bounded.",
    lab: "return",
  },
  {
    id: "probability",
    n: "02",
    title: "Probability & Expectation",
    short: "Probability & expectation",
    tag: "MATHEMATICAL TOOLS",
    time: 20,
    level: "Easy",
    color: "blue",
    icon: "dices",
    desc: "From random variables to conditional expectation: a language for describing an uncertain world.",
    question: "What is E[X | S]?",
    answers: [
      "The largest possible value of X.",
      "The expected value of X given state S.",
      "X is always equal to S.",
    ],
    correct: 1,
    intuition:
      "A slot machine might pay 10 points with probability 0.2 and zero otherwise. A single outcome is hard to predict, but its expectation is 2. RL uses expectations to evaluate decisions across many interactions.",
    sections: [
      [
        "Probability distributions",
        "For a discrete random variable X, probabilities p(x) are nonnegative and sum to 1. Expectation is a weighted average, and need not be an outcome you can actually observe.",
      ],
      [
        "The law of total expectation",
        "When an outcome depends on the next state, first take the expectation conditional on that state, then average over states. This is the tool we will use to derive the Bellman equation.",
      ],
    ],
    eq: "\\mathbb E[X]=\\sum_x xp(x),\\qquad \\mathbb E[X]=\\mathbb E[\\mathbb E[X\\mid S]]",
    proofTitle: "Prove the law of total expectation (discrete case)",
    assume:
      "Assume X is integrable and the sums are finite or absolutely convergent.",
    proof: [
      [
        "Expand the outer expectation",
        "\\mathbb E[\\mathbb E[X|S]]=\\sum_s p(s)\\sum_x xp(x|s)",
      ],
      [
        "Use p(s)p(x|s) = p(x,s), then marginalize",
        "=\\sum_x x\\sum_s p(x,s)=\\sum_x xp(x)=\\mathbb E[X]",
      ],
    ],
    takeaway:
      "Nested expectations let us break a long-term problem into one-step decisions.",
    lab: "expectation",
  },
  {
    id: "mdp",
    n: "03",
    title: "Markov Decision Process",
    short: "The Markov world",
    tag: "MODELING",
    time: 25,
    level: "Easy",
    color: "orange",
    icon: "network",
    desc: "Turn a decision-making problem into states, actions, transitions, and rewards.",
    question: "When does a state have the Markov property?",
    answers: [
      "It stores the entire history as text.",
      "It always determines the reward uniquely.",
      "Given the current state and action, history provides no extra information about the next step.",
    ],
    correct: 2,
    intuition:
      "In Gridworld, knowing the current cell is enough to predict the next location after an action. In a card game, a state containing only the last card drawn is usually insufficient: the history of revealed cards may matter.",
    sections: [
      [
        "The five components of an MDP",
        "A finite discounted MDP consists of states S, actions A, transition probabilities P(s′|s,a), expected rewards r(s,a), and discount γ. A terminal state ends the episode; its continuation value is set to zero.",
      ],
      [
        "Policies and transition matrices",
        "Policy π(a|s) defines a distribution over actions. For a fixed policy, Pπ(s,s′) = Σₐ π(a|s)P(s′|s,a). Each row of Pπ sums to 1.",
      ],
    ],
    eq: "P(S_{t+1}\\mid S_t,A_t,S_{t-1},\\ldots)=P(S_{t+1}\\mid S_t,A_t)",
    proofTitle: "Pπ is a stochastic matrix",
    assume: "π and every P(·|s,a) are valid probability distributions.",
    proof: [
      [
        "Sum one row",
        "\\sum_{s'}P_\\pi(s,s')=\\sum_{s'}\\sum_a\\pi(a|s)P(s'|s,a)",
      ],
      [
        "Exchange the sums and use normalization",
        "=\\sum_a\\pi(a|s)\\underbrace{\\sum_{s'}P(s'|s,a)}_{1}=1",
      ],
    ],
    takeaway:
      "A useful state must retain enough information to predict the consequences of an action.",
    lab: "expectation",
  },
  {
    id: "bellman",
    n: "04",
    title: "The Bellman Equation",
    short: "The Bellman equation",
    tag: "THE CORE IDEA",
    time: 30,
    level: "Medium",
    color: "green",
    icon: "git-branch",
    desc: "The big idea behind RL: value today is immediate reward plus the value of tomorrow.",
    question: "Why is Tπ a contraction in the infinity norm?",
    answers: [
      "Because probabilities are always zero.",
      "Because ||TπV − TπW||∞ ≤ γ||V − W||∞ with γ < 1.",
      "Because all rewards are positive.",
    ],
    correct: 1,
    intuition:
      "To evaluate a cell, you do not need to enumerate every possible path. Look at the reward for one step and the values of the cells you might reach next. Repeat this update and information about the goal propagates backward across the map.",
    sections: [
      [
        "Decompose the return",
        "Gₜ = Rₜ₊₁ + γGₜ₊₁. Take the conditional expectation given Sₜ = s and use the Markov property to replace the expected remaining return with Vπ(s′).",
      ],
      [
        "From evaluation to optimization",
        "The Bellman expectation operator evaluates a given policy. The Bellman optimality operator replaces the average over actions with a maximum to find the best action. These are different operators.",
      ],
    ],
    eq: "V^\\pi(s)=\\sum_a\\pi(a|s)\\left[r(s,a)+\\gamma\\sum_{s'}P(s'|s,a)V^\\pi(s')\\right]",
    proofTitle: "Prove the Bellman expectation operator is a contraction",
    assume: "A finite MDP, 0 ≤ γ < 1, and bounded V and W.",
    proof: [
      [
        "The reward cancels when taking the difference",
        "|(T_\\pi V)(s)-(T_\\pi W)(s)|=\\gamma\\left|\\sum_{s'}P_\\pi(s,s')[V(s')-W(s')]\\right|",
      ],
      [
        "Apply the triangle inequality and use that probabilities sum to 1",
        "\\leq\\gamma\\sum_{s'}P_\\pi(s,s')\\|V-W\\|_\\infty=\\gamma\\|V-W\\|_\\infty",
      ],
      [
        "Take the maximum over s",
        "\\|T_\\pi V-T_\\pi W\\|_\\infty\\leq\\gamma\\|V-W\\|_\\infty",
      ],
    ],
    takeaway:
      "The Banach fixed-point theorem guarantees a unique Vπ and convergence of iterative policy evaluation.",
    lab: "bellman",
  },
  {
    id: "dp",
    n: "05",
    title: "Dynamic Programming",
    short: "Dynamic Programming",
    tag: "ALGORITHMS",
    time: 35,
    level: "Medium",
    color: "blue",
    icon: "layers",
    desc: "Implement policy evaluation and value iteration when the environment model is known.",
    question: "What information does value iteration require?",
    answers: [
      "The transition model and expected rewards.",
      "Only the number of episodes.",
      "Only one sampled action.",
    ],
    correct: 0,
    intuition:
      "If you have a map and know the probability of each transition, you can evaluate decisions by computation. Value iteration combines one-step lookahead with choosing the best action in each state.",
    sections: [
      [
        "Synchronous updates",
        "Compute a new V from the entire previous V. Vₖ₊₁(s) = maxₐ[r(s,a) + γΣₛ′P(s′|s,a)Vₖ(s′)]. Use a fresh array so you do not accidentally turn the algorithm into an in-place update.",
      ],
      [
        "Stopping by the residual",
        "If δ = ||TV − V||∞, the error relative to V* is bounded by δ/(1−γ). A small residual therefore means different things at different discount factors.",
      ],
    ],
    eq: "V_{k+1}=TV_k,\\qquad \\|V_k-V^*\\|_\\infty\\leq\\gamma^k\\|V_0-V^*\\|_\\infty",
    proofTitle: "Bound the error using the Bellman residual",
    assume:
      "T is the Bellman optimality operator, a contraction with factor γ < 1; TV* = V*.",
    proof: [
      [
        "Add and subtract TV",
        "\\|V-V^*\\|_\\infty\\leq\\|V-TV\\|_\\infty+\\|TV-TV^*\\|_\\infty",
      ],
      [
        "Apply the contraction property and rearrange",
        "(1-\\gamma)\\|V-V^*\\|_\\infty\\leq\\delta",
      ],
      ["Conclude", "\\|V-V^*\\|_\\infty\\leq\\frac{\\delta}{1-\\gamma}"],
    ],
    takeaway:
      "Value iteration requires a model; the model-free methods that follow use experience instead.",
    lab: "value-iteration",
  },
  {
    id: "td",
    n: "06",
    title: "Learning from Experience",
    short: "Monte Carlo & TD",
    tag: "MODEL-FREE",
    time: 35,
    level: "Medium",
    color: "orange",
    icon: "route",
    desc: "Estimate value from data and understand TD(0) and Q-learning without knowing the transition model.",
    question: "What is the Q-learning target for a terminal transition?",
    answers: [
      "Always r + γ max Q(s′,a′).",
      "Just r, because there is no future return.",
      "Always zero, regardless of the reward.",
    ],
    correct: 1,
    intuition:
      "Without a map, move and observe. Monte Carlo waits until the journey ends and updates from the observed return. TD updates immediately using the latest reward and an estimate for the next step, a technique called bootstrapping.",
    sections: [
      [
        "TD(0) and bias–variance",
        "The TD target is r + γV(s′). It often has lower variance than a full-episode return, but is affected by error in V. MC does not bootstrap and requires the episode to end.",
      ],
      [
        "Q-learning and convergence conditions",
        "Q-learning uses max Q at the next state even if data is collected under a different behavior policy. Tabular convergence requires a finite MDP, bounded rewards, infinitely many visits to every state–action pair, and learning rates satisfying the Robbins–Monro conditions. A constant learning rate does not provide this guarantee.",
      ],
    ],
    eq: "Q(s,a)\\leftarrow Q(s,a)+\\alpha\\left[r+\\gamma(1-d)\\max_{a'}Q(s',a')-Q(s,a)\\right]",
    proofTitle: "The TD target is correct in expectation when V = Vπ",
    assume:
      "Transitions follow policy π, V = Vπ, and terminal states have value zero.",
    proof: [
      [
        "Take the expected TD error given Sₜ = s",
        "\\mathbb E[\\delta_t|S_t=s]=\\mathbb E[R_{t+1}+\\gamma V^\\pi(S_{t+1})|S_t=s]-V^\\pi(s)",
      ],
      [
        "Apply the Bellman expectation equation",
        "=(T_\\pi V^\\pi)(s)-V^\\pi(s)=0",
      ],
    ],
    takeaway:
      "The expected TD error is zero at the correct value function; an individual TD error need not be zero.",
    lab: "q-learning",
  },
  {
    id: "policy",
    n: "07",
    title: "Policy Gradient",
    short: "Policy Gradient",
    tag: "POLICY OPTIMIZATION",
    time: 40,
    level: "Hard",
    color: "green",
    icon: "trending-up",
    desc: "From the log-derivative trick to REINFORCE, baselines, and advantage.",
    question: "Does a baseline b(s) bias the policy gradient?",
    answers: [
      "Yes, every baseline introduces bias.",
      "No, if it is independent of the action and the estimator does not differentiate through it.",
      "No, even if b depends arbitrarily on the action.",
    ],
    correct: 1,
    intuition:
      "Rather than estimating every action value and choosing the maximum, directly increase the probability of actions that produce good returns. REINFORCE turns feedback from a trajectory into a gradient for the policy.",
    sections: [
      [
        "The log-derivative trick",
        "For trajectory distribution pθ(τ), ∇pθ = pθ∇log pθ. If dynamics and rewards do not depend on θ, the gradient of the trajectory log-probability contains only policy log-probability terms.",
      ],
      [
        "Reducing variance with a baseline",
        "Subtracting a state-dependent baseline compares return with what usually happens in that state. A baseline does not change the expected gradient, but a poor choice can still increase variance.",
      ],
      [
        "PPO: limiting an update",
        "REINFORCE can move the policy too far after one batch. PPO uses the ratio ρₜ = πθ(aₜ|sₜ)/πold(aₜ|sₜ) and the objective min(ρₜAₜ, clip(ρₜ, 1−ε, 1+ε)Aₜ). Clipping limits the surrogate incentive at observed samples; it does not guarantee a hard bound on the KL divergence of the entire policy. PPO periodically collects new batches from the current policy.",
      ],
    ],
    eq: "\\nabla_\\theta J=\\mathbb E_\\tau\\left[G(\\tau)\\sum_t\\nabla_\\theta\\log\\pi_\\theta(a_t|s_t)\\right]",
    proofTitle: "Why is an action-independent baseline unbiased?",
    assume:
      "The policy is differentiable with fixed support; b(s) does not depend on the action. Treat b as constant when differentiating the estimator.",
    proof: [
      [
        "Take the expected baseline contribution at state s",
        "\\sum_a\\pi_\\theta(a|s)b(s)\\nabla_\\theta\\log\\pi_\\theta(a|s)=b(s)\\sum_a\\nabla_\\theta\\pi_\\theta(a|s)",
      ],
      [
        "Use that probabilities sum to 1",
        "=b(s)\\nabla_\\theta\\sum_a\\pi_\\theta(a|s)=b(s)\\nabla_\\theta 1=0",
      ],
    ],
    takeaway:
      "REINFORCE does not differentiate through the environment, but often needs many samples to reduce noise.",
    lab: "reinforce",
  },
  {
    id: "reward",
    n: "08",
    title: "Reward Design & Shaping",
    short: "Reward design",
    tag: "REWARD ENGINEERING",
    time: 30,
    level: "Hard",
    color: "blue",
    icon: "gem",
    desc: "Reward specifies an objective. A high score does not necessarily mean the behavior you wanted.",
    question: "What is the form of potential-based shaping?",
    answers: [
      "F(s,a,s′) = Φ(s′) + Φ(s).",
      "F(s,a,s′) = γΦ(s′) − Φ(s).",
      "F(s,a,s′) = max(Φ(s), Φ(s′)).",
    ],
    correct: 1,
    intuition:
      "Rewarding movement can make an agent walk in circles forever. Rewarding progress toward the goal feels more intuitive, but can also change the optimal policy. Potential-based shaping adds an auxiliary signal while preserving policy ordering under specific assumptions.",
    sections: [
      [
        "Reward hacking",
        "If you reward only word count, an agent may generate long but incorrect answers. If you reward only passing public unit tests, it may hard-code them. Evaluate behavior beyond the metric being optimized.",
      ],
      [
        "Potential-based shaping",
        "Add F = γΦ(s′) − Φ(s), using the same discount as the MDP. For an infinite horizon, Φ must be bounded and γ < 1. For a finite episode, set Φ(terminal) = 0 or account for the terminal residual.",
      ],
    ],
    eq: "r'(s,a,s')=r(s,a,s')+\\gamma\\Phi(s')-\\Phi(s)",
    proofTitle: "Prove shaping preserves policy ordering",
    assume:
      "An infinite horizon, γ < 1, and bounded Φ; or a finite episode with Φ(terminal) = 0.",
    proof: [
      [
        "Sum the shaping terms through T",
        "\\sum_{t=0}^{T}\\gamma^t[\\gamma\\Phi(s_{t+1})-\\Phi(s_t)]=-\\Phi(s_0)+\\gamma^{T+1}\\Phi(s_{T+1})",
      ],
      [
        "Let T tend to infinity (or use a zero terminal potential)",
        "G'=G-\\Phi(s_0)",
      ],
      [
        "For the same initial state, the shift does not depend on the policy",
        "V^{'\\pi}(s)=V^\\pi(s)-\\Phi(s)",
      ],
    ],
    takeaway:
      "The theorem preserves policies only under these assumptions; an arbitrary bonus has no such guarantee.",
    lab: "shaping",
  },
  {
    id: "rubric",
    n: "09",
    title: "Rubric-based Reward RL",
    short: "Rubric-based Reward",
    tag: "THE DESTINATION",
    time: 45,
    level: "Hard",
    color: "orange",
    icon: "list-checks",
    desc: "Turn evaluation criteria into structured rewards that can be checked and analyzed.",
    question:
      "Does normalizing positive weights guarantee that a reward reflects the true objective?",
    answers: [
      "Yes, normalization solves all reward hacking.",
      "No; criteria, judge reliability, coverage, and validation data also matter.",
      "Yes, if there are at least three criteria.",
    ],
    correct: 1,
    intuition:
      "Instead of asking only “Is this answer good?”, a rubric separates quality into criteria: a correct result, valid reasoning, and satisfying the request. Scoring becomes more transparent, but an agent can still exploit weaknesses in the criteria or the judge.",
    sections: [
      [
        "From rubric to reward",
        "Define scores cᵢ(x,y) ∈ [0,1] and nonnegative weights wᵢ with a positive total, then compute a weighted mean. A hard gate can set the reward to zero when an essential criterion fails. This is a reward design, not a separate RL algorithm.",
      ],
      [
        "From reward to a policy update",
        "Rubric rewards can be used with REINFORCE, PPO, or another policy optimization algorithm. For language models, an answer is usually a sequence of actions; KL divergence from a reference policy is often used to limit drift. These labs build an aggregator and a finite-action policy optimizer, rather than training an LLM.",
      ],
      [
        "Validate before optimizing",
        "Compare with human graders, measure agreement between judges, try counterexamples, and use a separate evaluation set. An increasing training reward does not by itself prove that overall quality improves.",
      ],
      [
        "The complete training loop",
        "1. Draw prompts from the training set. 2. Sample answers from the policy. 3. Score each criterion with a validated verifier or judge. 4. Normalize weights and apply the hard gate. 5. Estimate advantages and update the policy using REINFORCE, PPO, or an appropriate method. 6. Evaluate on held-out prompts and check for reward hacking. Do not normalize scores using test-set information.",
      ],
      [
        "KL regularization: staying near a reference",
        "For a finite answer set, J = ΣᵢπᵢRᵢ − βΣᵢπᵢlog(πᵢ/qᵢ), β ≥ 0. KL is the expectation of a log-ratio, rather than the log-ratio of a single sample. A sampled log-ratio can be negative even though KL is nonnegative. The reference must assign positive probability wherever the policy has support. The capstone uses an exact expected gradient; LLM RL typically estimates it from samples.",
      ],
    ],
    eq: "R(x,y)=g(x,y)\\frac{\\sum_{i=1}^{m}w_i c_i(x,y)}{\\sum_{i=1}^{m}w_i},\\qquad g\\in\\{0,1\\}",
    proofTitle: "Prove the reward bounds and criterion sensitivity",
    assume:
      "0 ≤ cᵢ ≤ 1; wᵢ ≥ 0; W = Σwᵢ > 0. Hold the gate fixed when comparing scores.",
    proof: [
      [
        "Multiply each score bound by its weight and sum",
        "0\\leq\\sum_i w_i c_i\\leq\\sum_i w_i=W\\implies 0\\leq R\\leq1",
      ],
      [
        "Only criterion j changes by Δ, with the gate fixed",
        "R_{new}-R_{old}=g\\frac{w_j}{W}\\Delta",
      ],
      [
        "If the gate is 1 and Δ ≥ 0, reward does not decrease",
        "\\Delta R=\\frac{w_j}{W}\\Delta\\geq0",
      ],
    ],
    takeaway:
      "Boundedness and monotonicity are mathematical properties of the aggregator, not guarantees that a rubric measures quality correctly.",
    lab: "rubric-policy",
    extraProof: {
      title: "From rubric reward to a KL-regularized gradient",
      assume:
        "π = softmax(z), qᵢ > 0. Rewards R and reference q are fixed with respect to z. Every πᵢ > 0.",
      steps: [
        [
          "The softmax derivative",
          "\\frac{\\partial\\pi_i}{\\partial z_j}=\\pi_i(\\mathbf{1}_{i=j}-\\pi_j)",
        ],
        [
          "The reward term",
          "\\frac{\\partial}{\\partial z_j}\\sum_i\\pi_iR_i=\\pi_j(R_j-\\mathbb E_\\pi[R])",
        ],
        [
          "The KL term: the +1 terms cancel because the derivatives of π sum to zero",
          "\\frac{\\partial}{\\partial z_j}\\mathrm{KL}(\\pi\\|q)=\\pi_j\\left(\\log\\frac{\\pi_j}{q_j}-\\mathrm{KL}(\\pi\\|q)\\right)",
        ],
        [
          "Combine the terms and update logits with gradient ascent",
          "z_j\\leftarrow z_j+\\eta\\pi_j\\left[R_j-\\mathbb E_\\pi[R]-\\beta\\left(\\log\\frac{\\pi_j}{q_j}-\\mathrm{KL}(\\pi\\|q)\\right)\\right]",
        ],
        [
          "Adding the same constant c to every reward leaves the advantage unchanged",
          "(R_j+c)-\\mathbb E_\\pi[R+c]=R_j-\\mathbb E_\\pi[R]",
        ],
      ],
    },
  },
];
export const labs = [
  {
    id: "return",
    number: "001",
    title: "Discounted Return",
    level: "Easy",
    topic: "Foundations",
    minutes: 15,
    hybrid: false,
    fn: "discounted_return",
    args: "rewards, gamma",
    desc: "Compute the discounted sum of rewards for an episode. Write the loop from scratch without an RL library.",
    input:
      "An array of finite numbers, \\(r_1,\\ldots,r_T\\), passed as `rewards`. The discount satisfies \\(\\gamma\\in[0,1]\\). An empty array has return zero.",
    output: "The discounted return \\(G_0\\), as one number.",
    example: "discounted_return([1, 2, 3], 0.5) → 2.75",
    hint: "Work backward using \\(G_t=r_{t+1}+\\gamma G_{t+1}\\), with \\(G_T=0\\). This needs only \\(O(1)\\) extra memory.",
    tests: [
      {
        args: [[1, 2, 3], 0.5],
        expected: 2.75,
      },
      {
        args: [[], 0.9],
        expected: 0,
      },
      {
        args: [[3, -1, 5], 0],
        expected: 3,
      },
      {
        args: [[1, 2, 3], 1],
        expected: 6,
      },
      {
        args: [[-2, 0, 4], 0.9],
        expected: 1.24,
      },
    ],
    solution:
      "def discounted_return(rewards, gamma):\n    value = 0\n    for t in range(len(rewards) - 1, -1, -1):\n        value = rewards[t] + gamma * value\n    return value",
    equation: "G_0=\\sum_{t=0}^{T-1}\\gamma^t r_{t+1}",
    exampleMath: "G_0=1+0.5\\cdot2+0.5^2\\cdot3=2.75",
  },
  {
    id: "expectation",
    number: "002",
    title: "Expected Next Value",
    level: "Easy",
    topic: "Probability · MDP",
    minutes: 15,
    hybrid: false,
    fn: "expected_value",
    args: "probabilities, values",
    desc: "Compute the expected value of the next state from a valid transition row. Do not use a linear algebra library.",
    input:
      "Two arrays of equal length, `probabilities` and `values`. Each \\(p_i\\geq0\\), and \\(\\sum_{i=1}^{n}p_i=1\\).",
    output: "The weighted sum \\(\\sum_{i=1}^{n}p_iV_i\\), as one number.",
    example: "expected_value([0.25, 0.75], [4, 8]) → 7",
    hint: "Traverse both arrays together. Accumulate the products \\(p_iV_i\\) to compute the expectation.",
    tests: [
      {
        args: [
          [0.25, 0.75],
          [4, 8],
        ],
        expected: 7,
      },
      {
        args: [
          [1, 0],
          [5, 99],
        ],
        expected: 5,
      },
      {
        args: [
          [0.5, 0.5],
          [-2, 2],
        ],
        expected: 0,
      },
      {
        args: [
          [0.2, 0.3, 0.5],
          [1, 3, 5],
        ],
        expected: 3.6,
      },
    ],
    solution:
      "def expected_value(probabilities, values):\n    result = 0\n    for i in range(len(probabilities)):\n        result += probabilities[i] * values[i]\n    return result",
    equation: "\\mathbb E[V(S')]=\\sum_{i=1}^{n}p_i V_i",
    exampleMath: "\\mathbb E[V(S')]=0.25\\cdot4+0.75\\cdot8=7",
  },
  {
    id: "bellman",
    number: "003",
    title: "Bellman Backup",
    level: "Medium",
    topic: "Bellman",
    minutes: 25,
    hybrid: true,
    fn: "bellman_backup",
    args: "reward, probabilities, values, gamma",
    desc: "Implement a Bellman backup for one action and prove that the policy evaluation operator is a contraction.",
    input:
      "`reward` is \\(r(s,a)\\); `probabilities` is the transition distribution \\(P(\\cdot\\mid s,a)\\); `values` contains the current \\(V\\). The discount satisfies \\(0\\leq\\gamma<1\\).",
    output:
      "One backup value: \\(r(s,a)+\\gamma\\sum_{s'}P(s'\\mid s,a)V(s')\\).",
    example: "bellman_backup(1, [0.5, 0.5], [2, 4], 0.9) → 3.7",
    hint: "First compute \\(\\mathbb E[V(S')\\mid s,a]\\), then multiply by \\(\\gamma\\) exactly once and add \\(r(s,a)\\).",
    tests: [
      {
        args: [1, [0.5, 0.5], [2, 4], 0.9],
        expected: 3.7,
      },
      {
        args: [-1, [1], [10], 0.5],
        expected: 4,
      },
      {
        args: [7, [0.3, 0.7], [99, -4], 0],
        expected: 7,
      },
      {
        args: [0, [0.25, 0.75], [-8, 4], 0.8],
        expected: 0.8,
      },
    ],
    proof:
      "For a finite MDP with \\(0\\leq\\gamma<1\\), prove the contraction inequality:\\[\\lVert T_\\pi V-T_\\pi W\\rVert_\\infty\\leq\\gamma\\lVert V-W\\rVert_\\infty.\\]",
    checks: [
      "I showed that the reward terms cancel in \\(T_\\pi V-T_\\pi W\\).",
      "I used the triangle inequality and \\(\\sum_{s'}P_\\pi(s,s')=1\\).",
      "I took the maximum over states and explained why \\(\\gamma<1\\) is necessary.",
    ],
    lesson: "bellman",
    solution:
      "def bellman_backup(reward, probabilities, values, gamma):\n    expected = 0\n    for i in range(len(probabilities)):\n        expected += probabilities[i] * values[i]\n    return reward + gamma * expected",
    equation: "Q_V(s,a)=r(s,a)+\\gamma\\sum_{s'}P(s'\\mid s,a)V(s')",
    exampleMath: "Q_V=1+0.9\\left(0.5\\cdot2+0.5\\cdot4\\right)=3.7",
  },
  {
    id: "value-iteration",
    number: "004",
    title: "Value Iteration from Scratch",
    level: "Medium",
    topic: "Dynamic Programming",
    minutes: 40,
    hybrid: true,
    fn: "value_iteration",
    args: "model, gamma, iterations",
    desc: "Perform exactly the requested number of synchronous value iteration sweeps. `model[s][a]` is a list of transitions `{'p': ..., 'next': ..., 'reward': ..., 'done': ...}`. Initialize \\(V_0(s)=0\\). A state with no actions has value zero.",
    input:
      "A finite MDP. Every `next` is a valid index; for each action, \\(\\sum_{s'}P(s'\\mid s,a)=1\\). The argument `iterations` is a nonnegative integer.",
    output:
      "The array \\(V_k\\) after exactly `iterations` updates. When `done=True`, \\(d=1\\) and the continuation term is zero.",
    example:
      "value_iteration([[[{'p': 1, 'next': 1, 'reward': 2, 'done': True}]], []], 0.9, 2) → [2, 0]",
    hint: "Create a fresh array each sweep. For each action, accumulate \\(p\\,[r+\\gamma(1-d)V_k(s')]\\), then take the maximum across actions.",
    tests: [
      {
        args: [
          [
            [
              [
                {
                  p: 1,
                  next: 1,
                  reward: 2,
                  done: true,
                },
              ],
            ],
            [],
          ],
          0.9,
          2,
        ],
        expected: [2, 0],
      },
      {
        args: [
          [
            [
              [
                {
                  p: 1,
                  next: 0,
                  reward: 1,
                  done: false,
                },
              ],
            ],
          ],
          0.5,
          3,
        ],
        expected: [1.75],
      },
      {
        args: [
          [
            [
              [
                {
                  p: 1,
                  next: 1,
                  reward: 0,
                  done: false,
                },
              ],
            ],
            [
              [
                {
                  p: 1,
                  next: 1,
                  reward: 4,
                  done: true,
                },
              ],
            ],
          ],
          0.5,
          1,
        ],
        expected: [0, 4],
      },
      {
        args: [
          [
            [
              [
                {
                  p: 1,
                  next: 0,
                  reward: -2,
                  done: true,
                },
              ],
              [
                {
                  p: 1,
                  next: 0,
                  reward: -1,
                  done: true,
                },
              ],
            ],
          ],
          0.9,
          1,
        ],
        expected: [-1],
      },
      {
        args: [
          [
            [
              [
                {
                  p: 1,
                  next: 0,
                  reward: 1,
                  done: false,
                },
              ],
            ],
          ],
          0.9,
          0,
        ],
        expected: [0],
      },
    ],
    proof:
      "Let \\(T\\) be the Bellman optimality operator, \\(TV^*=V^*\\), and \\(0\\leq\\gamma<1\\). Define the residual \\(\\delta=\\lVert TV-V\\rVert_\\infty\\). Prove:\\[\\lVert V-V^*\\rVert_\\infty\\leq\\frac{\\delta}{1-\\gamma}.\\]",
    checks: [
      "I added and subtracted \\(TV\\) in \\(V-V^*\\).",
      "I used the triangle inequality and \\(\\lVert TV-TV^*\\rVert_\\infty\\leq\\gamma\\lVert V-V^*\\rVert_\\infty\\).",
      "I rearranged the inequality using \\(1-\\gamma>0\\).",
    ],
    lesson: "dp",
    solution:
      "def value_iteration(model, gamma, iterations):\n    values = [0.0 for _ in model]\n    for _ in range(iterations):\n        updated = []\n        for actions in model:\n            if not actions:\n                updated.append(0.0)\n                continue\n            best = float('-inf')\n            for transitions in actions:\n                q = 0.0\n                for tr in transitions:\n                    continuation = 0 if tr['done'] else values[tr['next']]\n                    q += tr['p'] * (tr['reward'] + gamma * continuation)\n                best = max(best, q)\n            updated.append(best)\n        values = updated\n    return values",
    equation:
      "V_{k+1}(s)=\\max_a\\sum_{s'}P(s'\\mid s,a)\\bigl[r(s,a,s')+\\gamma(1-d)V_k(s')\\bigr]",
  },
  {
    id: "q-learning",
    number: "005",
    title: "One Q-learning Step",
    level: "Medium",
    topic: "Temporal Difference",
    minutes: 25,
    hybrid: false,
    fn: "q_update",
    args: "current_q, reward, next_q, alpha, gamma, done",
    desc: "Compute the updated Q-value for one transition. Apply terminal masking: there is no bootstrap term after the episode ends.",
    input:
      "`next_q` contains the action values \\(Q(s',a')\\). It is nonempty when `done=False`. Learning rate and discount satisfy \\(\\alpha,\\gamma\\in[0,1]\\).",
    output:
      "The updated scalar \\(Q_{\\mathrm{new}}(s,a)\\), without modifying `next_q`.",
    example: "q_update(2, 1, [3, 4], 0.5, 0.9, False) → 3.3",
    hint: "Build the target \\(y\\), masking future value at terminal transitions. Then compute \\(Q_{\\mathrm{new}}=Q+\\alpha(y-Q)\\).",
    tests: [
      {
        args: [2, 1, [3, 4], 0.5, 0.9, false],
        expected: 3.3,
      },
      {
        args: [5, -1, [99], 1, 0.9, true],
        expected: -1,
      },
      {
        args: [2, 10, [3], 0, 0.9, false],
        expected: 2,
      },
      {
        args: [0, -1, [-4, -2], 1, 0.5, false],
        expected: -2,
      },
      {
        args: [3, 7, [], 0.5, 0.9, true],
        expected: 5,
      },
    ],
    solution:
      "def q_update(current_q, reward, next_q, alpha, gamma, done):\n    target = reward if done else reward + gamma * max(next_q)\n    return current_q + alpha * (target - current_q)",
    equation:
      "\\begin{aligned}y&=\\begin{cases}r,&\\text{if terminal},\\\\r+\\gamma\\max_{a'}Q(s',a'),&\\text{otherwise},\\end{cases}\\\\Q_{\\mathrm{new}}(s,a)&=Q(s,a)+\\alpha\\bigl[y-Q(s,a)\\bigr].\\end{aligned}",
    exampleMath:
      "Q_{\\mathrm{new}}=2+0.5\\left[1+0.9\\cdot\\max(3,4)-2\\right]=3.3",
  },
  {
    id: "reinforce",
    number: "006",
    title: "REINFORCE & Baseline",
    level: "Hard",
    topic: "Policy Gradient",
    minutes: 45,
    hybrid: true,
    fn: "reinforce_gradient",
    args: "probabilities, action, reward, baseline",
    desc: "For a categorical policy \\(\\pi=\\operatorname{softmax}(z)\\), compute the sampled gradient estimator with respect to every logit for one selected action. Implement it with a loop.",
    input:
      "`probabilities` is the valid probability vector \\(\\pi\\); `action` is the selected index \\(a\\). Reward \\(R\\) and baseline \\(b\\) are finite.",
    output:
      "The gradient ascent vector \\(\\widehat g=\\nabla_z\\log\\pi(a)\\,(R-b)\\), not the gradient descent direction of a loss.",
    example: "reinforce_gradient([0.2, 0.8], 0, 3, 1) → [1.6, -1.6]",
    hint: "The log-softmax derivative is \\(\\frac{\\partial\\log\\pi(a)}{\\partial z_j}=\\mathbf1_{\\{j=a\\}}-\\pi_j\\). Multiply each component by the advantage \\(R-b\\).",
    tests: [
      {
        args: [[0.2, 0.8], 0, 3, 1],
        expected: [1.6, -1.6],
      },
      {
        args: [[0.5, 0.5], 1, 2, 2],
        expected: [0, 0],
      },
      {
        args: [[0.1, 0.3, 0.6], 2, -1, 0],
        expected: [0.1, 0.3, -0.4],
      },
      {
        args: [[1], 0, 5, 0],
        expected: [0],
      },
    ],
    proof:
      "Prove that an action-independent baseline \\(b(s)\\) leaves the expected policy gradient unchanged:\\[\\mathbb E_{a\\sim\\pi_\\theta(\\cdot\\mid s)}\\!\\left[b(s)\\nabla_\\theta\\log\\pi_\\theta(a\\mid s)\\right]=0.\\] State the assumptions on support and differentiation.",
    checks: [
      "I expanded the expectation as a sum over actions.",
      "I used \\(\\pi_\\theta\\nabla_\\theta\\log\\pi_\\theta=\\nabla_\\theta\\pi_\\theta\\) and \\(\\nabla_\\theta\\sum_a\\pi_\\theta(a\\mid s)=0\\).",
      "I stated that \\(b(s)\\) is action-independent and is not differentiated through in the estimator.",
    ],
    lesson: "policy",
    solution:
      "def reinforce_gradient(probabilities, action, reward, baseline):\n    advantage = reward - baseline\n    gradient = []\n    for j in range(len(probabilities)):\n        gradient.append(advantage * ((1 if j == action else 0) - probabilities[j]))\n    return gradient",
    equation: "\\widehat g_j=(R-b)\\left(\\mathbf 1_{\\{j=a\\}}-\\pi_j\\right)",
    exampleMath: "\\widehat g=(3-1)\\bigl([1,0]-[0.2,0.8]\\bigr)=[1.6,-1.6]",
  },
  {
    id: "shaping",
    number: "007",
    title: "Potential-based Shaping",
    level: "Hard",
    topic: "Reward Design",
    minutes: 35,
    hybrid: true,
    fn: "shaped_reward",
    args: "reward, potential, next_potential, gamma, done",
    desc: "Add potential-based shaping to a reward. In this episodic MDP, \\(\\Phi(s_{\\mathrm{terminal}})=0\\), regardless of the supplied `next_potential`.",
    input:
      "`reward`, `potential`, and `next_potential` are finite. The discount satisfies \\(0\\leq\\gamma<1\\); `done` is a boolean, represented by \\(d\\in\\{0,1\\}\\).",
    output:
      "The shaped reward \\(r'\\), with zero next-state potential when \\(d=1\\).",
    example: "shaped_reward(1, 2, 4, 0.9, False) → 2.6",
    hint: "Remember the terminal potential. Expand \\(\\sum_t\\gamma^t[\\gamma\\Phi(s_{t+1})-\\Phi(s_t)]\\) and identify the telescoping cancellations.",
    tests: [
      {
        args: [1, 2, 4, 0.9, false],
        expected: 2.6,
      },
      {
        args: [10, 3, 99, 0.9, true],
        expected: 7,
      },
      {
        args: [0, -2, -1, 0.5, false],
        expected: 1.5,
      },
      {
        args: [2, 5, 10, 0, false],
        expected: -3,
      },
    ],
    proof:
      "Prove:\\[G'=G-\\Phi(s_0).\\] Use a discounted infinite horizon with bounded \\(\\Phi\\) and \\(\\gamma<1\\), or a finite episode with \\(\\Phi(s_{\\mathrm{terminal}})=0\\).",
    checks: [
      "I expanded the shaping sum and canceled consecutive potential terms.",
      "I retained the boundary term \\(\\gamma^{T+1}\\Phi(s_{T+1})\\) before taking the limit.",
      "I explained when the boundary term vanishes and why adding \\(-\\Phi(s_0)\\) preserves policy ordering.",
    ],
    lesson: "reward",
    solution:
      "def shaped_reward(reward, potential, next_potential, gamma, done):\n    return reward + gamma * (0 if done else next_potential) - potential",
    equation: "r'=r+\\gamma(1-d)\\Phi(s')-\\Phi(s)",
    exampleMath: "r'=1+0.9\\cdot4-2=2.6",
  },
  {
    id: "rubric",
    number: "008",
    title: "Build a Rubric Reward",
    level: "Hard",
    topic: "Rubric-based RL",
    minutes: 50,
    hybrid: true,
    fn: "rubric_reward",
    args: "scores, weights, gate",
    desc: "Build a rubric aggregator. Each score satisfies \\(c_i\\in[0,1]\\); weights satisfy \\(w_i\\geq0\\) and have a positive sum. Invalid input must raise `ValueError`. When `gate=False`, return zero but still validate the input.",
    input:
      "`scores` and `weights` are nonempty arrays of finite numbers with equal length; `gate` is a boolean. Require \\(W=\\sum_{i=1}^{m}w_i>0\\).",
    output:
      "The scalar rubric reward \\(R\\). Raise `ValueError` for invalid input.",
    example: "rubric_reward([1, 0.5, 0.8], [0.5, 0.3, 0.2], True) → 0.81",
    hint: "Validate every element before computing. Require \\(0\\leq c_i\\leq1\\), \\(w_i\\geq0\\), and \\(W>0\\), even when the gate fails.",
    tests: [
      {
        args: [[1, 0.5, 0.8], [0.5, 0.3, 0.2], true],
        expected: 0.81,
      },
      {
        args: [[1, 1], [1, 1], false],
        expected: 0,
      },
      {
        args: [[0, 1], [1, 3], true],
        expected: 0.75,
      },
      {
        args: [[0.5], [0], true],
        throws: true,
      },
      {
        args: [[1.2], [1], false],
        throws: true,
      },
      {
        args: [[1], [1, 2], true],
        throws: true,
      },
      {
        args: [[0.5], [-1], true],
        throws: true,
      },
      {
        args: [[], [], true],
        throws: true,
      },
    ],
    proof:
      "Prove \\(0\\leq R\\leq1\\) and monotonicity in each score with the gate fixed. In particular, show:\\[\\Delta R=g\\frac{w_j}{W}\\,\\Delta c_j.\\] Explain why these properties do not eliminate reward hacking.",
    checks: [
      "I used \\(w_i\\geq0\\), \\(0\\leq c_i\\leq1\\), and \\(W>0\\) to bound \\(R\\).",
      "I proved \\(\\Delta R=g(w_j/W)\\Delta c_j\\) with the gate fixed.",
      "I gave a counterexample where the rubric rewards poor behavior highly.",
    ],
    lesson: "rubric",
    solution:
      "def rubric_reward(scores, weights, gate):\n    import math\n\n    if (not isinstance(scores, list) or not isinstance(weights, list)\n            or not scores or len(scores) != len(weights) or type(gate) is not bool):\n        raise ValueError('Invalid input')\n    total = 0.0\n    weighted = 0.0\n    for score, weight in zip(scores, weights):\n        if (type(score) not in (int, float) or not math.isfinite(score)\n                or score < 0 or score > 1 or type(weight) not in (int, float)\n                or not math.isfinite(weight) or weight < 0):\n            raise ValueError('Invalid criterion')\n        weighted += weight * score\n        total += weight\n    if total <= 0:\n        raise ValueError('Zero weights')\n    return weighted / total if gate else 0.0",
    equation:
      "R=g\\,\\frac{\\sum_{i=1}^{m}w_i c_i}{\\sum_{i=1}^{m}w_i},\\qquad g\\in\\{0,1\\}",
    exampleMath:
      "R=\\frac{0.5\\cdot1+0.3\\cdot0.5+0.2\\cdot0.8}{0.5+0.3+0.2}=0.81",
  },
  {
    id: "rubric-policy",
    number: "009",
    title: "Rubric → Policy Optimization",
    level: "Hard",
    topic: "Capstone · KL regularization",
    minutes: 60,
    hybrid: true,
    fn: "rubric_policy_step",
    args: "logits, rewards, reference, beta, learning_rate",
    desc: "Capstone: a contextual bandit with a finite set of answers. `rewards` contains the rubric scores \\(R_i\\) from lab 008. Implement stable softmax and one exact gradient ascent step for the KL-regularized objective below. This is a small simulation, not LLM training.",
    input:
      "`logits`, `rewards`, and `reference` are nonempty arrays of equal length. Logits \\(z_i\\) and rewards \\(R_i\\) are finite. Require \\(q_i>0\\), \\(\\sum_iq_i=1\\), \\(\\beta\\geq0\\), and learning rate \\(\\eta\\geq0\\). Assume valid input without numerical underflow. Hold rewards and reference fixed when differentiating.",
    output:
      "The probability vector \\(\\operatorname{softmax}(z+\\eta\\nabla_zJ)\\) after exactly one logit update. Differentiate with respect to logits, not directly with respect to probabilities.",
    example:
      "rubric_policy_step([0, 0], [1, 0], [0.5, 0.5], 0, 1) → [0.62245933, 0.37754067]",
    hint: "Use max-subtracted softmax. Compute \\(\\bar R=\\sum_i\\pi_iR_i\\) and \\(D=\\sum_i\\pi_i\\log(\\pi_i/q_i)\\), then update all logits synchronously using:\\[\\frac{\\partial J}{\\partial z_j}=\\pi_j\\left[R_j-\\bar R-\\beta\\left(\\log\\frac{\\pi_j}{q_j}-D\\right)\\right].\\]",
    tests: [
      {
        args: [[0, 0], [1, 0], [0.5, 0.5], 0, 1],
        expected: [0.6224593312018546, 0.3775406687981454],
      },
      {
        args: [[1000, 1000], [1, 0], [0.5, 0.5], 0, 1],
        expected: [0.6224593312018546, 0.3775406687981454],
      },
      {
        args: [[0, 0], [1, 1], [0.5, 0.5], 0.2, 1],
        expected: [0.5, 0.5],
      },
      {
        args: [[0, 0], [0, 0], [0.8, 0.2], 1, 1],
        expected: [0.6666666666666666, 0.3333333333333333],
      },
      {
        args: [[0, 0], [1, 0], [0.5, 0.5], 1, 0],
        expected: [0.5, 0.5],
      },
      {
        args: [[3], [0.81], [1], 0.1, 1],
        expected: [1],
      },
    ],
    proof:
      "Starting from the softmax derivative\\[\\frac{\\partial\\pi_i}{\\partial z_j}=\\pi_i\\left(\\mathbf1_{\\{i=j\\}}-\\pi_j\\right),\\] derive the gradient of \\(J\\) with respect to \\(z_j\\). Explain why adding the same constant to all rewards does not change the update.",
    checks: [
      "I applied the softmax derivative while holding \\(R\\) and \\(q\\) fixed.",
      "I derived the reward term \\(\\pi_j(R_j-\\mathbb E_\\pi[R])\\) and the KL term \\(\\pi_j[\\log(\\pi_j/q_j)-D_{\\mathrm{KL}}(\\pi\\|q)]\\).",
      "I proved invariance to an additive reward constant and distinguished a finite bandit from LLM sequence training.",
    ],
    lesson: "rubric",
    solution:
      "def rubric_policy_step(logits, rewards, reference, beta, learning_rate):\n    import math\n\n    def softmax(values):\n        largest = max(values)\n        exps = [math.exp(value - largest) for value in values]\n        total = sum(exps)\n        return [value / total for value in exps]\n\n    probabilities = softmax(logits)\n    mean_reward = 0.0\n    kl = 0.0\n    for i in range(len(probabilities)):\n        mean_reward += probabilities[i] * rewards[i]\n        kl += probabilities[i] * math.log(probabilities[i] / reference[i])\n    updated = []\n    for j, logit in enumerate(logits):\n        gradient = probabilities[j] * (\n            rewards[j] - mean_reward\n            - beta * (math.log(probabilities[j] / reference[j]) - kl)\n        )\n        updated.append(logit + learning_rate * gradient)\n    return softmax(updated)",
    equation:
      "\\begin{aligned}J(z)&=\\sum_i\\pi_iR_i-\\beta\\sum_i\\pi_i\\log\\frac{\\pi_i}{q_i},\\\\\\pi_i&=\\frac{e^{z_i}}{\\sum_j e^{z_j}}.\\end{aligned}",
  },
];
enrichCoreLabs(labs, lessons);
labs.push(...atlasLabs);
export const starter = (lab) =>
  `def ${lab.fn}(${lab.args}):\n    """${lab.title}. Implement from scratch; no RL libraries."""\n    # Write your solution here\n    pass\n`;
