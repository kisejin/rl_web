// Original RL Atlas explanations and derivations. Bibliography: atlas-sources.js.
export const atlasTopics = [
  {
    id: "expectation",
    title: "Probability, expectation and conditional reasoning",
    stage: "Foundations",
    summary:
      "An RL value is an expectation over possible futures, not the return of a single lucky episode. Conditioning specifies exactly what is already known.",
    symbols: [
      ["X", "random outcome"],
      ["p(x)", "probability mass"],
      ["E[X|S]", "expectation after observing S"],
    ],
    assumptions: [
      "Discrete distributions for the displayed sums; integrable random variables. The variance identity additionally requires a finite second moment. Continuous cases replace sums with integrals.",
    ],
    equations: [
      {
        name: "Expected value",
        tex: "\\mathbb E[X]=\\sum_xp(x)x",
        explain:
          "Weight each outcome by probability; probabilities sum to one.",
      },
      {
        name: "Variance",
        tex: "\\operatorname{Var}(X)=\\mathbb E[X^2]-\\mathbb E[X]^2",
        explain:
          "Variance measures variability around the mean, in squared units.",
      },
      {
        name: "Conditional probability",
        tex: "p(x\\mid s)=\\frac{p(x,s)}{p(s)},\\quad p(s)>0",
        explain:
          "Conditioning renormalizes the events compatible with the observation.",
      },
      {
        name: "Tower property",
        tex: "\\mathbb E[X]=\\mathbb E_S[\\mathbb E[X\\mid S]]",
        explain:
          "This is the step that turns trajectory returns into Bellman equations.",
      },
    ],
    derivation: {
      claim: "Derive the tower property for a discrete state variable.",
      steps: [
        {
          text: "Expand the outer expectation over states.",
          tex: "\\mathbb E_S[\\mathbb E[X\\mid S]]=\\sum_s p(s)\\sum_x x p(x\\mid s)",
        },
        {
          text: "Use the definition of a conditional probability.",
          tex: "=\\sum_{s,x}x p(x,s)",
        },
        {
          text: "Marginalize the state.",
          tex: "=\\sum_xx\\sum_sp(x,s)=\\mathbb E[X]",
        },
      ],
    },
    example:
      "For X in {−1, 3} with P(X=3)=0.25, E[X]=0 and Var(X)=3. A zero mean does not mean every outcome is zero.",
    pitfall:
      "Zero conditional probabilities must not be divided by. Independence is stronger than zero correlation.",
    check: {
      question:
        "If rewards are −1 and 3 with equal probabilities, what is their expectation?",
      options: ["0", "1", "2"],
      correct: 1,
      explanation: "The weighted sum is −0.5 + 1.5 = 1.",
    },
    sources: ["spin-intro", "hf"],
    scene: "expectation",
    prerequisites: [],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "returns",
    title: "Discounted returns and effective horizons",
    stage: "Foundations",
    summary:
      "Discounting determines how rewards at different times enter the objective. Infinite-horizon boundedness is a mathematical assumption, not just a training trick.",
    symbols: [
      ["G_t", "return from time t"],
      ["r_t", "reward after action a_t"],
      ["gamma", "discount factor"],
      ["T", "task horizon"],
    ],
    assumptions: [
      "For infinite horizons, |r_t| ≤ R_max and 0 ≤ gamma < 1. Finite episodic tasks can use gamma = 1 if the return remains integrable.",
    ],
    equations: [
      {
        name: "Return",
        tex: "G_t=\\sum_{k=0}^{T-t-1}\\gamma^k r_{t+k}",
        explain:
          "The first reward has weight one. The convention here uses r_t for the reward after action a_t.",
      },
      {
        name: "Return recursion",
        tex: "G_t=r_t+\\gamma G_{t+1}",
        explain: "Split off the first summand.",
      },
      {
        name: "Infinite-horizon bound",
        tex: "|G_t|\\leq\\frac{R_{\\max}}{1-\\gamma}",
        explain:
          "Bound the geometric series, not an individual observed episode.",
      },
      {
        name: "Reward-tail bound",
        tex: "\\sum_{k=H}^{\\infty}\\gamma^k|r_{t+k}|\\leq\\frac{\\gamma^H R_{\\max}}{1-\\gamma}",
        explain: "This quantifies the error from ignoring the distant tail.",
      },
    ],
    derivation: {
      claim: "Prove the return bound and explain the failure at gamma = 1.",
      steps: [
        {
          text: "Apply the triangle inequality.",
          tex: "|G_t|\\leq\\sum_{k\\geq0}\\gamma^k|r_{t+k}|",
        },
        {
          text: "Use bounded rewards.",
          tex: "\\leq R_{\\max}\\sum_{k\\geq0}\\gamma^k",
        },
        {
          text: "Sum the convergent series.",
          tex: "=R_{\\max}/(1-\\gamma)",
        },
      ],
    },
    example:
      "With rewards [1, −1, 2, 4] and gamma = 0.5, G_0 = 1 − 0.5 + 0.5 + 0.5 = 1.5. A later reward can matter less than a smaller immediate one.",
    pitfall:
      "Gamma = 1 does not make every RL problem invalid; it removes this particular infinite-horizon bound.",
    check: {
      question:
        "Why does the displayed infinite-horizon bound require gamma < 1?",
      options: [
        "Because probabilities must be discounted",
        "Because the geometric series must converge",
        "Because all rewards must be positive",
      ],
      correct: 1,
      explanation:
        "The absolute geometric tail is summable only for gamma below one.",
    },
    sources: ["spin-intro", "hf"],
    scene: "returns",
    prerequisites: ["expectation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "mdp",
    title: "Markov decision processes and value functions",
    stage: "Foundations",
    summary:
      "An MDP separates what the agent controls (its policy) from what the environment controls (transitions and rewards). The Markov assumption must hold for the chosen state.",
    symbols: [
      ["P(s′|s,a)", "transition probability"],
      ["r(s,a)", "expected immediate reward"],
      ["pi(a|s)", "policy"],
      ["V,Q,A", "state value, action value, advantage"],
    ],
    assumptions: [
      "Stationary Markov dynamics and a fixed policy; bounded discounted rewards for the infinite-horizon equations.",
    ],
    equations: [
      {
        name: "Trajectory probability",
        tex: "p_\\pi(\\tau)=p_0(s_0)\\prod_{t=0}^{T-1}\\pi(a_t\\mid s_t)P(s_{t+1}\\mid s_t,a_t)",
        explain:
          "Include a conditional reward distribution too when rewards are explicitly stochastic.",
      },
      {
        name: "Values",
        tex: "V^\\pi(s)=\\mathbb E_\\pi[G_t\\mid s_t=s],\\quad Q^\\pi(s,a)=\\mathbb E_\\pi[G_t\\mid s_t=s,a_t=a]",
        explain: "V averages over the current action; Q conditions on it.",
      },
      {
        name: "Policy averaging",
        tex: "V^\\pi(s)=\\sum_a\\pi(a\\mid s)Q^\\pi(s,a)",
        explain: "This is an application of the tower property.",
      },
      {
        name: "Advantage",
        tex: "A^\\pi(s,a)=Q^\\pi(s,a)-V^\\pi(s),\\quad \\mathbb E_{a\\sim\\pi}[A^\\pi(s,a)]=0",
        explain:
          "Advantage measures improvement relative to the policy’s own action mixture.",
      },
    ],
    derivation: {
      claim: "Show that a policy’s expected advantage at a state is zero.",
      steps: [
        {
          text: "Substitute the definition.",
          tex: "\\sum_a\\pi(a\\mid s)A^\\pi(s,a)=\\sum_a\\pi(a\\mid s)[Q^\\pi(s,a)-V^\\pi(s)]",
        },
        {
          text: "Factor the action-independent term.",
          tex: "=V^\\pi(s)-V^\\pi(s)\\sum_a\\pi(a\\mid s)",
        },
        {
          text: "Use normalization.",
          tex: "=0",
        },
      ],
    },
    example:
      "If the next reward is 10 with probability p and 2 otherwise, its expected immediate contribution is 2 + 8p. The policy does not directly choose the sampled transition.",
    pitfall:
      "An observation is not automatically a Markov state. Hidden velocity or task time may need to be included.",
    check: {
      question: "Which object is selected by the agent?",
      options: [
        "The transition kernel P",
        "The policy pi",
        "The sampled next state",
      ],
      correct: 1,
      explanation:
        "The policy chooses an action distribution, not the environment outcome.",
    },
    sources: ["spin-intro", "neat"],
    scene: "mdp",
    prerequisites: ["returns"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "bellman",
    title: "Bellman operators, contraction and fixed points",
    stage: "Foundations",
    summary:
      "Bellman equations express self-consistency. A contraction makes repeated backups converge to a unique fixed point in the finite discounted setting.",
    symbols: [
      ["T_pi", "policy evaluation operator"],
      ["P_pi", "policy transition matrix"],
      ["r_pi", "policy reward vector"],
      ["norm_inf", "largest absolute component"],
    ],
    assumptions: [
      "Finite MDP, bounded rewards, 0 ≤ gamma < 1. The matrix P_pi is row-stochastic.",
    ],
    equations: [
      {
        name: "Policy Bellman equation",
        tex: "V^\\pi=r_\\pi+\\gamma P_\\pi V^\\pi",
        explain:
          "The expectation over the next state becomes matrix multiplication.",
      },
      {
        name: "Closed form",
        tex: "V^\\pi=(I-\\gamma P_\\pi)^{-1}r_\\pi",
        explain: "The inverse exists because the Neumann series converges.",
      },
      {
        name: "Optimality backup",
        tex: "(TV)(s)=\\max_a\\{r(s,a)+\\gamma\\sum_{s'}P(s'\\mid s,a)V(s')\\}",
        explain:
          "This operator optimizes the current action, then uses V for continuation.",
      },
      {
        name: "Contraction",
        tex: "\\|TV-TW\\|_\\infty\\leq\\gamma\\|V-W\\|_\\infty",
        explain: "The policy operator satisfies the same bound.",
      },
    ],
    derivation: {
      claim: "Prove contraction for the optimality operator.",
      steps: [
        {
          text: "Use the max-difference inequality.",
          tex: "|\\max_a f_a-\\max_a g_a|\\leq\\max_a|f_a-g_a|",
        },
        {
          text: "Cancel equal rewards and bound each expectation.",
          tex: "|(TV)(s)-(TW)(s)|\\leq\\gamma\\max_a\\sum_{s'}P(s'\\mid s,a)|V(s')-W(s')|",
        },
        {
          text: "Use normalized probabilities and maximize over states.",
          tex: "\\leq\\gamma\\|V-W\\|_\\infty",
        },
      ],
    },
    example:
      "In the one-state MDP with reward 1, V_{k+1}=1+gamma V_k and V*=1/(1−gamma). Two initial estimates get closer by a factor gamma per backup.",
    pitfall:
      "This finite-tabular contraction does not prove that a neural-network DQN training loop converges.",
    check: {
      question:
        "If gamma = 0.8 and two value tables differ by at most 5, how far apart can their backups be?",
      options: ["At most 4", "Exactly 5", "At least 6.25"],
      correct: 0,
      explanation: "The contraction upper bound is 0.8 × 5 = 4.",
    },
    sources: ["spin-intro", "neat"],
    scene: "bellman",
    prerequisites: ["mdp"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "dynamic-programming",
    title: "Policy evaluation, policy iteration and value iteration",
    stage: "Foundations",
    summary:
      "Dynamic programming assumes a model of the environment. Evaluation estimates a policy’s value; improvement changes the action choice using that value.",
    symbols: [
      ["V_k", "value after k synchronous sweeps"],
      ["pi_new", "policy greedy with respect to the evaluated Q"],
    ],
    assumptions: [
      "Finite discounted MDP with known transition probabilities and expected rewards; exact evaluation for the improvement proof.",
    ],
    equations: [
      {
        name: "Iterative evaluation",
        tex: "V_{k+1}=T_\\pi V_k",
        explain: "Synchronous evaluation reads the old table for every state.",
      },
      {
        name: "Greedy improvement",
        tex: "\\pi_{\\rm new}(s)\\in\\arg\\max_a Q^\\pi(s,a)",
        explain: "Any consistent tie-breaking choice is acceptable.",
      },
      {
        name: "Policy improvement guarantee",
        tex: "V^{\\pi_{\\rm new}}(s)\\geq V^\\pi(s)",
        explain: "The guarantee uses exact values in this setting.",
      },
      {
        name: "Value iteration error",
        tex: "\\|V_k-V^*\\|_\\infty\\leq\\gamma^k\\|V_0-V^*\\|_\\infty",
        explain: "Repeated optimality backups contract the initial error.",
      },
    ],
    derivation: {
      claim:
        "Derive policy improvement from monotonicity and the Bellman fixed point.",
      steps: [
        {
          text: "Greedy selection cannot lower the one-step backup.",
          tex: "T_{\\pi_{\\rm new}}V^\\pi\\geq T_\\pi V^\\pi=V^\\pi",
        },
        {
          text: "Apply the new policy operator repeatedly using monotonicity.",
          tex: "(T_{\\pi_{\\rm new}})^k V^\\pi\\geq V^\\pi",
        },
        {
          text: "Take the contraction limit.",
          tex: "V^{\\pi_{\\rm new}}=\\lim_{k\\to\\infty}(T_{\\pi_{\\rm new}})^kV^\\pi\\geq V^\\pi",
        },
      ],
    },
    example:
      "A chain with four actions before a terminal reward of 10 requires four synchronous sweeps for that information to reach the first state. At gamma = 0.5 its value becomes 1.25.",
    pitfall:
      "In-place updates and synchronous sweeps propagate information differently. Approximate evaluation weakens the exact improvement argument.",
    check: {
      question: "What information does classical dynamic programming require?",
      options: [
        "Only a trained policy",
        "A model of rewards and transitions",
        "Only terminal rewards",
      ],
      correct: 1,
      explanation: "The backups explicitly sum over the environment model.",
    },
    sources: ["neat", "spin-intro", "hfql"],
    scene: "dp",
    prerequisites: ["bellman"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "monte-carlo-td",
    title: "Monte Carlo, TD and terminal bootstrapping",
    stage: "Foundations",
    summary:
      "Monte Carlo uses a realized return. TD learns from a reward plus an estimate. This changes the bias/variance trade-off and the data needed for an update.",
    symbols: [
      ["alpha", "learning rate"],
      ["b_t", "bootstrap mask: zero only at a true task terminal"],
      ["delta_t", "TD residual"],
    ],
    assumptions: [
      "On-policy prediction for the comparison. A continuing-task time-limit cutoff retains bootstrapping from the final observation.",
    ],
    equations: [
      {
        name: "Monte Carlo update",
        tex: "V(s_t)\\leftarrow V(s_t)+\\alpha[G_t-V(s_t)]",
        explain:
          "Wait for a sampled return; complete episodes are the basic case.",
      },
      {
        name: "TD target and error",
        tex: "y_t=r_t+\\gamma b_tV(s_{t+1}),\\quad\\delta_t=y_t-V(s_t)",
        explain:
          "The next value is an estimate, which introduces bootstrapping.",
      },
      {
        name: "TD update",
        tex: "V(s_t)\\leftarrow V(s_t)+\\alpha\\delta_t",
        explain: "At a true terminal the continuation value is zero.",
      },
      {
        name: "Expected TD residual at the true value",
        tex: "\\mathbb E_\\pi[\\delta_t\\mid s_t=s,V=V^\\pi]=0",
        explain:
          "The conditional expectation, not every sample residual, vanishes.",
      },
    ],
    derivation: {
      claim: "Show why the true value makes the expected TD residual zero.",
      steps: [
        {
          text: "Take a conditional expectation.",
          tex: "\\mathbb E[\\delta_t\\mid s_t=s]=\\mathbb E[r_t+\\gamma b_tV^\\pi(s_{t+1})\\mid s_t=s]-V^\\pi(s)",
        },
        {
          text: "Recognize the policy Bellman backup.",
          tex: "=(T_\\pi V^\\pi)(s)-V^\\pi(s)",
        },
        {
          text: "Apply its fixed-point identity.",
          tex: "=0",
        },
      ],
    },
    example:
      "For r=1, gamma=0.9, V(s)=2 and V(s′)=3, delta=1.7. With alpha=0.1 the new value is 2.17. At a true terminal the target is 1 instead.",
    pitfall:
      "A Gymnasium truncation flag is not universally a terminal flag. Finite-horizon tasks must encode the remaining time or their true terminal semantics.",
    check: {
      question: "What is the target after a true terminal reward r?",
      options: ["r + gamma V(reset state)", "r", "0 regardless of r"],
      correct: 1,
      explanation: "There is no task continuation after a true terminal.",
    },
    sources: ["hfql", "clean-dqn", "spin-intro"],
    scene: "td",
    prerequisites: ["bellman"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "q-control",
    title: "SARSA, expected SARSA and Q-learning",
    stage: "Foundations",
    summary:
      "SARSA means State–Action–Reward–State–Action. The three updates differ in the action used inside the next-state target. That distinction separates on-policy evaluation/control from a greedy off-policy target.",
    symbols: [
      ["a′", "next action sampled from the behavior policy"],
      ["epsilon", "epsilon-greedy exploration probability"],
    ],
    assumptions: [
      "Finite discounted tabular MDP. Convergence claims require bounded rewards, sufficient visits and suitable stochastic-approximation stepsizes.",
    ],
    equations: [
      {
        name: "SARSA",
        tex: "y=r+\\gamma b Q(s',a'),\\quad a'\\sim\\pi(\\cdot\\mid s')",
        explain: "The target follows the next action actually sampled.",
      },
      {
        name: "Expected SARSA",
        tex: "y=r+\\gamma b\\sum_{a'}\\pi(a'\\mid s')Q(s',a')",
        explain: "Average over actions instead of sampling that component.",
      },
      {
        name: "Q-learning",
        tex: "y=r+\\gamma b\\max_{a'}Q(s',a'),\\quad Q\\leftarrow Q+\\alpha(y-Q)",
        explain: "The behavior action need not be greedy.",
      },
      {
        name: "Robbins–Monro conditions",
        tex: "\\sum_n\\alpha_n(s,a)=\\infty,\\quad\\sum_n\\alpha_n(s,a)^2<\\infty",
        explain:
          "Combine these with infinitely many visits. SARSA control additionally needs an appropriate GLIE policy schedule.",
      },
    ],
    derivation: {
      claim:
        "Show the greedy limit of expected SARSA for an epsilon-greedy policy.",
      steps: [
        {
          text: "For m actions, split the uniform and greedy mixtures.",
          tex: "\\pi_\\epsilon(a\\mid s)=\\epsilon/m+(1-\\epsilon)\\mathbf1_{\\{a=a^*\\}}",
        },
        {
          text: "Take the action expectation.",
          tex: "\\mathbb E_{\\pi_\\epsilon}Q=(1-\\epsilon)\\max_aQ+\\frac{\\epsilon}{m}\\sum_aQ",
        },
        {
          text: "Send exploration to zero for a fixed Q table.",
          tex: "\\lim_{\\epsilon\\to0}\\mathbb E_{\\pi_\\epsilon}Q=\\max_aQ",
        },
      ],
    },
    example:
      "For next-state Q=[1,3,2] and epsilon=0.3, the epsilon-greedy expectation is 2.7, while the greedy maximum is 3.",
    pitfall:
      "An epsilon-greedy action rule alone does not guarantee visits to every state. Neural Q-learning lacks the general tabular convergence guarantee.",
    check: {
      question:
        "Which target is independent of the action sampled by the behavior policy at the next state?",
      options: ["SARSA target", "Q-learning target", "Neither"],
      correct: 1,
      explanation: "Q-learning uses a greedy maximum in the target.",
    },
    sources: ["hfql", "neat", "spin-intro"],
    scene: "q-control",
    prerequisites: ["monte-carlo-td"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "exploration",
    title: "Bandits, optimism and intrinsic rewards",
    stage: "Foundations",
    summary:
      "Exploration is about useful information, not arbitrary action noise. A bandit isolates action uncertainty; multi-step RL also needs exploration over states.",
    symbols: [
      ["N_a", "action sample count"],
      ["t", "total bandit rounds"],
      ["c", "optimism coefficient"],
      ["eta", "intrinsic reward weight"],
    ],
    assumptions: [
      "The displayed Hoeffding bound assumes independent rewards in [0, 1]. The standard UCB-style rule assumes bounded stochastic bandit rewards and the stated sampling assumptions.",
    ],
    equations: [
      {
        name: "UCB-style selection",
        tex: "a_t\\in\\arg\\max_a[\\widehat\\mu_a+c\\sqrt{2\\log t/N_a}]",
        explain:
          "Initialize untried actions explicitly; do not divide by zero.",
      },
      {
        name: "Cumulative regret",
        tex: "\\mathcal R_T=T\\mu^*-\\mathbb E\\sum_{t=1}^Tr_t",
        explain:
          "This compares learning-time reward to the best fixed bandit arm.",
      },
      {
        name: "Intrinsic augmentation",
        tex: "r_t^{\\rm total}=r_t^{\\rm ext}+\\eta r_t^{\\rm int}",
        explain: "An intrinsic bonus changes the optimized learning signal.",
      },
      {
        name: "RND novelty signal",
        tex: "r_t^{\\rm int}=\\|f_{\\rm predictor}(s_t)-f_{\\rm fixed}(s_t)\\|^2",
        explain:
          "A trainable predictor attempts to match fixed random features.",
      },
    ],
    derivation: {
      claim: "Connect estimation uncertainty to an optimism bonus.",
      steps: [
        {
          text: "For independent bounded rewards, apply a Hoeffding tail bound.",
          tex: "\\Pr(|\\widehat\\mu_a-\\mu_a|\\geq u)\\leq2e^{-2N_au^2}",
        },
        {
          text: "Solve for a desired failure probability delta.",
          tex: "u=\\sqrt{\\log(2/\\delta)/(2N_a)}",
        },
        {
          text: "Use a time-dependent failure schedule to obtain the familiar order.",
          tex: "u_t=O(\\sqrt{\\log t/N_a})",
        },
      ],
    },
    example:
      "An arm with a smaller observed mean can be selected because it has far fewer samples and a larger uncertainty bonus. Raise c to see this trade-off.",
    pitfall:
      "Bandit UCB guarantees do not directly transfer to neural stateful RL. Intrinsic prediction error can reward noise rather than useful novelty.",
    check: {
      question: "Why can UCB choose an arm with a lower empirical mean?",
      options: [
        "Its uncertainty bonus can be larger",
        "It ignores all rewards",
        "It knows the true optimum",
      ],
      correct: 0,
      explanation:
        "Optimism explicitly balances estimated reward and uncertainty.",
    },
    sources: ["hf", "clean-rnd"],
    scene: "bandits",
    prerequisites: ["expectation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "function-approximation",
    title: "Function approximation, gradients and the deadly triad",
    stage: "Value-based RL",
    summary:
      "A network shares information across states, but approximation, off-policy data and bootstrapping can interact badly. A small TD error is not a general convergence certificate.",
    symbols: [
      ["theta", "function approximator parameters"],
      ["y", "a detached supervised target"],
      ["x(s)", "feature vector"],
    ],
    assumptions: [
      "Differentiable predictions; treat y as fixed for the semi-gradient shown. The quadratic illustration has a known scalar optimum.",
    ],
    equations: [
      {
        name: "Squared prediction loss",
        tex: "L(\\theta)=\\tfrac12\\mathbb E[(y-V_\\theta(s))^2]",
        explain: "The factor one-half simplifies the gradient.",
      },
      {
        name: "Semi-gradient step",
        tex: "\\theta\\leftarrow\\theta+\\alpha(y-V_\\theta(s))\\nabla_\\theta V_\\theta(s)",
        explain: "Do not differentiate through a detached bootstrapped target.",
      },
      {
        name: "Linear approximation",
        tex: "V_\\theta(s)=\\theta^\\top x(s)",
        explain:
          "Even linear TD is not ordinary supervised regression with independent fixed labels.",
      },
      {
        name: "Scalar stability example",
        tex: "L(w)=\\tfrac12(w-2)^2,\\quad w_{k+1}-2=(1-\\alpha)(w_k-2)",
        explain: "This specific quadratic converges for 0 < alpha < 2.",
      },
    ],
    derivation: {
      claim:
        "Derive the scalar stability range, without extending it to arbitrary neural TD.",
      steps: [
        {
          text: "Differentiate the fixed quadratic.",
          tex: "\\nabla L(w)=w-2",
        },
        {
          text: "Subtract its minimizer after one update.",
          tex: "w_{k+1}-2=(w_k-2)-\\alpha(w_k-2)",
        },
        {
          text: "Require the error multiplier to have magnitude below one.",
          tex: "|1-\\alpha|<1\\iff0<\\alpha<2",
        },
      ],
    },
    example:
      "With w_0=0 and alpha=1.5, iterates oscillate around 2 while shrinking their error. Alpha=2 gives an undamped oscillation.",
    pitfall:
      "The deadly triad is a warning about a combination of mechanisms, not a theorem that every algorithm using all three must diverge.",
    check: {
      question: "Why is a TD update often called a semi-gradient?",
      options: [
        "It differentiates only half the network layers",
        "It ignores the parameter dependence of the bootstrap target",
        "It must use half a batch",
      ],
      correct: 1,
      explanation:
        "The target is held fixed when differentiating the prediction loss.",
    },
    sources: ["clean-dqn", "spin-intro"],
    scene: "approximation",
    prerequisites: ["q-control"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "dqn",
    title: "Deep Q-networks: replay, targets and stable losses",
    stage: "Value-based RL",
    summary:
      "DQN means Deep Q-Network. DQN replaces a table with a neural Q-function and stabilizes its moving regression problem with replay and a slower target network.",
    symbols: [
      ["D", "replay distribution"],
      ["theta_bar", "target network parameters"],
      ["rho", "old-target weight in Polyak averaging"],
    ],
    assumptions: [
      "Discrete action space; fixed target parameters for a gradient step; bootstrap only when the transition is nonterminal for the modeled task.",
    ],
    equations: [
      {
        name: "Detached target",
        tex: "y=r+\\gamma b\\max_{a'}Q_{\\bar\\theta}(s',a')",
        explain:
          "A frozen target does not move when differentiating the online network.",
      },
      {
        name: "Replay loss",
        tex: "L(\\theta)=\\mathbb E_{(s,a,r,s',b)\\sim\\mathcal D}[\\tfrac12(Q_\\theta(s,a)-\\operatorname{sg}(y))^2]",
        explain: "sg denotes stop-gradient; Huber losses are also common.",
      },
      {
        name: "Polyak target update",
        tex: "\\bar\\theta\\leftarrow\\rho\\bar\\theta+(1-\\rho)\\theta,\\quad0\\leq\\rho<1",
        explain:
          "The small-update convention tau corresponds to 1−rho; hard copies are another option.",
      },
      {
        name: "Huber penalty",
        tex: "\\ell_\\kappa(e)=\\begin{cases}\\tfrac12e^2&|e|\\leq\\kappa\\\\\\kappa(|e|-\\tfrac12\\kappa)&|e|>\\kappa\\end{cases}",
        explain: "It limits the gradient magnitude from large residuals.",
      },
    ],
    derivation: {
      claim: "Derive the online-network gradient for one detached target.",
      steps: [
        {
          text: "Write the sample error.",
          tex: "e=Q_\\theta(s,a)-\\operatorname{sg}(y)",
        },
        {
          text: "Apply the chain rule.",
          tex: "\\nabla_\\theta\\tfrac12e^2=e\\nabla_\\theta Q_\\theta(s,a)",
        },
        {
          text: "Take a descent step.",
          tex: "\\theta^+=\\theta+\\alpha(y-Q_\\theta(s,a))\\nabla_\\theta Q_\\theta(s,a)",
        },
      ],
    },
    example:
      "If r=1, gamma=0.9 and the largest target-network next value is 3, y=3.7. Changing online parameters must not backpropagate into y.",
    pitfall:
      "Replay reduces temporal correlations but does not make the data perfectly independent. Keep final observations when bootstrapping across time limits.",
    check: {
      question: "Which parameters receive the online TD-loss gradient?",
      options: [
        "Only the online network",
        "Both online and frozen target networks",
        "Only the replay buffer",
      ],
      correct: 0,
      explanation: "The target is detached; its update has a separate rule.",
    },
    sources: ["clean-dqn", "neat", "dqn-paper"],
    scene: "dqn",
    prerequisites: ["function-approximation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "double-dueling",
    title: "Double DQN and dueling value decomposition",
    stage: "Value-based RL",
    summary:
      "Double DQN separates action selection from evaluation. Dueling networks separate a state-dependent common component from action-dependent differences; these are different ideas.",
    symbols: [
      ["Q_theta,Q_bar", "online and target estimates"],
      ["V,A", "dueling network heads"],
      ["m", "number of actions"],
    ],
    assumptions: [
      "The max-bias argument assumes mean-zero estimation errors. The dueling decomposition below uses uniform action centering, not policy weighting.",
    ],
    equations: [
      {
        name: "Maximization bias",
        tex: "\\mathbb E[\\max_a(q_a+\\varepsilon_a)]\\geq\\max_aq_a,\\quad\\mathbb E[\\varepsilon_a]=0",
        explain:
          "The maximum is convex, so noisy action estimates are selected optimistically in expectation.",
      },
      {
        name: "Double DQN target",
        tex: "y=r+\\gamma b Q_{\\bar\\theta}(s',\\arg\\max_aQ_\\theta(s',a))",
        explain: "The online network selects; the target network evaluates.",
      },
      {
        name: "Dueling combination",
        tex: "Q(s,a)=V(s)+A(s,a)-\\frac1m\\sum_bA(s,b)",
        explain: "Subtracting the action mean removes the additive ambiguity.",
      },
      {
        name: "Centered head meaning",
        tex: "\\frac1m\\sum_aQ(s,a)=V(s)",
        explain:
          "This V is the uniform action average of the combined Q values; it is not automatically V under an arbitrary policy.",
      },
    ],
    derivation: {
      claim: "Prove the mean-zero dueling advantage constraint.",
      steps: [
        {
          text: "Define centered advantages.",
          tex: "\\widetilde A_a=A_a-\\frac1m\\sum_bA_b",
        },
        {
          text: "Sum over all actions.",
          tex: "\\sum_a\\widetilde A_a=\\sum_aA_a-\\sum_bA_b=0",
        },
        {
          text: "Average the combined action values.",
          tex: "\\frac1m\\sum_a(V+\\widetilde A_a)=V",
        },
      ],
    },
    example:
      "Online values [2.8,1.2] select action 1; target values [1.8,2.2] evaluate that action at 1.8. The target maximum 2.2 would be a different operation.",
    pitfall:
      "Correlated neural-network errors mean Double DQN is not a universal unbiased estimator. Dueling is an architecture, not a substitute for Double DQN.",
    check: {
      question: "In Double DQN, which network chooses the next action?",
      options: ["The online network", "The target network", "A reward model"],
      correct: 0,
      explanation:
        "The target network scores the action chosen by the online network.",
    },
    sources: ["neat", "clean-dqn", "double-paper", "dueling-paper"],
    scene: "double",
    prerequisites: ["dqn"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "prioritized-replay",
    title: "Prioritized replay and importance corrections",
    stage: "Value-based RL",
    summary:
      "PER means Prioritized Experience Replay. Sampling informative transitions more often changes the training distribution. Importance weights explain when a sampled update still targets a uniform replay objective.",
    symbols: [
      ["p_i", "positive priority"],
      ["alpha", "priority exponent"],
      ["beta", "importance correction exponent"],
      ["N", "buffer size"],
    ],
    assumptions: [
      "Every replay entry has positive sampling probability. The unbiased identity uses beta=1 and unnormalized importance weights.",
    ],
    equations: [
      {
        name: "Priority and sampling",
        tex: "p_i=|\\delta_i|+\\epsilon,\\quad P(i)=\\frac{p_i^\\alpha}{\\sum_jp_j^\\alpha}",
        explain: "A positive epsilon prevents zero-probability entries.",
      },
      {
        name: "Importance weight",
        tex: "w_i=(NP(i))^{-\\beta}",
        explain:
          "Beta=0 gives no correction; beta=1 fully corrects the uniform-buffer expectation.",
      },
      {
        name: "Corrected expectation",
        tex: "\\mathbb E_{i\\sim P}[w_i f_i]=\\frac1N\\sum_if_i\\quad(\\beta=1)",
        explain: "This holds component-wise for gradient vectors too.",
      },
      {
        name: "Common normalization",
        tex: "\\widetilde w_i=w_i/\\max_jw_j",
        explain:
          "This changes the common scale of the corrected update, not the relative weighting within that batch.",
      },
    ],
    derivation: {
      claim: "Prove the importance-weighting identity.",
      steps: [
        {
          text: "Expand the sampling expectation.",
          tex: "\\mathbb E_P[w_if_i]=\\sum_iP(i)\\frac{f_i}{NP(i)}",
        },
        {
          text: "Cancel nonzero sampling probabilities.",
          tex: "=\\frac1N\\sum_if_i",
        },
        {
          text: "Observe what happens without full correction.",
          tex: "\\mathbb E_P[(NP(i))^{-\\beta}f_i]=N^{-\\beta}\\sum_iP(i)^{1-\\beta}f_i",
        },
      ],
    },
    example:
      "For a buffer with f=[1,2,4], the fully corrected expectation is always 7/3 even when the priorities are unequal. A single corrected sample need not equal 7/3.",
    pitfall:
      "Max-normalized weights are not literally the same unbiased gradient; beta below one retains bias. Priorities must be refreshed as estimates change.",
    check: {
      question: "What sampling rule results from alpha = 0?",
      options: ["Greedy sampling", "Uniform replay sampling", "No sampling"],
      correct: 1,
      explanation: "Every positive priority raised to zero becomes one.",
    },
    sources: ["per-paper", "clean-dqn"],
    scene: "per",
    prerequisites: ["dqn"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "distributional",
    title: "Distributional RL: C51 and quantile losses",
    stage: "Value-based RL",
    summary:
      "C51 uses a categorical return distribution, classically with 51 support atoms. A return distribution contains more information than its mean. C51 moves probability mass through a Bellman target and projects it back onto fixed atoms.",
    symbols: [
      ["Z(s,a)", "random return"],
      ["z_i", "fixed support atom"],
      ["m_i", "projected probability mass"],
      ["tau", "quantile level"],
    ],
    assumptions: [
      "Finite categorical support for C51. Choose the next action using expected returns, not a maximum of independent random samples.",
    ],
    equations: [
      {
        name: "Distributional evaluation backup",
        tex: "Z^\\pi(s,a)\\overset D=r+\\gamma b Z^\\pi(s',a'),\\quad a'\\sim\\pi",
        explain:
          "The equality is in distribution; its expectation recovers the ordinary Bellman equation.",
      },
      {
        name: "Transported atoms",
        tex: "v_j=\\operatorname{clip}(r+\\gamma b z_j,V_{\\min},V_{\\max}),\\quad b_j=(v_j-V_{\\min})/\\Delta z",
        explain:
          "Clipping can introduce support bias if important returns lie outside the interval.",
      },
      {
        name: "Mass-preserving projection",
        tex: "m_\\ell\\mathrel{+}=p_j(u-b_j),\\quad m_u\\mathrel{+}=p_j(b_j-\\ell),\\quad\\ell=\\lfloor b_j\\rfloor,\\ u=\\lceil b_j\\rceil",
        explain:
          "When ell = u, put the entire mass p_j at that atom; the two generic weights would otherwise be zero.",
      },
      {
        name: "Cross-entropy and quantile alternative",
        tex: "L_{\\rm C51}=-\\sum_i m_i\\log p_{\\theta,i},\\qquad\\rho_\\tau(u)=u(\\tau-\\mathbf1_{\\{u<0\\}})",
        explain:
          "Quantile regression uses a different parameterization and loss; it is not the C51 categorical projection.",
      },
    ],
    derivation: {
      claim:
        "Prove that linear interpolation conserves mass for a noninteger target position.",
      steps: [
        {
          text: "Adjacent support indices differ by one.",
          tex: "u-\\ell=1",
        },
        {
          text: "Sum the two interpolation weights.",
          tex: "(u-b_j)+(b_j-\\ell)=1",
        },
        {
          text: "Include the integer special case and sum input atoms.",
          tex: "\\sum_im_i=\\sum_jp_j=1",
        },
      ],
    },
    example:
      "A point mass transported to 1.3 on atoms [0,1,2,3,4] becomes mass 0.7 at 1 and 0.3 at 2. Its mean remains 1.3 when clipping is unnecessary.",
    pitfall:
      "A distributional evaluation contraction is not an unrestricted convergence theorem for distributional control with neural networks.",
    check: {
      question: "Where should a target mass exactly on atom 2 be placed?",
      options: [
        "Half at 1 and half at 3",
        "Entirely at atom 2",
        "It should be discarded",
      ],
      correct: 1,
      explanation: "The integer-index special case preserves the full mass.",
    },
    sources: ["clean-c51", "c51-paper"],
    scene: "c51",
    prerequisites: ["dqn"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "policy-gradient",
    title: "Policy gradients and the likelihood-ratio trick",
    stage: "Policy optimization",
    summary:
      "REINFORCE is a Monte Carlo policy-gradient method. Differentiate a distribution over trajectories instead of differentiating through the environment. The environment factors disappear only when they are independent of policy parameters.",
    symbols: [
      ["theta", "policy parameters"],
      ["R(tau)", "discounted trajectory reward"],
      ["d_pi_gamma", "normalized discounted state occupancy"],
    ],
    assumptions: [
      "Differentiable stochastic policy with suitable support and integrability; differentiation and expectation may be interchanged, for example under an integrable dominating score-times-return bound. Initial-state distribution and dynamics are independent of theta.",
    ],
    equations: [
      {
        name: "Objective",
        tex: "J(\\theta)=\\mathbb E_{\\tau\\sim p_\\theta}[R(\\tau)],\\quad R(\\tau)=\\sum_{t\\geq0}\\gamma^t r_t",
        explain: "The initial-state distribution is part of this objective.",
      },
      {
        name: "Score identity",
        tex: "\\nabla_\\theta\\log p_\\theta(\\tau)=\\sum_t\\nabla_\\theta\\log\\pi_\\theta(a_t\\mid s_t)",
        explain: "Only parameter-dependent policy factors contribute.",
      },
      {
        name: "Reward-to-go gradient",
        tex: "\\nabla J=\\mathbb E\\left[\\sum_t\\gamma^t\\nabla\\log\\pi_\\theta(a_t\\mid s_t)G_t\\right]",
        explain:
          "Gamma^t is required for this start-state discounted objective; some algorithm descriptions use a different weighting convention.",
      },
      {
        name: "Discounted occupancy form",
        tex: "\\nabla J=\\frac{1}{1-\\gamma}\\mathbb E_{s\\sim d_\\pi^\\gamma,a\\sim\\pi}[\\nabla\\log\\pi(a\\mid s)Q^\\pi(s,a)]",
        explain:
          "Here d_pi_gamma(s)=(1−gamma) sum_t gamma^t P(s_t=s), so the normalization factor matters.",
      },
      {
        name: "REINFORCE sample minimization loss",
        tex: "\\widehat L=-\\frac1N\\sum_{i=1}^N\\sum_t\\gamma^t\\log\\pi_\\theta(a_t^i\\mid s_t^i)\\operatorname{sg}(G_t^i-b(s_t^i))",
        explain:
          "On-policy trajectories and detached return-minus-baseline targets give the score estimator at the sampling policy. Uncorrected repeated off-policy reuse changes that estimator.",
      },
    ],
    derivation: {
      claim:
        "Derive the trajectory score estimator and remove past rewards by causality.",
      steps: [
        {
          text: "Differentiate under the trajectory integral.",
          tex: "\\nabla J=\\mathbb E[R(\\tau)\\nabla\\log p_\\theta(\\tau)]",
        },
        {
          text: "Use normalization to cancel a score multiplied by a known past reward.",
          tex: "\\mathbb E[\\nabla\\log\\pi(a_t\\mid s_t)\\mid s_t]=\\sum_a\\nabla\\pi(a\\mid s_t)=0",
        },
        {
          text: "Only current and future rewards remain.",
          tex: "\\sum_{k\\geq t}\\gamma^kr_k=\\gamma^tG_t",
        },
      ],
    },
    example:
      "For a two-action bandit with rewards [0,1] and probability sigma(z) of action 1, J(z)=sigma(z) and dJ/dz=sigma(z)(1−sigma(z)).",
    pitfall:
      "If environment dynamics themselves depend on theta, their derivative cannot simply be omitted. Differentiating a sampled action is not the score-function estimator.",
    check: {
      question:
        "Why do transition probabilities disappear from the score derivative?",
      options: [
        "They are assumed independent of theta",
        "They are equal to one",
        "Their logarithms are always zero",
      ],
      correct: 0,
      explanation:
        "The derivative of a parameter-independent factor’s logarithm is zero.",
    },
    sources: ["spin-pg", "hf", "neat"],
    scene: "policy-gradient",
    prerequisites: ["mdp", "expectation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "baselines",
    title: "Baselines, advantage and gradient variance",
    stage: "Policy optimization",
    summary:
      "A state-only baseline changes the variance of the score estimator without changing its expectation. A value baseline is useful, but not always the exact variance-minimizing one.",
    symbols: [
      ["b(s)", "action-independent baseline"],
      ["g", "policy score vector"],
      ["A", "advantage"],
    ],
    assumptions: [
      "Condition on a state; sums and derivatives may be exchanged; the baseline is held fixed in the actor gradient.",
    ],
    equations: [
      {
        name: "Baseline estimator",
        tex: "\\widehat g=\\nabla\\log\\pi(a\\mid s)[Q(s,a)-b(s)]",
        explain:
          "Subtracting a constant across actions preserves the expected policy gradient.",
      },
      {
        name: "Zero-mean correction",
        tex: "\\mathbb E_{a\\sim\\pi}[\\nabla\\log\\pi(a\\mid s)b(s)]=0",
        explain: "Action dependence would generally invalidate this identity.",
      },
      {
        name: "Value baseline",
        tex: "b(s)=V^\\pi(s)\\implies Q^\\pi(s,a)-b(s)=A^\\pi(s,a)",
        explain:
          "The critic supplies this baseline in many actor-critic algorithms.",
      },
      {
        name: "Minimum second-moment baseline",
        tex: "b^*(s)=\\frac{\\mathbb E[\\|g\\|^2Q\\mid s]}{\\mathbb E[\\|g\\|^2\\mid s]}",
        explain:
          "This formula requires a nonzero denominator and is not generally just E[Q|s].",
      },
    ],
    derivation: {
      claim: "Prove baseline invariance.",
      steps: [
        {
          text: "Condition on the state and factor out its baseline.",
          tex: "\\mathbb E[g b(s)\\mid s]=b(s)\\sum_a\\pi(a\\mid s)\\nabla\\log\\pi(a\\mid s)",
        },
        {
          text: "Use pi times its log derivative.",
          tex: "=b(s)\\nabla\\sum_a\\pi(a\\mid s)",
        },
        {
          text: "Differentiate the normalization constant.",
          tex: "=b(s)\\nabla1=0",
        },
      ],
    },
    example:
      "In an equal-probability binary policy with rewards [0,2], a baseline of 1 makes both single-logit gradient samples equal 0.5: zero sample variance in this toy case.",
    pitfall:
      "Allowing actor-loss gradients through the baseline adds unwanted terms. State-dependent baselines can be unbiased while a bootstrapped advantage estimate is still biased.",
    check: {
      question:
        "Which baseline preserves the expected score gradient without a correction?",
      options: [
        "A baseline depending only on state",
        "An arbitrary baseline depending on the sampled action",
        "Only a zero baseline",
      ],
      correct: 0,
      explanation:
        "The zero-mean proof needs the baseline to factor outside the action sum.",
    },
    sources: ["spin-pg", "spin-vpg"],
    scene: "baseline",
    prerequisites: ["policy-gradient"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "actor-critic",
    title: "Actor-critic, A2C and separate optimization roles",
    stage: "Policy optimization",
    summary:
      "A2C means Advantage Actor-Critic. The actor improves action probabilities while the critic learns a predictive value function. They solve related but different optimization problems.",
    symbols: [
      ["theta", "actor parameters"],
      ["phi", "critic parameters"],
      ["sg", "stop-gradient"],
      ["delta", "TD residual"],
    ],
    assumptions: [
      "On-policy state/action data for the basic A2C estimator; a detached critic target and detached actor advantage estimate.",
    ],
    equations: [
      {
        name: "One-step advantage estimate",
        tex: "\\widehat A_t=r_t+\\gamma b_tV_\\phi(s_{t+1})-V_\\phi(s_t)",
        explain:
          "This is an estimate of advantage, not necessarily the exact advantage.",
      },
      {
        name: "Actor minimization loss",
        tex: "L_\\pi=-\\mathbb E[\\log\\pi_\\theta(a_t\\mid s_t)\\operatorname{sg}(\\widehat A_t)]",
        explain:
          "Gradient descent on this negative sign implements policy ascent. State/time sampling and weights must match the chosen objective; the start-state discounted objective requires its discounted weighting.",
      },
      {
        name: "Critic loss",
        tex: "L_V=\\tfrac12\\mathbb E[(V_\\phi(s_t)-\\operatorname{sg}(\\widehat V_t))^2]",
        explain:
          "The critic regresses to a return or bootstrapped value target.",
      },
      {
        name: "Entropy bonus",
        tex: "L=L_\\pi+c_VL_V-c_H\\mathbb E[\\mathcal H(\\pi_\\theta(\\cdot\\mid s))]",
        explain:
          "Shared networks need careful loss weighting; entropy encourages action diversity.",
      },
    ],
    derivation: {
      claim:
        "Show how an exact value critic makes the conditional expected TD residual an advantage.",
      steps: [
        {
          text: "Condition on both the state and selected action.",
          tex: "\\mathbb E[\\delta_t\\mid s,a]=r(s,a)+\\gamma\\mathbb E[V^\\pi(s')\\mid s,a]-V^\\pi(s)",
        },
        {
          text: "Recognize the action value.",
          tex: "=Q^\\pi(s,a)-V^\\pi(s)",
        },
        {
          text: "Apply the definition of advantage.",
          tex: "=A^\\pi(s,a)",
        },
      ],
    },
    example:
      "A positive residual raises the selected action’s probability under actor ascent. The critic simultaneously raises an underestimated state value; neither update proves the sample action is always best.",
    pitfall:
      "The actor and critic are not interchangeable networks. Off-policy data generally needs additional corrections or an explicitly off-policy algorithm.",
    check: {
      question:
        "Why is the estimated advantage detached in the basic actor loss?",
      options: [
        "To remove the score gradient",
        "To prevent unintended differentiation through the critic target",
        "To force all rewards to zero",
      ],
      correct: 1,
      explanation:
        "The intended actor estimator multiplies a policy score by a fixed advantage estimate.",
    },
    sources: ["spin-vpg", "hf"],
    scene: "actor-critic",
    prerequisites: ["baselines", "monte-carlo-td"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "gae",
    title: "Eligibility traces, n-step targets and GAE",
    stage: "Policy optimization",
    summary:
      "GAE means Generalized Advantage Estimation. GAE accumulates TD residuals with a geometric decay. Lambda trades dependence on a learned critic against the variability of longer returns.",
    symbols: [
      ["lambda", "trace parameter"],
      ["L", "rollout length"],
      ["delta_t", "TD residual"],
    ],
    assumptions: [
      "The derivation uses a contiguous nonterminal segment; true terminal masks must stop traces. At a rollout cutoff, retain the boundary value estimate.",
    ],
    equations: [
      {
        name: "n-step target",
        tex: "G_t^{(n)}=\\sum_{k=0}^{n-1}\\gamma^kr_{t+k}+\\gamma^nV(s_{t+n})",
        explain: "At a true terminal the final value is zero.",
      },
      {
        name: "GAE sum",
        tex: "\\widehat A_t^{\\rm GAE}=\\sum_{l=0}^{L-1}(\\gamma\\lambda)^l\\delta_{t+l}",
        explain:
          "This finite sum includes the boundary bootstrap through its residuals.",
      },
      {
        name: "Backward recursion",
        tex: "\\widehat A_t=\\delta_t+\\gamma\\lambda b_t\\widehat A_{t+1}",
        explain:
          "Reset the trace across task terminals; do not mix reset-state observations into the prior episode.",
      },
      {
        name: "Lambda-one telescope",
        tex: "\\sum_{l=0}^{L-1}\\gamma^l\\delta_{t+l}=G_t^{(L)}-V(s_t)",
        explain:
          "This equals a Monte Carlo advantage only when the boundary continuation value is appropriately zero.",
      },
      {
        name: "Accumulating TD eligibility trace",
        tex: "e_t=\\gamma\\lambda b_{t-1}e_{t-1}+\\nabla_\\phi V_\\phi(s_t),\\quad\\phi\\leftarrow\\phi+\\alpha\\delta_t e_t",
        explain:
          "This is a semi-gradient TD(λ) prediction update. Reset traces across true terminals; exact online forward/backward equivalence requires additional care when weights change.",
      },
    ],
    derivation: {
      claim:
        "Prove the lambda-one identity by canceling consecutive value terms.",
      steps: [
        {
          text: "Expand the discounted residuals.",
          tex: "\\sum_l\\gamma^l[r_{t+l}+\\gamma V(s_{t+l+1})-V(s_{t+l})]",
        },
        {
          text: "Cancel the intermediate value terms.",
          tex: "=\\sum_{l=0}^{L-1}\\gamma^lr_{t+l}+\\gamma^LV(s_{t+L})-V(s_t)",
        },
        {
          text: "Recognize the n-step target.",
          tex: "=G_t^{(L)}-V(s_t)",
        },
      ],
    },
    example:
      "For residuals [1,−0.5,2,1], gamma=0.9 and lambda=0.5, the first advantage is 1−0.225+0.405+0.091125=1.271125.",
    pitfall:
      "With an approximate critic, GAE is not universally unbiased for every lambda. Lambda=0 is the one-step residual, not a Monte Carlo return.",
    check: {
      question: "What does lambda = 0 leave in GAE?",
      options: ["Only delta_t", "The full return", "No gradient at all"],
      correct: 0,
      explanation: "All terms with positive trace index receive zero weight.",
    },
    sources: ["gae-paper", "spin-vpg", "spin-ppo"],
    scene: "gae",
    prerequisites: ["actor-critic"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "trpo",
    title: "Trust regions, Fisher geometry and natural gradients",
    stage: "Policy optimization",
    summary:
      "TRPO means Trust Region Policy Optimization. A large parameter step can cause a large policy change. TRPO constrains a local policy divergence while improving an old-policy surrogate.",
    symbols: [
      ["r_theta", "new/old action probability ratio"],
      ["F", "local KL Hessian (Fisher matrix)"],
      ["Delta", "KL budget"],
      ["g", "surrogate gradient"],
    ],
    assumptions: [
      "Old-policy samples; differentiable policy with shared support. The local quadratic solution assumes positive-definite F, often obtained with damping.",
    ],
    equations: [
      {
        name: "Surrogate objective",
        tex: "\\max_\\theta\\mathbb E_{\\pi_{\\rm old}}\\!\\left[\\frac{\\pi_\\theta(a\\mid s)}{\\pi_{\\rm old}(a\\mid s)}\\widehat A_{\\rm old}(s,a)\\right]",
        explain:
          "The old state distribution is a surrogate, not the true new-policy occupancy.",
      },
      {
        name: "Practical mean KL constraint",
        tex: "\\mathbb E_{s\\sim d_{\\rm old}}[D_{\\rm KL}(\\pi_{\\rm old}(\\cdot\\mid s)\\|\\pi_\\theta(\\cdot\\mid s))]\\leq\\Delta",
        explain:
          "The theoretical monotonic bound uses stronger control than an arbitrary empirical mean-KL check.",
      },
      {
        name: "Local constrained problem",
        tex: "\\max_xg^\\top x\\quad\\text{s.t.}\\quad\\tfrac12x^\\top Fx\\leq\\Delta",
        explain: "The KL quadratic changes the geometry of a step.",
      },
      {
        name: "Local solution",
        tex: "x^*=\\sqrt{\\frac{2\\Delta}{g^\\top F^{-1}g}}F^{-1}g",
        explain:
          "Conjugate gradients approximates the inverse-vector product; backtracking checks the actual policy change.",
      },
    ],
    derivation: {
      claim:
        "Derive the natural-gradient direction from the quadratic Lagrangian.",
      steps: [
        {
          text: "Set the derivative with respect to the step to zero.",
          tex: "g-\\nu Fx=0\\implies x=F^{-1}g/\\nu",
        },
        {
          text: "Use the active constraint.",
          tex: "\\frac{1}{2\\nu^2}g^\\top F^{-1}g=\\Delta",
        },
        {
          text: "Choose the positive ascent multiplier.",
          tex: "\\nu=\\sqrt{g^\\top F^{-1}g/(2\\Delta)}",
        },
      ],
    },
    example:
      "If F=diag(4,1) and g=[1,1], the natural direction is [0.25,1], not [1,1]. Motion is more expensive in the first coordinate.",
    pitfall:
      "The local quadratic derivation does not guarantee global monotonic improvement for a neural policy trained on a finite batch.",
    check: {
      question:
        "Which direction appears before rescaling the natural-gradient step?",
      options: ["F g", "F inverse times g", "The value gradient alone"],
      correct: 1,
      explanation:
        "The KL metric preconditions the ordinary surrogate gradient.",
    },
    sources: ["spin-trpo", "trpo-paper"],
    scene: "trpo",
    prerequisites: ["policy-gradient", "baselines"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "ppo",
    title: "PPO clipping, advantage signs and empirical KL",
    stage: "Policy optimization",
    summary:
      "PPO means Proximal Policy Optimization. PPO clips a sampled importance-ratio objective. The clipping is sign-dependent and does not create a hard trust-region constraint.",
    symbols: [
      ["r", "new/old action probability ratio"],
      ["epsilon", "clipping range"],
      ["A", "detached old-policy advantage"],
    ],
    assumptions: [
      "Actions sampled under the old policy; evaluate ratios and advantages consistently. Optimize the negative objective when using a minimizer.",
    ],
    equations: [
      {
        name: "Probability ratio",
        tex: "r_t(\\theta)=\\exp(\\log\\pi_\\theta(a_t\\mid s_t)-\\log\\pi_{\\rm old}(a_t\\mid s_t))",
        explain:
          "This is a per-action ratio, not a ratio of parameter vectors.",
      },
      {
        name: "Clipped objective",
        tex: "L^{\\rm clip}=\\mathbb E[\\min(r_t\\widehat A_t,\\operatorname{clip}(r_t,1-\\epsilon,1+\\epsilon)\\widehat A_t)]",
        explain:
          "Min makes the objective pessimistic relative to the unclipped sample surrogate.",
      },
      {
        name: "Sign-dependent shape",
        tex: "\\ell(r,A)=\\begin{cases}A\\min(r,1+\\epsilon)&A\\geq0\\\\A\\max(r,1-\\epsilon)&A<0\\end{cases}",
        explain: "Positive and negative advantages flatten on opposite sides.",
      },
      {
        name: "Sample KL diagnostic",
        tex: "\\widehat D=\\frac1N\\sum_t[(r_t-1)-\\log r_t]",
        explain:
          "This nonnegative sample expression estimates old-to-new KL under compatible sampling/support; finite-sample monitoring is still approximate.",
      },
    ],
    derivation: {
      claim: "Derive both branches of the clipped sample objective.",
      steps: [
        {
          text: "For positive A, multiplication preserves the order.",
          tex: "\\min(rA,\\operatorname{clip}(r)A)=A\\min(r,1+\\epsilon)",
        },
        {
          text: "For negative A, multiplication reverses the order.",
          tex: "\\min(rA,\\operatorname{clip}(r)A)=A\\max(r,1-\\epsilon)",
        },
        {
          text: "A pointwise lower bound does not bound the entire policy distribution.",
          tex: "\\ell(r,A)\\leq rA\\quad\\not\\Rightarrow\\quad D_{\\rm KL}(\\pi_{\\rm old}\\|\\pi_\\theta)\\leq\\Delta",
        },
      ],
    },
    example:
      "With A=−1, epsilon=0.2 and r=0.5, the clipped objective is −0.8, not −0.5. Flip the advantage sign in the animation to see the flat branch switch sides.",
    pitfall:
      "Clipping is not a hard bound on every ratio or KL divergence. Multiple epochs, learning rate, value loss and advantage normalization still matter.",
    check: {
      question: "For A > 0, which side of the sample objective becomes flat?",
      options: [
        "r above 1 + epsilon",
        "r below 1 − epsilon",
        "Both sides in every case",
      ],
      correct: 0,
      explanation:
        "There is no added incentive for increasing an already-large positive-advantage ratio.",
    },
    sources: ["spin-ppo", "ppo-paper", "clean-ppo", "hf"],
    scene: "ppo",
    prerequisites: ["gae", "trpo"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "ddpg",
    title: "DDPG and deterministic policy gradients",
    stage: "Continuous control",
    summary:
      "DDPG means Deep Deterministic Policy Gradient. For continuous actions, a deterministic actor replaces the expensive maximum over actions. The actor follows the critic’s action gradient.",
    symbols: [
      ["mu_phi", "deterministic actor"],
      ["theta", "critic parameters"],
      ["D", "replay distribution"],
    ],
    assumptions: [
      "Differentiable actor and action-value critic; critic fixed during the actor step. The replay-state actor objective is a practical surrogate.",
    ],
    equations: [
      {
        name: "Critic target",
        tex: "y=r+\\gamma bQ_{\\bar\\theta}(s',\\mu_{\\bar\\phi}(s'))",
        explain: "Both the target actor and target critic evolve slowly.",
      },
      {
        name: "Actor objective",
        tex: "J_{\\mathcal D}(\\phi)=\\mathbb E_{s\\sim\\mathcal D}[Q_\\theta(s,\\mu_\\phi(s))]",
        explain:
          "Arbitrary replay states do not automatically reproduce the exact start-state performance gradient.",
      },
      {
        name: "Chain-rule gradient",
        tex: "\\nabla_\\phi J_{\\mathcal D}=\\mathbb E_{\\mathcal D}[\\nabla_\\phi\\mu_\\phi(s)\\nabla_aQ_\\theta(s,a)|_{a=\\mu_\\phi(s)}]",
        explain:
          "Backpropagate through the action input, not through critic-parameter updates.",
      },
      {
        name: "Exploratory behavior",
        tex: "a_t=\\operatorname{clip}(\\mu_\\phi(s_t)+\\varepsilon_t,a_{\\min},a_{\\max})",
        explain:
          "Exploration noise is separate from the deterministic evaluation policy.",
      },
    ],
    derivation: {
      claim: "Derive the actor gradient by composing the actor and critic.",
      steps: [
        {
          text: "Write the critic as a function of the actor output.",
          tex: "f_s(\\phi)=Q_\\theta(s,\\mu_\\phi(s))",
        },
        {
          text: "Hold theta fixed and apply the chain rule.",
          tex: "\\nabla_\\phi f_s=(\\nabla_\\phi\\mu_\\phi)\\nabla_aQ_\\theta",
        },
        {
          text: "Average over the replay-state sampling distribution.",
          tex: "\\nabla J_{\\mathcal D}=\\mathbb E_{\\mathcal D}[\\nabla f_s]",
        },
      ],
    },
    example:
      "For Q(a)=1−(a−0.7)^2, the action gradient is 2(0.7−a). An actor initially producing −0.8 moves toward 0.7 under sufficiently small ascent steps.",
    pitfall:
      "The actor can exploit critic errors at actions rarely represented in replay. This is one motivation for TD3 and conservative/offline methods.",
    check: {
      question:
        "What derivative tells the deterministic actor how to change its action?",
      options: [
        "The critic gradient with respect to action",
        "The reward model’s file name",
        "A maximum over an arbitrary discretization only",
      ],
      correct: 0,
      explanation:
        "The chain rule follows the critic’s action gradient through the actor.",
    },
    sources: ["spin-ddpg", "ddpg-paper"],
    scene: "ddpg",
    prerequisites: ["dqn", "policy-gradient"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "td3",
    title: "TD3: twin critics, delayed actors and smoothing",
    stage: "Continuous control",
    summary:
      "TD3 means Twin Delayed Deep Deterministic Policy Gradient. TD3 addresses specific DDPG failure modes using a smaller twin-critic target, delayed actor updates and noisy target actions.",
    symbols: [
      ["Q_1,Q_2", "two critics"],
      ["sigma,c", "target-noise scale and clipping bound"],
      ["rho", "Polyak old-target weight"],
    ],
    assumptions: [
      "Continuous bounded actions; target noise is separate from behavior exploration. Minimum targets may be negatively biased.",
    ],
    equations: [
      {
        name: "Smoothed target action",
        tex: "\\widetilde a'=\\operatorname{clip}(\\mu_{\\bar\\phi}(s')+\\operatorname{clip}(\\varepsilon,-c,c),a_{\\min},a_{\\max}),\\quad\\varepsilon\\sim\\mathcal N(0,\\sigma^2I)",
        explain: "Noise discourages exploitation of narrow critic peaks.",
      },
      {
        name: "Clipped double-Q target",
        tex: "y=r+\\gamma b\\min_{i\\in\\{1,2\\}}Q_{\\bar\\theta_i}(s',\\widetilde a')",
        explain:
          "Use the same sampled target action when comparing the critics.",
      },
      {
        name: "Twin critic losses",
        tex: "L_i=\\tfrac12\\mathbb E_{\\mathcal D}[(Q_{\\theta_i}(s,a)-\\operatorname{sg}(y))^2]",
        explain: "Each critic fits the shared detached target.",
      },
      {
        name: "Delayed actor update",
        tex: "\\nabla_\\phi J\\approx\\mathbb E[\\nabla_\\phi\\mu_\\phi(s)\\nabla_aQ_{\\theta_1}(s,a)|_{a=\\mu_\\phi(s)}]",
        explain:
          "Update the actor and targets less frequently than critics; a 2:1 critic/actor ratio is a common choice.",
      },
    ],
    derivation: {
      claim: "Explain the effect of the minimum without claiming unbiasedness.",
      steps: [
        {
          text: "Use the identity for the smaller of two estimates.",
          tex: "\\min(X,Y)=\\tfrac12(X+Y-|X-Y|)",
        },
        {
          text: "Take expectations when both estimates have mean q.",
          tex: "\\mathbb E[\\min(X,Y)]=q-\\tfrac12\\mathbb E|X-Y|",
        },
        {
          text: "Conclude the direction of this idealized bias.",
          tex: "\\mathbb E[\\min(X,Y)]\\leq q",
        },
      ],
    },
    example:
      "If two target critics predict 3.0 and 2.2 at the same target action, their minimum is 2.2. This does not prove that 2.2 is below the true action value.",
    pitfall:
      "Twin critics, delayed updates and target smoothing are three separate mechanisms. A minimum of correlated approximators is not a certified lower confidence bound.",
    check: {
      question: "Which estimate enters the TD3 target?",
      options: [
        "The larger target critic",
        "The smaller target critic at the shared target action",
        "The average reward only",
      ],
      correct: 1,
      explanation: "The clipped double-Q target uses the minimum.",
    },
    sources: ["spin-td3", "td3-paper"],
    scene: "td3",
    prerequisites: ["ddpg"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "sac",
    title: "SAC, maximum entropy and reparameterization",
    stage: "Continuous control",
    summary:
      "SAC means Soft Actor-Critic. SAC optimizes a reward–entropy trade-off with a stochastic actor. Its policy objective, critic target and temperature update must use consistent log probabilities.",
    symbols: [
      ["alpha", "positive entropy temperature"],
      ["psi", "stochastic actor parameters"],
      ["u,a", "Gaussian pre-squash variable and bounded action"],
    ],
    assumptions: [
      "Discounted entropy-regularized objective; the displayed tanh density uses unit action bounds. Include an additional scale Jacobian for other bounds.",
    ],
    equations: [
      {
        name: "Maximum-entropy objective",
        tex: "J=\\mathbb E\\sum_t\\gamma^t[r_t+\\alpha\\mathcal H(\\pi(\\cdot\\mid s_t))]",
        explain:
          "For continuous actions this is differential entropy, which can be negative.",
      },
      {
        name: "Soft critic target",
        tex: "y=r+\\gamma b[\\min_iQ_{\\bar\\theta_i}(s',a')-\\alpha\\log\\pi_\\psi(a'\\mid s')],\\quad a'\\sim\\pi_\\psi",
        explain: "The next action is sampled from the stochastic actor.",
      },
      {
        name: "Reparameterized actor loss",
        tex: "L_\\pi=\\mathbb E_{s,\\epsilon}[\\alpha\\log\\pi_\\psi(a\\mid s)-\\min_iQ_{\\theta_i}(s,a)],\\quad a=\\tanh(\\mu_\\psi+\\sigma_\\psi\\epsilon)",
        explain:
          "Differentiate through the sampled action expressed as a differentiable function of fixed noise.",
      },
      {
        name: "Tanh density correction",
        tex: "\\log\\pi(a\\mid s)=\\log\\mathcal N(u;\\mu,\\sigma)-\\sum_j\\log(1-\\tanh^2u_j)",
        explain: "Use a numerically stable equivalent near saturated actions.",
      },
      {
        name: "Discrete soft value analogy",
        tex: "V_\\alpha(Q)=\\alpha\\log\\sum_a e^{Q_a/\\alpha},\\quad\\pi_a^*\\propto e^{Q_a/\\alpha}",
        explain:
          "The animation shows this finite-action entropy optimum, not a full continuous SAC training run.",
      },
    ],
    derivation: {
      claim: "Derive the finite-action maximum-entropy policy.",
      steps: [
        {
          text: "Add the normalization multiplier to the reward plus entropy objective.",
          tex: "\\mathcal L=\\sum_a\\pi_aQ_a-\\alpha\\sum_a\\pi_a\\log\\pi_a+\\nu(\\sum_a\\pi_a-1)",
        },
        {
          text: "Set each derivative to zero.",
          tex: "Q_a-\\alpha(\\log\\pi_a+1)+\\nu=0",
        },
        {
          text: "Normalize the resulting exponential policy.",
          tex: "\\pi_a^*=e^{Q_a/\\alpha}/\\sum_b e^{Q_b/\\alpha}",
        },
      ],
    },
    example:
      "For Q=[0,1,2], increasing alpha makes the optimal finite-action distribution less concentrated. Its expected Q plus alpha times entropy equals the displayed soft value.",
    pitfall:
      "Forgetting the tanh Jacobian gives wrong log probabilities and temperature gradients. A stochastic actor alone is not SAC without its entropy-regularized objectives.",
    check: {
      question:
        "As alpha tends to zero in the finite-action analogy, what does soft value approach?",
      options: [
        "The maximum Q value",
        "Zero for every Q",
        "The minimum Q value",
      ],
      correct: 0,
      explanation:
        "Log-sum-exp approaches the hard maximum as temperature goes to zero.",
    },
    sources: ["spin-sac", "sac-paper", "clean-sac"],
    scene: "sac",
    prerequisites: ["actor-critic", "td3"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "off-policy-evaluation",
    title: "Off-policy evaluation and importance sampling",
    stage: "Evaluation",
    summary:
      "Estimating a new policy from another policy’s data requires explicit overlap and weighting assumptions. Reweighting cannot create information about actions that were never observed.",
    symbols: [
      ["mu", "behavior policy generating the dataset"],
      ["pi", "target policy"],
      ["rho", "importance ratio"],
      ["q_hat", "estimated reward in the contextual-bandit formula"],
    ],
    assumptions: [
      "Known behavior action probabilities, common support wherever the target has positive probability, and integrability. The doubly robust display is a contextual-bandit estimator.",
    ],
    equations: [
      {
        name: "Trajectory ratio",
        tex: "\\rho(\\tau)=\\prod_t\\frac{\\pi(a_t\\mid s_t)}{\\mu(a_t\\mid s_t)}",
        explain:
          "The initial distribution and environment transition factors cancel when they are shared.",
      },
      {
        name: "Ordinary importance sampling",
        tex: "\\widehat J_{\\rm IS}=\\frac1n\\sum_i\\rho(\\tau_i)G_i",
        explain:
          "Unbiasedness requires the support/integrability assumptions. Products can have enormous variance.",
      },
      {
        name: "Self-normalized estimator",
        tex: "\\widehat J_{\\rm WIS}=\\frac{\\sum_i\\rho_iG_i}{\\sum_i\\rho_i}",
        explain:
          "Generally biased at finite sample size; consistency needs a nonzero denominator and suitable conditions.",
      },
      {
        name: "Doubly robust bandit estimate",
        tex: "\\widehat V_{\\rm DR}=\\frac1n\\sum_i\\left[\\sum_a\\pi(a\\mid s_i)\\widehat q(s_i,a)+\\frac{\\pi(a_i\\mid s_i)}{\\mu(a_i\\mid s_i)}(r_i-\\widehat q(s_i,a_i))\\right]",
        explain:
          "The correction offsets reward-model error when the propensities are correct; cross-fitting avoids problematic reuse of fitted nuisance estimates.",
      },
    ],
    derivation: {
      claim: "Prove the basic importance-sampling identity.",
      steps: [
        {
          text: "Expand under the behavior distribution.",
          tex: "\\mathbb E_\\mu[\\rho(\\tau)G(\\tau)]=\\int p_\\mu(\\tau)\\frac{p_\\pi(\\tau)}{p_\\mu(\\tau)}G(\\tau)\\,d\\tau",
        },
        {
          text: "Cancel only where behavior support is nonzero.",
          tex: "=\\int p_\\pi(\\tau)G(\\tau)\\,d\\tau",
        },
        {
          text: "Recognize the target expectation.",
          tex: "=\\mathbb E_\\pi[G(\\tau)]",
        },
      ],
    },
    example:
      "In a two-action bandit with behavior probabilities [0.8,0.2], target [0.2,0.8] and rewards [1,3], action ratios are [0.25,4]. The weighted expectation is 2.6, but single-sample variability is large.",
    pitfall:
      "A missing-support action cannot be repaired with an infinite ratio. An ordinary action ratio alone does not generally correct an arbitrary state-occupancy mismatch.",
    check: {
      question:
        "What fails if the target selects an action that has zero behavior probability?",
      options: [
        "The required support condition",
        "All Bellman equations",
        "The target reward must be zero",
      ],
      correct: 0,
      explanation:
        "No observed samples can identify the effect of that unsupported target action without additional assumptions.",
    },
    sources: ["dr-paper", "spin-pg"],
    scene: "importance",
    prerequisites: ["expectation", "policy-gradient"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "model-based",
    title: "Model-based RL, MPC and compounding errors",
    stage: "Frontiers & reward learning",
    summary:
      "MPC means Model Predictive Control. A learned dynamics model permits imagined rollouts, but planning can exploit its mistakes. Short-horizon replanning trades model bias against the need for a terminal value estimate.",
    symbols: [
      ["P_hat", "learned dynamics"],
      ["H", "planning horizon"],
      ["epsilon", "uniform one-step total-variation error"],
    ],
    assumptions: [
      "For the bound: identical bounded reward functions, fixed policy, 0 ≤ gamma < 1 and sup state/action TV(P,P_hat) ≤ epsilon.",
    ],
    equations: [
      {
        name: "MPC objective",
        tex: "\\max_{a_{0:H-1}}\\mathbb E_{\\widehat P}[\\sum_{k=0}^{H-1}\\gamma^kr_k+\\gamma^HV_\\phi(s_H)]",
        explain:
          "Execute only the first planned action, observe the true next state, then replan.",
      },
      {
        name: "Coupling illustration",
        tex: "\\Pr(\\text{some mismatch by }H)\\leq\\min(1,H\\epsilon)",
        explain: "A union bound does not require independent mismatch events.",
      },
      {
        name: "Discounted simulation bound",
        tex: "\\|V_P^\\pi-V_{\\widehat P}^\\pi\\|_\\infty\\leq\\frac{2\\gamma R_{\\max}\\epsilon}{(1-\\gamma)^2}",
        explain:
          "This worst-case bound is generally loose; learned models need not satisfy its uniform assumption.",
      },
      {
        name: "Model fitting",
        tex: "L_{\\rm model}=-\\mathbb E_{\\mathcal D}[\\log\\widehat P(s'\\mid s,a)]",
        explain:
          "Good likelihood on the data distribution does not prove accuracy at all planned states.",
      },
    ],
    derivation: {
      claim: "Derive the simulation bound for a fixed policy.",
      steps: [
        {
          text: "Subtract the two Bellman equations and add a mixed term.",
          tex: "\\Delta V=\\gamma P_\\pi\\Delta V+\\gamma(P_\\pi-\\widehat P_\\pi)V_{\\widehat P}^\\pi",
        },
        {
          text: "Use row stochasticity, TV-to-L1 and bounded values.",
          tex: "\\|\\Delta V\\|_\\infty\\leq\\gamma\\|\\Delta V\\|_\\infty+2\\gamma\\epsilon R_{\\max}/(1-\\gamma)",
        },
        {
          text: "Rearrange.",
          tex: "(1-\\gamma)\\|\\Delta V\\|_\\infty\\leq2\\gamma\\epsilon R_{\\max}/(1-\\gamma)",
        },
      ],
    },
    example:
      "In an independent-mismatch toy model with per-step error epsilon, the exact chance of any mismatch after H steps is 1−(1−epsilon)^H. The H epsilon union bound stays above it.",
    pitfall:
      "The mismatch-probability animation is an illustration, not a measured model error or the value bound itself.",
    check: {
      question: "What does MPC execute before observing the environment again?",
      options: [
        "The whole imagined trajectory without feedback",
        "Only the first action, then it replans",
        "No real action",
      ],
      correct: 1,
      explanation: "Receding-horizon feedback is the central MPC loop.",
    },
    sources: ["mbpo-paper", "spin-intro"],
    scene: "model-based",
    prerequisites: ["bellman", "function-approximation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "pomdp",
    title: "Partial observability and Bayesian belief states",
    stage: "Frontiers & reward learning",
    summary:
      "POMDP means Partially Observable Markov Decision Process. When the observation hides relevant state, a history-dependent policy or belief state is needed. A recurrent hidden vector is an approximation to this sufficient statistic, not automatically a calibrated belief.",
    symbols: [
      ["b_t(s)", "posterior belief over hidden states"],
      ["O(o|s)", "observation likelihood"],
      ["h_t", "history or recurrent memory"],
    ],
    assumptions: [
      "Known transition and observation models for the exact Bayes filter; a positive observation evidence denominator.",
    ],
    equations: [
      {
        name: "Prediction",
        tex: "\\bar b_{t+1}(s')=\\sum_sP(s'\\mid s,a_t)b_t(s)",
        explain:
          "Predict the hidden state before incorporating the new observation.",
      },
      {
        name: "Bayesian correction",
        tex: "b_{t+1}(s')=\\frac{O(o_{t+1}\\mid s')\\bar b_{t+1}(s')}{\\sum_uO(o_{t+1}\\mid u)\\bar b_{t+1}(u)}",
        explain: "Normalize the likelihood-weighted predicted belief.",
      },
      {
        name: "Belief policy",
        tex: "a_t\\sim\\pi(\\cdot\\mid b_t),\\qquad h_{t+1}=f_\\theta(h_t,o_{t+1},a_t)",
        explain:
          "A learned recurrent state is a practical alternative to an exact filter.",
      },
      {
        name: "Binary log-odds update",
        tex: "\\log\\frac{b_{t+1}(1)}{b_{t+1}(0)}=\\log\\frac{\\bar b_{t+1}(1)}{\\bar b_{t+1}(0)}+\\log\\frac{O(o\\mid1)}{O(o\\mid0)}",
        explain: "Evidence adds in log-odds space.",
      },
    ],
    derivation: {
      claim: "Derive belief normalization and the odds update.",
      steps: [
        {
          text: "Bayes gives a likelihood times a prior.",
          tex: "p(s'\\mid o,h,a)\\propto O(o\\mid s')\\bar b(s')",
        },
        {
          text: "Normalize with the evidence.",
          tex: "Z=\\sum_uO(o\\mid u)\\bar b(u),\\quad\\sum_{s'}b(s')=1",
        },
        {
          text: "Divide binary posteriors so the evidence cancels.",
          tex: "b(1)/b(0)=[\\bar b(1)/\\bar b(0)]\\,[O(o\\mid1)/O(o\\mid0)]",
        },
      ],
    },
    example:
      "For a fixed binary hidden state, prior 0.5 and independent repeated observations with likelihood ratio p/(1−p), n identical observations yield posterior odds (p/(1−p))^n.",
    pitfall:
      "Repeated correlated observations cannot be treated as independent evidence. A frame stack need not make an arbitrary POMDP fully observable.",
    check: {
      question: "What is the denominator in the Bayes belief update?",
      options: [
        "The evidence normalizing all possible hidden states",
        "The reward",
        "The policy learning rate",
      ],
      correct: 0,
      explanation: "It ensures the posterior probabilities sum to one.",
    },
    sources: ["pomdp-paper", "clean-trxl"],
    scene: "belief",
    prerequisites: ["mdp", "expectation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "offline-cql",
    title: "Offline RL, support mismatch and CQL",
    stage: "Frontiers & reward learning",
    summary:
      "CQL means Conservative Q-Learning. Offline RL cannot collect corrective data after exploiting a critic error. Conservative penalties target overly large values on actions poorly supported by a fixed dataset.",
    symbols: [
      ["mu_D", "dataset action distribution"],
      ["alpha", "conservatism coefficient"],
      ["D", "fixed offline dataset"],
    ],
    assumptions: [
      "The displayed penalty is for finite discrete actions; continuous CQL uses sampled/importance-weighted approximations.",
    ],
    equations: [
      {
        name: "Distribution-shift problem",
        tex: "\\max_a\\widehat Q(s,a)\\quad\\text{may select }a\\text{ with }\\mu_{\\mathcal D}(a\\mid s)\\approx0",
        explain: "A Bellman target can query an unsupported action repeatedly.",
      },
      {
        name: "Discrete CQL penalty",
        tex: "C(Q)=\\mathbb E_{s\\sim\\mathcal D}[\\log\\sum_a e^{Q(s,a)}-\\mathbb E_{a\\sim\\mu_D}Q(s,a)]",
        explain:
          "Compare a broad soft maximum to the dataset-supported values.",
      },
      {
        name: "Combined critic objective",
        tex: "L_{\\rm CQL}=L_{\\rm TD}+\\alpha C(Q)",
        explain:
          "The TD term anchors prediction accuracy; the penalty alone is invariant to a common Q shift.",
      },
      {
        name: "Regularizer gradient",
        tex: "\\frac{\\partial C}{\\partial Q(s,a)}=\\operatorname{softmax}(Q(s,\\cdot))_a-\\mu_D(a\\mid s)",
        explain:
          "An unsupported high-valued action has a positive gradient and is pushed down under descent.",
      },
    ],
    derivation: {
      claim: "Derive the penalty gradient for a fixed state.",
      steps: [
        {
          text: "Differentiate log-sum-exp.",
          tex: "\\partial_{Q_a}\\log\\sum_be^{Q_b}=e^{Q_a}/\\sum_be^{Q_b}",
        },
        {
          text: "Differentiate the dataset average.",
          tex: "\\partial_{Q_a}\\sum_b\\mu_D(b\\mid s)Q_b=\\mu_D(a\\mid s)",
        },
        {
          text: "Subtract.",
          tex: "\\partial_{Q_a}C=\\operatorname{softmax}(Q)_a-\\mu_D(a\\mid s)",
        },
      ],
    },
    example:
      "If dataset action frequencies are [0.8,0.2,0] but estimated Q=[0.5,1,3], the unsupported third action receives a strong downward regularizer step.",
    pitfall:
      "An empirical CQL penalty is not a universal certified lower bound for arbitrary neural networks. Excessive conservatism can also discard good actions.",
    check: {
      question:
        "Why is an unsupported action especially dangerous in offline RL?",
      options: [
        "The agent can always collect unlimited corrective data",
        "Its value can be extrapolated without corrective data collection",
        "It must have zero reward",
      ],
      correct: 1,
      explanation:
        "The fixed dataset cannot directly correct every newly exploited action.",
    },
    sources: ["cql-paper"],
    scene: "cql",
    prerequisites: ["dqn", "double-dueling"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "offline-iql",
    title: "IQL, expectile values and advantage-weighted cloning",
    stage: "Frontiers & reward learning",
    summary:
      "IQL means Implicit Q-Learning. IQL avoids maximizing the critic over unseen actions during value fitting. It learns an upper expectile of dataset action values and extracts a policy by weighted behavioral cloning.",
    symbols: [
      ["tau", "expectile level"],
      ["u", "residual Q−V"],
      ["beta", "positive policy-weight temperature"],
    ],
    assumptions: [
      "The basic illustration fixes two Q values with equal dataset probabilities. Stop gradients through weights in the policy loss.",
    ],
    equations: [
      {
        name: "Expectile loss",
        tex: "L_V=\\mathbb E_{(s,a)\\sim D}[|\\tau-\\mathbf1_{\\{u<0\\}}|u^2],\\quad u=Q(s,a)-V(s)",
        explain: "Positive residuals receive weight tau, negative ones 1−tau.",
      },
      {
        name: "Critic target",
        tex: "y=r+\\gamma bV_{\\bar\\phi}(s')",
        explain: "No explicit next-action maximum is needed in this target.",
      },
      {
        name: "Weighted cloning",
        tex: "L_\\pi=-\\mathbb E_D[\\exp((Q(s,a)-V(s))/\\beta)\\log\\pi_\\theta(a\\mid s)]",
        explain: "Practical implementations cap or stabilize the weights.",
      },
      {
        name: "Population policy analogy",
        tex: "\\pi^*(a\\mid s)\\propto\\mu_D(a\\mid s)e^{(Q(s,a)-V(s))/\\beta}",
        explain:
          "In this finite-state conditional optimum, the state-only V factor cancels under action normalization.",
      },
    ],
    derivation: {
      claim:
        "Solve the equal-probability two-point expectile problem Q in {0,2}.",
      steps: [
        {
          text: "For an interior value v, write the asymmetric objective.",
          tex: "L(v)=\\tfrac12(1-\\tau)v^2+\\tfrac12\\tau(2-v)^2",
        },
        {
          text: "Differentiate and set the result to zero.",
          tex: "(1-\\tau)v-\\tau(2-v)=0",
        },
        {
          text: "Solve.",
          tex: "v=2\\tau",
        },
      ],
    },
    example:
      "Tau=0.8 gives an expectile of 1.6 for equally likely values 0 and 2. Unlike a quantile, the expectile can lie strictly between the observed values.",
    pitfall:
      "An expectile is not a quantile. With fixed Q in a single state, changing only the state baseline does not change normalized advantage-weighted action probabilities.",
    check: {
      question:
        "For equally likely Q values 0 and 2, what is their tau=0.75 expectile?",
      options: ["0.75", "1.5", "2"],
      correct: 1,
      explanation: "The weighted first-order condition gives v=2 tau.",
    },
    sources: ["iql-paper"],
    scene: "iql",
    prerequisites: ["offline-cql"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "imitation",
    title: "Imitation learning, behavioral cloning and GAIL",
    stage: "Frontiers & reward learning",
    summary:
      "GAIL means Generative Adversarial Imitation Learning; DAgger means Dataset Aggregation. Learning expert actions is not the same as optimizing environment rewards. Distribution shift across a rollout explains why a small supervised error can still lead to poor long-horizon behavior.",
    symbols: [
      ["pi_E", "expert policy"],
      ["d_E", "expert state distribution"],
      ["D(s,a)", "discriminator probability that a pair is expert-generated"],
      ["epsilon", "per-step classification error on expert-like states"],
    ],
    assumptions: [
      "Population behavioral-cloning identity conditions on covered states. The compounding-error bound assumes per-step loss in [0, 1], zero loss before the first mistake, and probability of a first mistake at each step at most epsilon. It is a union-bound illustration, not measured performance.",
    ],
    equations: [
      {
        name: "Behavioral cloning",
        tex: "L_{\\rm BC}=-\\mathbb E_{s\\sim d_E,a\\sim\\pi_E}[\\log\\pi_\\theta(a\\mid s)]",
        explain:
          "The expert’s state distribution can differ from the learner’s rollout distribution.",
      },
      {
        name: "Sequential error bound illustration",
        tex: "\\mathbb E[L_T]\\leq\\sum_{t=1}^T\\min(1,t\\epsilon)=O(T^2\\epsilon)",
        explain:
          "A first mistake can shift subsequent states. This is a worst-case upper-bound scaling.",
      },
      {
        name: "Expert-labeled dataset aggregation",
        tex: "\\mathcal D_{k+1}=\\mathcal D_k\\cup\\{(s, a_E(s)):s\\sim d_{\\pi_k}\\}",
        explain:
          "DAgger collects expert labels on learner-visited states; access to that expert is an additional assumption.",
      },
      {
        name: "Adversarial imitation discriminator",
        tex: "\\max_D\\ \\mathbb E_{\\pi_E}\\log D(s,a)+\\mathbb E_\\pi\\log(1-D(s,a))",
        explain:
          "With D defined as expert probability, the policy can use reward −log(1−D). GAIL still needs a policy optimizer and suitable rollouts.",
      },
    ],
    derivation: {
      claim:
        "Explain the covered-state behavioral-cloning optimum using cross-entropy.",
      steps: [
        {
          text: "Condition on a state represented in the expert data.",
          tex: "L_s=-\\sum_a\\pi_E(a\\mid s)\\log\\pi_\\theta(a\\mid s)",
        },
        {
          text: "Add and subtract the expert entropy.",
          tex: "L_s=\\mathcal H(\\pi_E(\\cdot\\mid s))+D_{\\rm KL}(\\pi_E(\\cdot\\mid s)\\|\\pi_\\theta(\\cdot\\mid s))",
        },
        {
          text: "Use nonnegative KL divergence.",
          tex: "L_s\\geq\\mathcal H(\\pi_E),\\quad\\text{equality if }\\pi_\\theta=\\pi_E\\text{ on its support}",
        },
      ],
    },
    example:
      "At epsilon=0.1 and horizon 10, the union-bound sum is 0.1+0.2+…+1=5.5 expected loss units. It is a bound, not a prediction that exactly 5.5 mistakes will occur.",
    pitfall:
      "A perfect fit to covered expert states says nothing by itself about unseen states. A linear T epsilon reference is not an unconditional guarantee that any DAgger run achieves that loss.",
    check: {
      question:
        "Which states does DAgger specifically ask the expert to label?",
      options: [
        "Only states from the original expert demonstrations",
        "States visited by the current learner",
        "All possible states without querying anyone",
      ],
      correct: 1,
      explanation:
        "It addresses the learner’s induced distribution rather than only the original expert distribution.",
    },
    sources: ["hf-imitation", "dagger-paper", "gail-paper"],
    scene: "imitation",
    prerequisites: ["policy-gradient", "offline-iql"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "multi-agent",
    title: "Multi-agent RL, Markov games and Nash reasoning",
    stage: "Frontiers & reward learning",
    summary:
      "Other learning agents make the effective environment nonstationary. Cooperative learning, independent learning and zero-sum equilibrium reasoning have different objectives.",
    symbols: [
      ["bold a", "joint action"],
      ["pi_i", "policy of player i"],
      ["J_i", "player i’s return"],
      ["pi_minus_i", "the other players’ policies"],
    ],
    assumptions: [
      "The product policy display assumes conditionally independent decentralized action choices. The animation is a one-step two-player zero-sum matching-pennies game. Condition on joint observations, or include them in s, for the product-policy display.",
    ],
    equations: [
      {
        name: "Joint policy and returns",
        tex: "\\pi(\\mathbf a\\mid s)=\\prod_i\\pi_i(a_i\\mid o_i),\\qquad J_i=\\mathbb E_\\pi\\sum_t\\gamma^tr_{i,t}",
        explain:
          "A correlated joint policy needs a different factorization; observations may differ by player.",
      },
      {
        name: "Nash best-response condition",
        tex: "J_i(\\pi_i^*,\\pi_{-i}^*)\\geq J_i(\\pi_i,\\pi_{-i}^*)\\quad\\text{for every unilateral deviation }\\pi_i",
        explain:
          "No one player benefits from changing policy while the others remain fixed.",
      },
      {
        name: "Zero-sum objective",
        tex: "\\max_{\\pi_1}\\min_{\\pi_2}J_1(\\pi_1,\\pi_2),\\qquad J_2=-J_1",
        explain:
          "A cooperative shared-return objective is not this zero-sum game.",
      },
      {
        name: "Centralized-training actor loss",
        tex: "L_{\\pi_i}=-\\mathbb E[\\log\\pi_i(a_i\\mid o_i)\\operatorname{sg}(\\widehat A_i(s,\\mathbf a))]",
        explain:
          "A centralized critic may use training-time global information while the deployed actor uses only local observations.",
      },
    ],
    derivation: {
      claim: "Prove the uniform mixed strategy is minimax in matching pennies.",
      steps: [
        {
          text: "Let q and p be the two players’ probabilities of choosing heads.",
          tex: "V(q,p)=(2q-1)(2p-1)",
        },
        {
          text: "Uniform q makes every opponent strategy yield zero.",
          tex: "V(1/2,p)=0\\quad\\text{for all }p",
        },
        {
          text: "Any other q has a nonpositive worst case.",
          tex: "\\min_{p\\in[0,1]}V(q,p)=-|2q-1|\\leq0",
        },
      ],
    },
    example:
      "Always choosing heads can be exploited by an opponent choosing tails. Mixing evenly protects a worst-case value of zero, even though no action is individually best against every opponent.",
    pitfall:
      "Independent single-agent policy gradients need not converge to a Nash equilibrium. Do not leak centralized critic observations into a supposedly decentralized deployment.",
    check: {
      question: "What is protected by the Nash condition?",
      options: [
        "No profitable unilateral deviation with opponents fixed",
        "Every player gets the maximum possible reward simultaneously",
        "The environment becomes stationary while all agents learn",
      ],
      correct: 0,
      explanation:
        "Equilibrium is a mutual best-response condition, not a promise of globally optimal rewards.",
    },
    sources: ["hf-multi", "markov-games-paper"],
    scene: "multi-agent",
    prerequisites: ["mdp", "policy-gradient"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "reward-shaping",
    title: "Potential-based shaping and reward hacking",
    stage: "Frontiers & reward learning",
    summary:
      "A potential difference can densify feedback while preserving discounted returns up to a state-dependent constant under the right boundary condition. Arbitrary reward bonuses do not share this property.",
    symbols: [
      ["Phi", "state potential"],
      ["r′", "shaped reward"],
      ["T", "episode length"],
    ],
    assumptions: [
      "Use the same discount in shaping and returns. For finite episodes require terminal Phi=0, or explicitly retain its boundary term. For infinite horizons assume bounded Phi and gamma<1.",
    ],
    equations: [
      {
        name: "Potential shaping",
        tex: "r'_t=r_t+\\gamma\\Phi(s_{t+1})-\\Phi(s_t)",
        explain:
          "The potential depends on states and is fixed for the comparison.",
      },
      {
        name: "Finite telescope",
        tex: "G'_0-G_0=-\\Phi(s_0)+\\gamma^T\\Phi(s_T)",
        explain: "The terminal boundary term must not be silently omitted.",
      },
      {
        name: "Infinite-horizon limit",
        tex: "G'_0=G_0-\\Phi(s_0)",
        explain:
          "The tail potential vanishes under the stated boundedness condition.",
      },
      {
        name: "Action-value shift",
        tex: "Q'^\\pi(s,a)=Q^\\pi(s,a)-\\Phi(s)",
        explain:
          "At a fixed state the same offset applies to all actions, preserving greedy comparisons.",
      },
    ],
    derivation: {
      claim: "Prove the shaping telescope.",
      steps: [
        {
          text: "Expand the difference of shaped and original returns.",
          tex: "G'_0-G_0=\\sum_{t=0}^{T-1}\\gamma^t[\\gamma\\Phi(s_{t+1})-\\Phi(s_t)]",
        },
        {
          text: "Shift the first sum’s index.",
          tex: "=\\sum_{t=1}^{T}\\gamma^t\\Phi(s_t)-\\sum_{t=0}^{T-1}\\gamma^t\\Phi(s_t)",
        },
        {
          text: "Cancel interior terms.",
          tex: "=-\\Phi(s_0)+\\gamma^T\\Phi(s_T)",
        },
      ],
    },
    example:
      "For potentials [3,2,1,0], every complete finite trajectory receives the same return offset −3 from its starting state, regardless of gamma.",
    pitfall:
      "Uncontrolled terminal potentials, mismatched discounts or a changing learned potential can invalidate this simple preservation proof. Proxy rewards can be gamed.",
    check: {
      question: "Which boundary term remains for a finite episode?",
      options: [
        "gamma^T Phi(s_T)",
        "Only the average reward",
        "No boundary term under any conditions",
      ],
      correct: 0,
      explanation:
        "The final potential survives unless the boundary assumption removes it.",
    },
    sources: ["shaping-paper", "spin-intro"],
    scene: "shaping",
    prerequisites: ["returns", "bellman"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "rlhf",
    title: "Preference rewards, KL regularization and RLHF",
    stage: "Frontiers & reward learning",
    summary:
      "RLHF means Reinforcement Learning from Human Feedback. A learned preference reward and a reference policy solve different problems. The reward predicts comparisons; the KL term controls movement away from the reference distribution.",
    symbols: [
      ["q", "reference distribution"],
      ["R", "fixed scalar reward"],
      ["beta", "positive KL penalty coefficient"],
    ],
    assumptions: [
      "For the analytic solution: finite actions/responses, q_i>0, beta>0 and fixed rewards. Sequence RL adds autoregressive sampling and credit assignment.",
    ],
    equations: [
      {
        name: "Bradley–Terry preference model",
        tex: "P(y_w\\succ y_l\\mid x)=\\sigma(R_\\phi(x,y_w)-R_\\phi(x,y_l))",
        explain:
          "Pairwise labels constrain reward differences, not an absolute calibrated quality score.",
      },
      {
        name: "KL-regularized policy objective",
        tex: "J(\\pi)=\\sum_i\\pi_iR_i-\\beta\\sum_i\\pi_i\\log(\\pi_i/q_i)",
        explain: "Specify the KL direction: policy relative to reference.",
      },
      {
        name: "Exact finite optimum",
        tex: "\\pi_i^*=\\frac{q_i e^{R_i/\\beta}}{\\sum_jq_j e^{R_j/\\beta}}",
        explain:
          "Reference support matters: mass outside q’s support would have infinite KL.",
      },
      {
        name: "Optimal objective",
        tex: "J(\\pi^*)=\\beta\\log\\sum_iq_i e^{R_i/\\beta}",
        explain: "Compute log-sum-exp stably for small beta.",
      },
    ],
    derivation: {
      claim: "Derive the exact regularized finite-response optimum.",
      steps: [
        {
          text: "Add the normalization multiplier and differentiate.",
          tex: "R_i-\\beta[\\log(\\pi_i/q_i)+1]+\\nu=0",
        },
        {
          text: "Exponentiate.",
          tex: "\\pi_i=q_i\\exp(R_i/\\beta)\\exp(\\nu/\\beta-1)",
        },
        {
          text: "Choose the common constant so probabilities sum to one.",
          tex: "\\pi_i^*=q_i e^{R_i/\\beta}/Z",
        },
      ],
    },
    example:
      "For reference [0.6,0.3,0.1] and rewards [0,1,2], a small beta favors the high-reward third response strongly, while a larger beta keeps more reference mass.",
    pitfall:
      "A pairwise reward model can be miscalibrated or exploitably wrong. The bandit optimum here is not a claim that an LLM training run exactly solves this objective.",
    check: {
      question:
        "If the reference assigns zero probability to an action, what does forward KL regularization imply?",
      options: [
        "Positive mass there has infinite KL",
        "The action becomes free to select",
        "The KL is negative",
      ],
      correct: 0,
      explanation:
        "Absolute continuity with respect to the reference is required for finite policy-to-reference KL.",
    },
    sources: ["rlhf-paper", "spin-ppo"],
    scene: "rlhf",
    prerequisites: ["policy-gradient", "sac"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "dpo",
    title: "DPO: preference learning through log-ratios",
    stage: "Frontiers & reward learning",
    summary:
      "DPO means Direct Preference Optimization. DPO converts an idealized KL-regularized policy relation into a preference classification loss. It typically trains on offline response pairs rather than interacting with an environment.",
    symbols: [
      ["y_w,y_l", "preferred and rejected responses"],
      ["Delta", "difference in policy/reference log-ratios"],
      ["beta", "KL-derived preference scaling coefficient"],
    ],
    assumptions: [
      "Paired preferences, fixed reference and shared support. The reward reparameterization is motivated by the regularized optimum, not an unconditional guarantee of reward correctness.",
    ],
    equations: [
      {
        name: "Implicit reward relation",
        tex: "R(x,y)=\\beta\\log\\frac{\\pi^*(y\\mid x)}{q(y\\mid x)}+\\beta\\log Z(x)",
        explain:
          "The prompt-only normalization constant cancels between two responses.",
      },
      {
        name: "Preference logit",
        tex: "z=\\beta\\left[\\log\\frac{\\pi_\\theta(y_w\\mid x)}{q(y_w\\mid x)}-\\log\\frac{\\pi_\\theta(y_l\\mid x)}{q(y_l\\mid x)}\\right]=\\beta\\Delta",
        explain:
          "Response log probabilities are sums of token log probabilities under the chosen sequence convention.",
      },
      {
        name: "DPO loss",
        tex: "L_{\\rm DPO}=-\\mathbb E\\log\\sigma(\\beta\\Delta)",
        explain:
          "This is a binary preference likelihood loss, not a clipped PPO objective.",
      },
      {
        name: "Margin derivative",
        tex: "\\frac{\\partial\\ell}{\\partial\\Delta}=-\\beta\\sigma(-\\beta\\Delta)",
        explain:
          "The update raises the preferred relative log-ratio margin when minimizing the loss.",
      },
    ],
    derivation: {
      claim: "Derive the preference likelihood and loss derivative.",
      steps: [
        {
          text: "Substitute the implicit reward relation into a reward difference.",
          tex: "R_w-R_l=\\beta[\\log(\\pi_w/q_w)-\\log(\\pi_l/q_l)]",
        },
        {
          text: "Use the Bradley–Terry likelihood.",
          tex: "P(y_w\\succ y_l\\mid x)=\\sigma(\\beta\\Delta)",
        },
        {
          text: "Differentiate the negative log likelihood.",
          tex: "\\partial_\\Delta[-\\log\\sigma(\\beta\\Delta)]=-\\beta[1-\\sigma(\\beta\\Delta)]",
        },
      ],
    },
    example:
      "At margin Delta=0, the preference probability is 0.5 and loss is log 2. Increasing a correct preferred margin reduces the loss.",
    pitfall:
      "DPO is not synonymous with online RL, and reference support, label noise and out-of-distribution preference generalization still matter.",
    check: {
      question:
        "What cancels in the preferred-minus-rejected implicit reward difference?",
      options: [
        "The prompt-only log normalization constant",
        "All model parameters",
        "The chosen response probability",
      ],
      correct: 0,
      explanation: "Both responses share beta log Z(x).",
    },
    sources: ["dpo-paper", "rlhf-paper"],
    scene: "dpo",
    prerequisites: ["rlhf"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "rubric-grpo",
    title: "Rubric rewards, group-relative advantages and GRPO",
    stage: "Frontiers & reward learning",
    summary:
      "GRPO means Group Relative Policy Optimization. A rubric defines a scoring rule; GRPO defines a group-relative policy update. Keeping these layers separate makes zero-variance groups, hard gates and reward hacking visible.",
    symbols: [
      ["c_j,w_j", "criterion scores and nonnegative weights"],
      ["g", "hard gate"],
      ["G", "number of sampled responses"],
      ["s_R", "population standard deviation within the group"],
    ],
    assumptions: [
      "Criterion scores lie in [0,1], total weight is positive, g is 0 or 1, group statistics are detached, and old/reference policies have compatible support.",
    ],
    equations: [
      {
        name: "Normalized gated rubric",
        tex: "R_i=g_i\\frac{\\sum_jw_jc_{ij}}{\\sum_jw_j},\\quad w_j\\geq0,\\quad\\sum_jw_j>0",
        explain:
          "A hard gate changes the group’s reward distribution; it is not a soft criterion weight.",
      },
      {
        name: "Group-relative advantage",
        tex: "\\bar R=\\frac1G\\sum_iR_i,\\quad s_R^2=\\frac1G\\sum_i(R_i-\\bar R)^2,\\quad A_i=\\frac{R_i-\\bar R}{s_R+\\epsilon}",
        explain:
          "An equal-reward group has zero advantages. Epsilon prevents division by zero.",
      },
      {
        name: "Token-level clipped objective",
        tex: "L=\\mathbb E\\frac1G\\sum_i\\frac1{T_i}\\sum_t[\\min(r_{it}A_i,\\operatorname{clip}(r_{it},1-\\eta,1+\\eta)A_i)-\\beta D_{it}]",
        explain:
          "Here r_it is the current/old token probability ratio. Length weighting and KL details vary by implementation.",
      },
      {
        name: "Nonnegative KL sample expression",
        tex: "D_{it}=e^{d_{it}}-d_{it}-1,\\quad d_{it}=\\log\\pi_{\\rm ref}(y_{it}\\mid h)-\\log\\pi_\\theta(y_{it}\\mid h)",
        explain:
          "Its expectation equals policy-to-reference KL when sampled under the current policy with proper support; old-policy rollout averages need appropriate treatment.",
      },
    ],
    derivation: {
      claim: "Prove zero-centered group advantages and bounded rubric rewards.",
      steps: [
        {
          text: "Use the weighted-average bounds and binary gate.",
          tex: "0\\leq\\sum_jw_jc_{ij}/\\sum_jw_j\\leq1\\implies0\\leq R_i\\leq1",
        },
        {
          text: "Sum centered rewards.",
          tex: "\\sum_i(R_i-\\bar R)=\\sum_iR_i-G\\bar R=0",
        },
        {
          text: "Divide by the shared positive normalizer.",
          tex: "\\sum_iA_i=0,\\qquad s_R=0\\implies A_i=0",
        },
      ],
    },
    example:
      "Rewards [0.2,0.5,0.8] have mean 0.5 and population standard deviation sqrt(0.06). Their normalized advantages are approximately [−1.225,0,1.225].",
    pitfall:
      "A single sample or constant-reward group supplies no group-relative reward gradient. An exponential KL expression being nonnegative per sample does not make an arbitrary old-policy average an exact KL.",
    check: {
      question:
        "What happens when every sampled response receives the same reward?",
      options: [
        "All group-relative advantages are zero",
        "All advantages are positive one",
        "The policy must improve automatically",
      ],
      correct: 0,
      explanation: "Centering removes a constant reward within the group.",
    },
    sources: ["grpo-paper", "ppo-paper"],
    scene: "grpo",
    prerequisites: ["ppo", "rlhf"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "constrained-rl",
    title: "Constrained RL and Lagrange multipliers",
    stage: "Frontiers & reward learning",
    summary:
      "Expected reward and expected cost are different signals. A Lagrange multiplier adapts how much the policy is penalized for exceeding a cost budget.",
    symbols: [
      ["J_R,J_C", "expected discounted reward and cost"],
      ["d", "cost budget"],
      ["lambda", "nonnegative dual multiplier"],
    ],
    assumptions: [
      "The constraint is in expectation. Neural policy optimization is generally nonconvex, so strong duality or exact constraint satisfaction cannot be assumed.",
    ],
    equations: [
      {
        name: "Constrained problem",
        tex: "\\max_\\theta J_R(\\theta)\\quad\\text{s.t.}\\quad J_C(\\theta)\\leq d",
        explain:
          "A mean budget is not a per-trajectory or per-state hard safety guarantee.",
      },
      {
        name: "Lagrangian",
        tex: "\\mathcal L(\\theta,\\lambda)=J_R(\\theta)-\\lambda(J_C(\\theta)-d),\\quad\\lambda\\geq0",
        explain:
          "The actor maximizes and the dual variable minimizes this Lagrangian.",
      },
      {
        name: "Actor step",
        tex: "\\theta^+=\\theta+\\alpha[\\nabla J_R-\\lambda\\nabla J_C]",
        explain: "The multiplier scales the cost gradient.",
      },
      {
        name: "Projected dual step",
        tex: "\\lambda^+=[\\lambda+\\eta(J_C-d)]_+",
        explain:
          "Budget violations increase the penalty; projection keeps it nonnegative.",
      },
    ],
    derivation: {
      claim: "Derive the sign of the multiplier update.",
      steps: [
        {
          text: "Differentiate with respect to the dual variable.",
          tex: "\\partial_\\lambda\\mathcal L=-(J_C-d)",
        },
        {
          text: "Descend in lambda, unlike ascent in actor parameters.",
          tex: "\\lambda-\\eta\\partial_\\lambda\\mathcal L=\\lambda+\\eta(J_C-d)",
        },
        {
          text: "Project onto the feasible multiplier domain.",
          tex: "\\lambda^+=\\max(0,\\lambda+\\eta(J_C-d))",
        },
      ],
    },
    example:
      "Two actions have rewards [1,3] and costs [0.1,1]. Their penalized values cross at lambda=2/0.9. Before that crossing a greedy penalty-based choice can violate a budget of 0.4.",
    pitfall:
      "Hard gates in a rubric do not automatically enforce a physical safety constraint. Expected costs and tail risks require different guarantees.",
    check: {
      question:
        "If observed expected cost exceeds the budget, what does the dual update do?",
      options: ["Decrease lambda", "Increase lambda", "Make lambda negative"],
      correct: 1,
      explanation: "The positive budget violation raises the cost penalty.",
    },
    sources: ["cpo-paper"],
    scene: "safety",
    prerequisites: ["policy-gradient", "rlhf"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
  {
    id: "evaluation",
    title: "Evaluation, uncertainty and reproducible comparisons",
    stage: "Evaluation",
    summary:
      "An algorithm’s reported return depends on seeds, environment versions and evaluation protocol. Uncertainty is part of a scientific claim, not a decoration on a best run.",
    symbols: [
      ["n", "independent evaluation seeds"],
      ["s", "sample standard deviation"],
      ["SE", "standard error of a mean"],
    ],
    assumptions: [
      "For the Student interval, independent identically distributed Gaussian observations give exact finite-sample coverage. Large-sample approximations or suitable resampling need their own assumptions.",
    ],
    equations: [
      {
        name: "Mean and sample variance",
        tex: "\\bar X=\\frac1n\\sum_iX_i,\\quad s^2=\\frac1{n-1}\\sum_i(X_i-\\bar X)^2",
        explain: "Use n−1 for sample variance; n must exceed one.",
      },
      {
        name: "Standard error",
        tex: "\\operatorname{SE}(\\bar X)=s/\\sqrt n",
        explain:
          "The standard error of a mean is not the standard deviation of individual outcomes.",
      },
      {
        name: "Student confidence interval",
        tex: "\\bar X\\pm t_{n-1,0.975}\\,s/\\sqrt n",
        explain:
          "Under its assumptions, the procedure has 95% repeated-sampling coverage.",
      },
      {
        name: "Paired comparison",
        tex: "D_i=X_i-Y_i,\\quad\\operatorname{Var}(D)=\\operatorname{Var}(X)+\\operatorname{Var}(Y)-2\\operatorname{Cov}(X,Y)",
        explain:
          "Shared seeds/tasks can reduce comparison noise when the pairing is meaningful.",
      },
    ],
    derivation: {
      claim: "Derive the 1/sqrt(n) uncertainty scaling for independent runs.",
      steps: [
        {
          text: "Expand the variance of the average.",
          tex: "\\operatorname{Var}(\\bar X)=\\frac1{n^2}\\sum_i\\operatorname{Var}(X_i)",
        },
        {
          text: "Use identical variance and zero cross-covariance.",
          tex: "=\\sigma^2/n",
        },
        {
          text: "Take a square root.",
          tex: "\\operatorname{SD}(\\bar X)=\\sigma/\\sqrt n",
        },
      ],
    },
    example:
      "The animation uses one reproducible Gaussian experiment with known population standard deviation 2. It displays a normal interval with margin 1.96×2/sqrt(n), not a measured RL benchmark.",
    pitfall:
      "Correlated seeds, heavy-tailed returns and selecting the best hyperparameter run can invalidate a naive interval. Reserve evaluation data and report the protocol, budget and failures.",
    check: {
      question:
        "If you want to halve a mean’s standard error under the same independent-run variance, how many runs do you need?",
      options: ["Twice as many", "Four times as many", "Half as many"],
      correct: 1,
      explanation: "Standard error scales as 1/sqrt(n).",
    },
    sources: ["evaluation-paper", "precipice-paper", "cleanrl"],
    scene: "evaluation",
    prerequisites: ["expectation"],
    practice:
      "Re-derive the displayed result without looking, then implement the numerical example using standard Python.",
  },
];
