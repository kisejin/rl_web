// Original from-scratch Python exercises and mathematical proof editorials.
export const atlasLabData = [
  {
    id: "atlas-mdp",
    atlasTopic: "mdp",
    title: "Build the Policy Transition Kernel",
    level: "Easy",
    topic: "",
    minutes: 25,
    hybrid: true,
    fn: "policy_kernel",
    args: "policy, transitions",
    desc: "Combine a stochastic policy with action-conditioned dynamics to construct the induced Markov chain. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "policy[s][a] is nonnegative with each row summing to one. transitions[s][a][next_state] is a stochastic row. There is at least one state and one action per state.",
    output:
      "Return a nested list P_pi[s][next_state]. Do not mutate either input.",
    equation: "P_\\pi(s,s\\prime)=\\sum_a\\pi(a\\mid s)P(s\\prime\\mid s,a)",
    hint: "Allocate an S-by-S array and accumulate one weighted transition row for each action.",
    solution:
      "def policy_kernel(policy, transitions):\n    n = len(policy)\n    result = [[0.0 for _ in range(n)] for _ in range(n)]\n    for s in range(n):\n        for a in range(len(policy[s])):\n            for ns in range(n):\n                result[s][ns] += policy[s][a] * transitions[s][a][ns]\n    return result",
    tests: [
      {
        args: [
          [
            [0.25, 0.75],
            [1, 0],
          ],
          [
            [
              [1, 0],
              [0, 1],
            ],
            [
              [0.5, 0.5],
              [0, 1],
            ],
          ],
        ],
        expected: [
          [0.25, 0.75],
          [0.5, 0.5],
        ],
      },
      {
        args: [[[1]], [[[1]]]],
        expected: [[1]],
      },
      {
        args: [
          [
            [0, 1],
            [0.5, 0.5],
          ],
          [
            [
              [1, 0],
              [0.2, 0.8],
            ],
            [
              [1, 0],
              [0, 1],
            ],
          ],
        ],
        expected: [
          [0.2, 0.8],
          [0.5, 0.5],
        ],
      },
    ],
    proof:
      "Prove that the induced policy transition kernel is row-stochastic. Prove the displayed identity under the stated assumptions: \\[P_\\pi(s,s\\prime)=\\sum_a\\pi(a\\mid s)P(s\\prime\\mid s,a)\\]",
    proofSteps: [
      {
        text: "Expand a row sum and interchange finite sums.",
        tex: "\\sum_{s\\prime}P_\\pi(s,s\\prime)=\\sum_a\\pi(a\\mid s)\\sum_{s\\prime}P(s\\prime\\mid s,a)",
      },
      {
        text: "Normalize each action-conditioned row.",
        tex: "=\\sum_a\\pi(a\\mid s)\\cdot1",
      },
      {
        text: "Normalize the policy and note nonnegativity.",
        tex: "\\sum_{s\\prime}P_\\pi(s,s\\prime)=1,\\quad P_\\pi(s,s\\prime)\\geq0",
      },
    ],
    checks: [
      "I stated nonnegative normalized policy and transition rows.",
      "I interchanged finite sums and normalized each dynamics row.",
      "I proved both row normalization and nonnegativity, not just one.",
    ],
    complexity: "O(S²A) time, O(S²) output space for A actions per state.",
    example:
      "policy_kernel([[0.25, 0.75], [1, 0]], [[[1, 0], [0, 1]], [[0.5, 0.5], [0, 1]]]) → [[0.25, 0.75], [0.5, 0.5]]",
  },
  {
    id: "atlas-monte-carlo-td",
    atlasTopic: "monte-carlo-td",
    title: "n-Step Targets with Terminal Masks",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "n_step_targets",
    args: "rewards, values, terminals, gamma, n",
    desc: "Compute a bootstrapped n-step target at every position of a finite rollout. A true terminal cuts the return; an ordinary rollout boundary still bootstraps. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "rewards and terminals have length T; values has length T+1. terminals[t] is true only for a task terminal after reward[t]. n >= 1; 0 <= gamma <= 1. Values and rewards are finite.",
    output:
      "Return T targets. Include at most n rewards, stop at a true terminal, and otherwise bootstrap with the value at the reached boundary. Empty rollout returns [].",
    equation:
      "G_t^{(h)}=\\sum_{k=0}^{h-1}\\gamma^k r_{t+k}+\\gamma^h b_{t:t+h}V_{t+h}",
    hint: "For each t, multiply a running discount after each reward. A terminal disables only the bootstrap beyond that terminal.",
    solution:
      "def n_step_targets(rewards, values, terminals, gamma, n):\n    result = []\n    T = len(rewards)\n    for t in range(T):\n        total, discount, end, stopped = 0.0, 1.0, t, False\n        for k in range(t, min(T, t + n)):\n            total += discount * rewards[k]\n            discount *= gamma\n            end = k + 1\n            if terminals[k]:\n                stopped = True\n                break\n        if not stopped:\n            total += discount * values[end]\n        result.append(total)\n    return result",
    tests: [
      {
        args: [[1, 2], [10, 20, 30], [false, false], 0.5, 2],
        expected: [9.5, 17],
      },
      {
        args: [[1, 2], [10, 20, 30], [true, false], 0.5, 3],
        expected: [1, 17],
      },
      {
        args: [[1, -2], [0, 4, 8], [false, true], 0, 1],
        expected: [1, -2],
      },
      {
        args: [[], [7], [], 0.9, 4],
        expected: [],
      },
    ],
    proof:
      "Derive the target by unrolling the one-step recurrence and explain the terminal and rollout-boundary cases. Prove the displayed identity under the stated assumptions: \\[G_t^{(h)}=\\sum_{k=0}^{h-1}\\gamma^k r_{t+k}+\\gamma^h b_{t:t+h}V_{t+h}\\]",
    proofSteps: [
      {
        text: "Start with the one-step reward plus masked continuation.",
        tex: "G_t^{(1)}=r_t+\\gamma b_t V_{t+1}",
      },
      {
        text: "Substitute a second recurrence; terminal masks multiply.",
        tex: "G_t^{(2)}=r_t+\\gamma b_t r_{t+1}+\\gamma^2b_tb_{t+1}V_{t+2}",
      },
      {
        text: "Continue until h rewards or a terminal; a nonterminal boundary retains the final value.",
        tex: "G_t^{(h)}=\\sum_{k=0}^{h-1}\\gamma^k\\left(\\prod_{j=0}^{k-1}b_{t+j}\\right)r_{t+k}+\\gamma^h\\left(\\prod_{j=0}^{h-1}b_{t+j}\\right)V_{t+h}",
      },
    ],
    checks: [
      "I derived the recurrence rather than copying the sum.",
      "I stopped rewards at the first true terminal and removed its bootstrap.",
      "I retained the bootstrap at a nonterminal rollout boundary and checked gamma zero.",
    ],
    complexity: "O(T min(n,T)) time and O(T) output space.",
    example:
      "n_step_targets([1, 2], [10, 20, 30], [False, False], 0.5, 2) → [9.5, 17]",
  },
  {
    id: "atlas-exploration",
    atlasTopic: "exploration",
    title: "UCB Scores and Unvisited Arms",
    level: "Easy",
    topic: "",
    minutes: 25,
    hybrid: true,
    fn: "ucb_scores",
    args: "means, counts, total, c",
    desc: "Compute a deterministic UCB action score vector. Use null (Python None) to mark an unvisited arm rather than returning infinity, so outputs remain JSON-compatible. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty means/counts arrays. Counts are nonnegative integers; total >= max(1, sum(counts)); c >= 0. Means are finite.",
    output:
      "For positive count return mean + c*sqrt(log(total)/count). For zero count return None. An action selector should visit unvisited arms before comparing numerical scores.",
    equation: "U(a)=\\widehat\\mu_a+c\\sqrt{\\frac{\\log t}{N_a}},\\quad N_a>0",
    hint: "Handle count zero before division. The optimistic confidence interpretation additionally assumes bounded independent bandit rewards.",
    solution:
      "def ucb_scores(means, counts, total, c):\n    import math\n    return [None if n == 0 else mean + c * math.sqrt(math.log(total) / n)\n            for mean, n in zip(means, counts)]",
    tests: [
      {
        args: [[0.2, 0.8], [0, 2], 2, 0],
        expected: [null, 0.8],
      },
      {
        args: [[0, 0], [1, 4], 5, 1],
        expected: [1.2686362411795196, 0.6343181205897598],
      },
      {
        args: [[3], [1], 1, 2],
        expected: [3],
      },
      {
        args: [[-2, 4], [2, 3], 5, 0],
        expected: [-2, 4],
      },
    ],
    proof:
      "For independent rewards in [0,1], derive a confidence radius from Hoeffding and explain how it motivates the displayed score. Prove the displayed identity under the stated assumptions: \\[U(a)=\\widehat\\mu_a+c\\sqrt{\\frac{\\log t}{N_a}},\\quad N_a>0\\]",
    proofSteps: [
      {
        text: "Apply the two-sided bounded-reward tail inequality.",
        tex: "\\Pr(|\\widehat\\mu_N-\\mu|\\geq u)\\leq2e^{-2Nu^2}",
      },
      {
        text: "Set the right side to delta and solve for u.",
        tex: "u=\\sqrt{\\frac{\\log(2/\\delta)}{2N}}",
      },
      {
        text: "A time-dependent delta makes the radius scale like sqrt(log(t)/N); the score constant controls that choice.",
        tex: "\\delta_t=2t^{-2c^2}\\ \\Longrightarrow\\ u=c\\sqrt{\\log t/N}",
      },
    ],
    checks: [
      "I stated independent rewards in [0,1] for the tail inequality.",
      "I solved the exponential inequality for the radius.",
      "I distinguished a per-arm fixed-sample bound from an all-time adaptive guarantee and handled unvisited arms.",
    ],
    complexity: "O(A) time and O(A) output space.",
    example: "ucb_scores([0.2, 0.8], [0, 2], 2, 0) → [None, 0.8]",
  },
  {
    id: "atlas-function-approximation",
    atlasTopic: "function-approximation",
    title: "Linear Value Regression Gradient",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "value_regression_step",
    args: "weights, features, targets, learning_rate",
    desc: "Implement one full-batch gradient descent step for a linear value critic. Targets are fixed during this step; no automatic differentiation is allowed. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty features[N][D], targets[N], weights[D]. All numbers finite and learning_rate >= 0. Targets are detached labels, not functions to differentiate.",
    output:
      "Return the updated weight vector for loss (1/(2N))*sum((dot(w,x)-target)^2).",
    equation: "w^+=w-\\frac{\\eta}{N}\\sum_i(w^\\top x_i-y_i)x_i",
    hint: "Accumulate all residual-feature products using the original weights, then update once.",
    solution:
      "def value_regression_step(weights, features, targets, learning_rate):\n    gradient = [0.0] * len(weights)\n    for x, y in zip(features, targets):\n        prediction = sum(w * v for w, v in zip(weights, x))\n        for j in range(len(weights)):\n            gradient[j] += (prediction - y) * x[j] / len(features)\n    return [w - learning_rate * g for w, g in zip(weights, gradient)]",
    tests: [
      {
        args: [
          [0, 0],
          [
            [1, 0],
            [0, 1],
          ],
          [2, 4],
          0.5,
        ],
        expected: [0.5, 1],
      },
      {
        args: [[1], [[2]], [0], 0.1],
        expected: [0.6],
      },
      {
        args: [[3, -2], [[1, 1]], [7], 0],
        expected: [3, -2],
      },
      {
        args: [[1, 2], [[0, 0]], [10], 1],
        expected: [1, 2],
      },
    ],
    proof:
      "Derive the batch gradient and show that a zero feature vector contributes zero gradient. Prove the displayed identity under the stated assumptions: \\[w^+=w-\\frac{\\eta}{N}\\sum_i(w^\\top x_i-y_i)x_i\\]",
    proofSteps: [
      {
        text: "Define the fixed-target squared-error objective.",
        tex: "L(w)=\\frac1{2N}\\sum_i(w^\\top x_i-y_i)^2",
      },
      {
        text: "Apply the chain rule, treating every target as constant.",
        tex: "\\nabla_wL=\\frac1N\\sum_i(w^\\top x_i-y_i)x_i",
      },
      {
        text: "Apply descent; a zero x_i gives a zero summand.",
        tex: "w^+=w-\\eta\\nabla_w L,\\quad x_i=0\\Rightarrow\\nabla_w L_i=0",
      },
    ],
    checks: [
      "I kept targets fixed and used the original weights for every residual.",
      "I included the batch normalization and the factor from the half-squared loss.",
      "I justified the descent sign and the zero-feature edge case without claiming general neural convergence.",
    ],
    complexity: "O(ND) time and O(D) auxiliary space.",
    example:
      "value_regression_step([0, 0], [[1, 0], [0, 1]], [2, 4], 0.5) → [0.5, 1]",
  },
  {
    id: "atlas-dqn",
    atlasTopic: "dqn",
    title: "A Linear DQN Training Step",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "linear_dqn_step",
    args: "weights, states, actions, rewards, next_states, terminals, target_weights, gamma, learning_rate",
    desc: "Build a minimal DQN training kernel: a linear Q head, a separate frozen target head, terminal-aware max targets, and a batch TD-loss gradient step. This is one optimizer step, not a complete replay/training system. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "weights[A][D] and target_weights[A][D]; N states/next_states with D features, actions in range(A), N rewards and terminal flags. N >= 1; 0 <= gamma <= 1. All entries finite.",
    output:
      "Return a new A-by-D online weight matrix after descent on mean half-squared TD error. Target weights and unselected action rows must not receive direct gradients.",
    equation:
      "y_i=r_i+\\gamma(1-d_i)\\max_a\\bar w_a^\\top x_i^\\prime,\\quad \\nabla_{w_a}L=\\frac1N\\sum_{i:a_i=a}(w_a^\\top x_i-y_i)x_i",
    hint: "First freeze every target and online prediction at the old parameters. Average gradients over all N transitions, not just examples selecting an action.",
    solution:
      "def linear_dqn_step(weights, states, actions, rewards, next_states, terminals, target_weights, gamma, learning_rate):\n    gradient = [[0.0 for _ in row] for row in weights]\n    N = len(states)\n    for x, a, r, nx, done in zip(states, actions, rewards, next_states, terminals):\n        next_value = max(sum(w * v for w, v in zip(row, nx)) for row in target_weights)\n        target = r + gamma * (0 if done else next_value)\n        prediction = sum(w * v for w, v in zip(weights[a], x))\n        for j in range(len(x)):\n            gradient[a][j] += (prediction - target) * x[j] / N\n    return [[w - learning_rate * g for w, g in zip(row, grad)]\n            for row, grad in zip(weights, gradient)]",
    tests: [
      {
        args: [
          [[0], [0]],
          [[1]],
          [0],
          [1],
          [[1]],
          [false],
          [[2], [4]],
          0.5,
          0.1,
        ],
        expected: [[0.3], [0]],
      },
      {
        args: [
          [[0], [0]],
          [[1], [1]],
          [0, 1],
          [1, 2],
          [[1], [1]],
          [true, true],
          [[99], [99]],
          0.9,
          1,
        ],
        expected: [[0.5], [1]],
      },
      {
        args: [
          [[1], [3]],
          [[2]],
          [0],
          [0],
          [[1]],
          [true],
          [[99], [99]],
          1,
          0.25,
        ],
        expected: [[0], [3]],
      },
      {
        args: [[[1], [2]], [[0]], [1], [5], [[0]], [false], [[3], [4]], 0.9, 1],
        expected: [[1], [2]],
      },
    ],
    proof:
      "Derive the selected-action TD-loss gradient and explain why the target network is outside that gradient. Prove the displayed identity under the stated assumptions: \\[y_i=r_i+\\gamma(1-d_i)\\max_a\\bar w_a^\\top x_i^\\prime,\\quad \\nabla_{w_a}L=\\frac1N\\sum_{i:a_i=a}(w_a^\\top x_i-y_i)x_i\\]",
    proofSteps: [
      {
        text: "Treat the target-network result as a constant label.",
        tex: "L=\\frac1{2N}\\sum_i(Q_w(x_i,a_i)-\\operatorname{sg}(y_i))^2",
      },
      {
        text: "Differentiate the linear selected-action head.",
        tex: "\\frac{\\partial Q_w(x_i,a_i)}{\\partial w_a}=\\mathbf1_{a_i=a}x_i",
      },
      {
        text: "Combine the chain rule and the terminal mask.",
        tex: "\\nabla_{w_a}L=\\frac1N\\sum_{i:a_i=a}(w_a^\\top x_i-y_i)x_i,\\quad d_i=1\\Rightarrow y_i=r_i",
      },
    ],
    checks: [
      "I detached the target head and used old online weights for the full batch.",
      "I derived why only selected rows get direct gradients and averaged over N.",
      "I removed terminal bootstraps and explained why tabular contraction is not a neural DQN convergence proof.",
    ],
    complexity: "O(NAD) time and O(AD) gradient space.",
    example:
      "linear_dqn_step([[0], [0]], [[1]], [0], [1], [[1]], [False], [[2], [4]], 0.5, 0.1) → [[0.3], [0]]",
  },
  {
    id: "atlas-double-dueling",
    atlasTopic: "double-dueling",
    title: "Double DQN Targets from Dueling Heads",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "double_dueling_target",
    args: "reward, terminal, value, advantages, target_values, gamma",
    desc: "Combine two distinct ideas: reconstruct centered dueling online Q values, select the lowest-index maximizing online action, and evaluate only that action with frozen target Q values. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty equal-length advantages/target_values arrays, scalar value/reward, Boolean terminal, 0 <= gamma <= 1. target_values are already Q values, not advantages.",
    output:
      "Return reward at a terminal, otherwise reward + gamma*target_values[argmax online_Q]. Break action ties with the lowest index.",
    equation:
      "Q_i=V+A_i-\\frac1K\\sum_jA_j,\\quad y=r+\\gamma(1-d)Q_{\\rm target}(\\arg\\max_iQ_i)",
    hint: "The common value and mean-advantage offsets do not affect argmax. Selection and evaluation must use different arrays.",
    solution:
      "def double_dueling_target(reward, terminal, value, advantages, target_values, gamma):\n    mean = sum(advantages) / len(advantages)\n    q = [value + a - mean for a in advantages]\n    action = max(range(len(q)), key=lambda i: q[i])\n    return reward if terminal else reward + gamma * target_values[action]",
    tests: [
      {
        args: [1, false, 3, [2, 0], [1, 10], 0.9],
        expected: 1.9,
      },
      {
        args: [2, true, 0, [1, 9], [100, 200], 0.99],
        expected: 2,
      },
      {
        args: [0, false, 10, [5, 5], [2, 8], 0.5],
        expected: 1,
      },
      {
        args: [0, false, -3, [1, 4, 2], [9, 2, 8], 1],
        expected: 2,
      },
    ],
    proof:
      "Prove that centering advantages makes their mean contribution zero and leaves the greedy action unchanged; distinguish that from Double DQN. Prove the displayed identity under the stated assumptions: \\[Q_i=V+A_i-\\frac1K\\sum_jA_j,\\quad y=r+\\gamma(1-d)Q_{\\rm target}(\\arg\\max_iQ_i)\\]",
    proofSteps: [
      {
        text: "Average the reconstructed action values.",
        tex: "\\frac1K\\sum_iQ_i=V+\\frac1K\\sum_iA_i-\\frac1K\\sum_jA_j=V",
      },
      {
        text: "Compare two reconstructed actions.",
        tex: "Q_i-Q_j=A_i-A_j",
      },
      {
        text: "Select online, evaluate target; this is separate from the architectural identity.",
        tex: "a^*=\\arg\\max_iQ_{\\rm online,i},\\quad y=r+\\gamma(1-d)Q_{\\rm target,a^*}",
      },
    ],
    checks: [
      "I proved both the mean-value identity and pairwise action differences.",
      "I used the lowest index on ties.",
      "I separated dueling centering from Double DQN selection/evaluation and masked terminals.",
    ],
    complexity:
      "O(A) time and O(A) auxiliary space; O(1) extra space is also possible.",
    example: "double_dueling_target(1, False, 3, [2, 0], [1, 10], 0.9) → 1.9",
  },
  {
    id: "atlas-prioritized-replay",
    atlasTopic: "prioritized-replay",
    title: "Prioritized Replay Probabilities and Weights",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "per_weights",
    args: "errors, alpha, beta, epsilon",
    desc: "Compute proportional replay probabilities and unnormalized importance weights. Unnormalized weights are intentional: at beta=1 they recover the uniform-replay expectation. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty finite TD errors; alpha,beta in [0,1]; epsilon > 0. Priority is (abs(error)+epsilon)^alpha.",
    output:
      "Return [probabilities, weights], both length N; weight_i=(N*p_i)^(-beta). Do not divide weights by their maximum.",
    equation:
      "p_i=\\frac{(|\\delta_i|+\\epsilon)^\\alpha}{\\sum_j(|\\delta_j|+\\epsilon)^\\alpha},\\quad w_i=(Np_i)^{-\\beta}",
    hint: "Normalize priorities first. Alpha zero gives uniform sampling; beta zero gives weights one.",
    solution:
      "def per_weights(errors, alpha, beta, epsilon):\n    priorities = [(abs(e) + epsilon) ** alpha for e in errors]\n    total = sum(priorities)\n    p = [x / total for x in priorities]\n    return [p, [(len(p) * x) ** (-beta) for x in p]]",
    tests: [
      {
        args: [[0, 2], 1, 1, 1],
        expected: [
          [0.25, 0.75],
          [2, 0.6666666666666666],
        ],
      },
      {
        args: [[1, -5, 0], 0, 1, 0.01],
        expected: [
          [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
          [1, 1, 1],
        ],
      },
      {
        args: [[0, 3], 1, 0, 1],
        expected: [
          [0.2, 0.8],
          [1, 1],
        ],
      },
      {
        args: [[0], 0.5, 0.5, 0.1],
        expected: [[1], [1]],
      },
    ],
    proof:
      "Prove exact uniform-expectation recovery at beta one for unnormalized weights and explain the effect of max-normalization. Prove the displayed identity under the stated assumptions: \\[p_i=\\frac{(|\\delta_i|+\\epsilon)^\\alpha}{\\sum_j(|\\delta_j|+\\epsilon)^\\alpha},\\quad w_i=(Np_i)^{-\\beta}\\]",
    proofSteps: [
      {
        text: "Write the expectation under prioritized sampling.",
        tex: "\\mathbb E_{i\\sim p}[w_i g_i]=\\sum_i p_i(Np_i)^{-1}g_i",
      },
      {
        text: "Cancel each strictly positive probability.",
        tex: "=\\frac1N\\sum_i g_i",
      },
      {
        text: "Dividing weights by their maximum multiplies the whole expectation by a common factor.",
        tex: "\\mathbb E_p[(w_i/w_{\\max})g_i]=\\frac1{w_{\\max}}\\frac1N\\sum_i g_i",
      },
    ],
    checks: [
      "I ensured positive priority and normalized probabilities.",
      "I proved the identity at beta=1 for arbitrary fixed g_i.",
      "I explained that beta<1 or max-normalization changes exact unbiasedness.",
    ],
    complexity: "O(N) time and O(N) output space.",
    example:
      "per_weights([0, 2], 1, 1, 1) → [[0.25, 0.75], [2, 0.6666666666666666]]",
  },
  {
    id: "atlas-distributional",
    atlasTopic: "distributional",
    title: "C51 Categorical Bellman Projection",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "c51_projection",
    args: "atoms, probabilities, reward, gamma, terminal",
    desc: "Project a categorical Bellman target onto a fixed evenly spaced support. Preserve mass even when a transformed atom lands exactly on a support point. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "atoms is strictly increasing and evenly spaced, length K >= 2; probabilities is a nonnegative length-K distribution. reward is finite; gamma in [0,1]; terminal is Boolean.",
    output:
      "Return a length-K projected probability vector. Clip transformed atoms to [atoms[0], atoms[-1]] before splitting mass. At a terminal, transform every atom to reward.",
    equation:
      "\\hat z_j=\\operatorname{clip}(r+\\gamma(1-d)z_j,z_0,z_{K-1}),\\quad b_j=\\frac{\\hat z_j-z_0}{\\Delta z}",
    hint: "Use floor/ceil. If they are equal, assign the entire source probability to that one index.",
    solution:
      "def c51_projection(atoms, probabilities, reward, gamma, terminal):\n    import math\n    K = len(atoms)\n    step = (atoms[-1] - atoms[0]) / (K - 1)\n    out = [0.0] * K\n    for z, mass in zip(atoms, probabilities):\n        value = reward + (0 if terminal else gamma * z)\n        value = min(atoms[-1], max(atoms[0], value))\n        b = (value - atoms[0]) / step\n        lo, hi = int(math.floor(b)), int(math.ceil(b))\n        if lo == hi:\n            out[lo] += mass\n        else:\n            out[lo] += mass * (hi - b)\n            out[hi] += mass * (b - lo)\n    return out",
    tests: [
      {
        args: [[-1, 0, 1], [0.2, 0.3, 0.5], 0, 1, false],
        expected: [0.2, 0.3, 0.5],
      },
      {
        args: [[-1, 0, 1], [0.2, 0.3, 0.5], 0.5, 1, true],
        expected: [0, 0.5, 0.5],
      },
      {
        args: [[-1, 0, 1], [0.2, 0.3, 0.5], 3, 0.9, false],
        expected: [0, 0, 1],
      },
      {
        args: [[-1, 0, 1], [0, 1, 0], 0.25, 1, false],
        expected: [0, 0.75, 0.25],
      },
    ],
    proof:
      "Prove probability-mass preservation and local mean preservation before clipping. Explain why clipping can change the original target mean. Prove the displayed identity under the stated assumptions: \\[\\hat z_j=\\operatorname{clip}(r+\\gamma(1-d)z_j,z_0,z_{K-1}),\\quad b_j=\\frac{\\hat z_j-z_0}{\\Delta z}\\]",
    proofSteps: [
      {
        text: "For a fractional bin, the two interpolation weights sum to one.",
        tex: "(u-b)+(b-l)=u-l=1",
      },
      {
        text: "Their support-weighted average is the transformed value.",
        tex: "z_l(u-b)+z_u(b-l)=z_0+b\\Delta z=\\hat z",
      },
      {
        text: "An integer bin receives all mass; summing source masses proves normalization.",
        tex: "l=u\\Rightarrow m_l\\mathrel{+}=p_j,\\quad\\sum_i m_i=\\sum_jp_j=1",
      },
    ],
    checks: [
      "I handled exact integer bins without losing mass.",
      "I proved nonnegativity and normalization.",
      "I distinguished preserving the clipped target mean from preserving the unclipped mean.",
    ],
    complexity: "O(K) time and O(K) output space.",
    example:
      "c51_projection([-1, 0, 1], [0.2, 0.3, 0.5], 0, 1, False) → [0.2, 0.3, 0.5]",
  },
  {
    id: "atlas-baselines",
    atlasTopic: "baselines",
    title: "Exact Softmax Policy Gradient with a Baseline",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "baseline_gradient",
    args: "probabilities, returns, baseline",
    desc: "Compute the exact finite-action expectation of the softmax score estimator. This is an expectation over all actions, not a sampled update. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Positive probabilities sum to one; equally sized finite returns; finite scalar baseline independent of action.",
    output:
      "Return one derivative per logit, summing p[a]*(R[a]-baseline)*(1[a=j]-p[j]) over actions.",
    equation:
      "g_j=\\sum_a\\pi_a(R_a-b)(\\mathbf1_{a=j}-\\pi_j)=\\pi_j(R_j-\\mathbb E_\\pi R)",
    hint: "Implement the score sum explicitly so the cancellation can be checked; do not confuse action-independent baseline with action-dependent subtraction.",
    solution:
      "def baseline_gradient(probabilities, returns, baseline):\n    return [sum(p * (r - baseline) * ((1 if a == j else 0) - probabilities[j])\n                for a, (p, r) in enumerate(zip(probabilities, returns)))\n            for j in range(len(probabilities))]",
    tests: [
      {
        args: [[0.25, 0.75], [4, 0], 0],
        expected: [0.75, -0.75],
      },
      {
        args: [[0.25, 0.75], [4, 0], 100],
        expected: [0.75, -0.75],
      },
      {
        args: [[0.5, 0.5], [7, 7], 2],
        expected: [0, 0],
      },
      {
        args: [[1], [8], -3],
        expected: [0],
      },
    ],
    proof:
      "Prove baseline invariance of this exact logit gradient. State why a sampled gradient can still change with the baseline. Prove the displayed identity under the stated assumptions: \\[g_j=\\sum_a\\pi_a(R_a-b)(\\mathbf1_{a=j}-\\pi_j)=\\pi_j(R_j-\\mathbb E_\\pi R)\\]",
    proofSteps: [
      {
        text: "The expected softmax score is zero.",
        tex: "\\sum_a\\pi_a(\\mathbf1_{a=j}-\\pi_j)=\\pi_j-\\pi_j\\sum_a\\pi_a=0",
      },
      {
        text: "Remove the constant-baseline contribution.",
        tex: "\\sum_a\\pi_a(R_a-b)(\\mathbf1_{a=j}-\\pi_j)=\\sum_a\\pi_aR_a(\\mathbf1_{a=j}-\\pi_j)",
      },
      {
        text: "Collect the reward terms.",
        tex: "g_j=\\pi_jR_j-\\pi_j\\sum_a\\pi_aR_a",
      },
    ],
    checks: [
      "I used a baseline independent of the selected action.",
      "I proved the expected score is zero and derived every logit component.",
      "I distinguished exact expectation invariance from sample variance and did not claim the mean-return baseline is always optimal.",
    ],
    complexity:
      "O(A²) for the explicit score-sum implementation; O(A) is possible after derivation.",
    example: "baseline_gradient([0.25, 0.75], [4, 0], 0) → [0.75, -0.75]",
  },
  {
    id: "atlas-actor-critic",
    atlasTopic: "actor-critic",
    title: "One-Step Actor-Critic Advantage and Value Update",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "actor_critic_step",
    args: "probabilities, action, reward, value, next_value, terminal, gamma, actor_rate, critic_rate",
    desc: "Implement a one-transition actor-critic kernel: a scalar TD residual, detached softmax actor logit increments, and a scalar critic update. This returns increments, not new normalized probabilities. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Positive probabilities sum to one, action is valid, terminal Boolean, gamma in [0,1], nonnegative rates. All other numbers are finite.",
    output:
      "Return [delta, actor_logit_increments, updated_value]. This is a per-state surrogate step; trajectory sampling/discount weighting is handled by an outer training loop.",
    equation:
      "\\delta=r+\\gamma(1-d)V^\\prime-V,\\quad\\Delta z_j=\\eta_\\pi\\delta(\\mathbf1_{a=j}-\\pi_j),\\quad V^+=V+\\eta_V\\delta",
    hint: "Compute the old residual once and reuse it as a fixed number for both updates.",
    solution:
      "def actor_critic_step(probabilities, action, reward, value, next_value, terminal, gamma, actor_rate, critic_rate):\n    delta = reward + gamma * (0 if terminal else next_value) - value\n    increments = [actor_rate * delta * ((1 if j == action else 0) - p)\n                  for j, p in enumerate(probabilities)]\n    return [delta, increments, value + critic_rate * delta]",
    tests: [
      {
        args: [[0.25, 0.75], 0, 1, 2, 4, false, 0.5, 0.1, 0.2],
        expected: [1, [0.075, -0.075], 2.2],
      },
      {
        args: [[0.5, 0.5], 1, 1, 2, 100, true, 0.9, 0.2, 0.5],
        expected: [-1, [0.1, -0.1], 1.5],
      },
      {
        args: [[1], 0, 3, 3, 0, true, 1, 1, 1],
        expected: [0, [0], 3],
      },
    ],
    proof:
      "For an exact on-policy value critic, prove that the TD residual has conditional expectation A_pi(s,a); then derive the detached actor and critic steps. Prove the displayed identity under the stated assumptions: \\[\\delta=r+\\gamma(1-d)V^\\prime-V,\\quad\\Delta z_j=\\eta_\\pi\\delta(\\mathbf1_{a=j}-\\pi_j),\\quad V^+=V+\\eta_V\\delta\\]",
    proofSteps: [
      {
        text: "Condition on the current state and chosen action.",
        tex: "\\mathbb E[\\delta\\mid s,a]=\\mathbb E[r+\\gamma(1-d)V^\\pi(S\\prime)\\mid s,a]-V^\\pi(s)",
      },
      {
        text: "Recognize the Bellman action value.",
        tex: "=Q^\\pi(s,a)-V^\\pi(s)=A^\\pi(s,a)",
      },
      {
        text: "Differentiate the softmax log probability and half squared scalar value loss.",
        tex: "\\partial_{z_j}\\log\\pi(a)=\\mathbf1_{a=j}-\\pi_j,\\quad -\\partial_V\\tfrac12(V-y)^2=y-V=\\delta",
      },
    ],
    checks: [
      "I stated the exact-critic and on-policy assumptions for the conditional identity.",
      "I detached the target and residual during their respective updates.",
      "I derived the sign of both updates and noted that the outer objective controls state/time weighting.",
    ],
    complexity: "O(A) time and O(A) output space.",
    example:
      "actor_critic_step([0.25, 0.75], 0, 1, 2, 4, False, 0.5, 0.1, 0.2) → [1, [0.075, -0.075], 2.2]",
  },
  {
    id: "atlas-gae",
    atlasTopic: "gae",
    title: "Generalized Advantage Estimation with Boundaries",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "gae",
    args: "rewards, values, terminals, gamma, lam",
    desc: "Implement GAE by a backward recurrence, preserving a value bootstrap at a nonterminal rollout boundary and cutting traces at true terminals. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "rewards/terminals length T; values length T+1; gamma and lam in [0,1]. Finite values. The rollout ends at T; values[T] may be nonzero if that boundary is nonterminal.",
    output:
      "Return [advantages, value_targets], where value_target[t]=advantage[t]+values[t]. Empty rollout returns [[], []].",
    equation:
      "\\delta_t=r_t+\\gamma b_tV_{t+1}-V_t,\\quad\\hat A_t=\\delta_t+\\gamma\\lambda b_t\\hat A_{t+1}",
    hint: "Start the backward advantage accumulator at zero, but do not zero the last next-state value unless the last transition is terminal.",
    solution:
      "def gae(rewards, values, terminals, gamma, lam):\n    advantages = [0.0] * len(rewards)\n    carry = 0.0\n    for t in range(len(rewards) - 1, -1, -1):\n        mask = 0 if terminals[t] else 1\n        delta = rewards[t] + gamma * mask * values[t + 1] - values[t]\n        carry = delta + gamma * lam * mask * carry\n        advantages[t] = carry\n    return [advantages, [a + v for a, v in zip(advantages, values)]]",
    tests: [
      {
        args: [[1, 2], [0, 1, 4], [false, false], 0.5, 1],
        expected: [
          [3, 3],
          [3, 4],
        ],
      },
      {
        args: [[1, 2], [0, 1, 4], [false, true], 0.5, 1],
        expected: [
          [2, 1],
          [2, 2],
        ],
      },
      {
        args: [[1, 2], [0, 1, 4], [false, false], 0.5, 0],
        expected: [
          [1.5, 3],
          [1.5, 4],
        ],
      },
      {
        args: [[], [5], [], 0.9, 0.95],
        expected: [[], []],
      },
    ],
    proof:
      "Unroll the recurrence and prove that lambda one telescopes to a bootstrapped return minus the old value, with the correct terminal case. Prove the displayed identity under the stated assumptions: \\[\\delta_t=r_t+\\gamma b_tV_{t+1}-V_t,\\quad\\hat A_t=\\delta_t+\\gamma\\lambda b_t\\hat A_{t+1}\\]",
    proofSteps: [
      {
        text: "Expand the reverse recursion over the finite rollout.",
        tex: "\\hat A_t=\\sum_{l=0}^{T-t-1}(\\gamma\\lambda)^l\\left(\\prod_{j=0}^{l-1}b_{t+j}\\right)\\delta_{t+l}",
      },
      {
        text: "At lambda one without an intervening terminal, adjacent value terms cancel.",
        tex: "\\hat A_t=\\sum_{l=0}^{T-t-1}\\gamma^lr_{t+l}+\\gamma^{T-t}V_T-V_t",
      },
      {
        text: "A true terminal cuts the continuation; lambda zero keeps only the residual.",
        tex: "b_k=0\\Rightarrow\\text{no terms beyond }k,\\quad\\lambda=0\\Rightarrow\\hat A_t=\\delta_t",
      },
    ],
    checks: [
      "I derived the trace expansion and the lambda-one cancellation.",
      "I retained a nonterminal boundary bootstrap and masked true terminals.",
      "I checked lambda zero and explained that estimated critic values do not make every sample advantage exact.",
    ],
    complexity: "O(T) time and O(T) output space.",
    example:
      "gae([1, 2], [0, 1, 4], [False, False], 0.5, 1) → [[3, 3], [3, 4]]",
  },
  {
    id: "atlas-trpo",
    atlasTopic: "trpo",
    title: "Diagonal Fisher Trust-Region Step",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "trust_region_step",
    args: "gradient, fisher_diagonal, delta",
    desc: "Solve the local linear-objective/quadratic-constraint trust-region subproblem for a strictly positive diagonal Fisher approximation. This is the local TRPO step, not the full line-search algorithm. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty gradient/fisher_diagonal arrays; finite gradient; each diagonal entry > 0; delta >= 0. Zero gradient or zero delta returns a zero vector.",
    output:
      "Return the maximizer x of g dot x subject to 0.5*sum(F_i*x_i^2) <= delta.",
    equation: "x^*=\\sqrt{\\frac{2\\Delta}{g^\\top F^{-1}g}}F^{-1}g",
    hint: "Compute v_i=g_i/F_i, then scale v using g dot v. Handle a zero denominator.",
    solution:
      "def trust_region_step(gradient, fisher_diagonal, delta):\n    import math\n    v = [g / f for g, f in zip(gradient, fisher_diagonal)]\n    curvature = sum(g * x for g, x in zip(gradient, v))\n    if curvature == 0 or delta == 0:\n        return [0.0] * len(gradient)\n    scale = math.sqrt(2 * delta / curvature)\n    return [scale * x for x in v]",
    tests: [
      {
        args: [[1, 0], [2, 4], 0.25],
        expected: [0.5, 0],
      },
      {
        args: [[0, 0], [1, 2], 1],
        expected: [0, 0],
      },
      {
        args: [[1, -2], [1, 2], 0],
        expected: [0, 0],
      },
      {
        args: [[2], [8], 1],
        expected: [0.5],
      },
    ],
    proof:
      "Derive the local constrained optimum using a Lagrange multiplier, and explain why satisfying this quadratic model does not certify the true post-update KL. Prove the displayed identity under the stated assumptions: \\[x^*=\\sqrt{\\frac{2\\Delta}{g^\\top F^{-1}g}}F^{-1}g\\]",
    proofSteps: [
      {
        text: "Set the derivative of the local Lagrangian to zero.",
        tex: "\\mathcal L(x,\\nu)=g^\\top x-\\nu(\\tfrac12x^\\top Fx-\\Delta),\\quad g-\\nu Fx=0",
      },
      {
        text: "For nonzero g and positive radius, the constraint is active.",
        tex: "x=F^{-1}g/\\nu,\\quad\\frac{g^\\top F^{-1}g}{2\\nu^2}=\\Delta",
      },
      {
        text: "Choose the positive multiplier for the ascent solution.",
        tex: "\\nu=\\sqrt{g^\\top F^{-1}g/(2\\Delta)},\\quad x^*=\\sqrt{2\\Delta/(g^\\top F^{-1}g)}F^{-1}g",
      },
    ],
    checks: [
      "I stated positive Fisher curvature and handled zero gradient/radius.",
      "I derived the multiplier and checked the quadratic budget.",
      "I distinguished the local approximation from actual policy KL and monotonic-improvement claims.",
    ],
    complexity: "O(D) time and O(D) output space.",
    example: "trust_region_step([1, 0], [2, 4], 0.25) → [0.5, 0]",
  },
  {
    id: "atlas-ppo",
    atlasTopic: "ppo",
    title: "PPO Clipped Objective and Log-Ratio Gradient",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "ppo_clip",
    args: "ratios, advantages, epsilon",
    desc: "Implement the mean PPO clipped sample objective and its derivative with respect to each independent log-ratio. This is the clipping kernel; a neural policy must still apply the chain rule from log-ratios to its parameters. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty positive ratios and finite advantages; 0 < epsilon < 1. At either clipping boundary, return the derivative of the unclipped branch as the explicit tie convention.",
    output:
      "Return [mean_objective, gradient_per_log_ratio]. Each gradient includes division by the batch size. Negative advantages flatten below 1-epsilon, positive ones above 1+epsilon.",
    equation:
      "\\ell_i=\\min(r_iA_i,\\operatorname{clip}(r_i,1-\\epsilon,1+\\epsilon)A_i),\\quad \\partial_{\\log r_i}L=\\frac1N\\partial_{r_i}\\ell_i\\,r_i",
    hint: "Choose the pessimistic branch using the sign of A. A clipped ratio is not a hard constraint on the current policy.",
    solution:
      "def ppo_clip(ratios, advantages, epsilon):\n    total, gradient = 0.0, []\n    N = len(ratios)\n    for r, a in zip(ratios, advantages):\n        clipped = min(1 + epsilon, max(1 - epsilon, r))\n        total += min(r * a, clipped * a) / N\n        flat = (a > 0 and r > 1 + epsilon) or (a < 0 and r < 1 - epsilon)\n        gradient.append(0.0 if flat else r * a / N)\n    return [total, gradient]",
    tests: [
      {
        args: [[1.5, 0.5, 1.5, 0.5], [1, -1, -1, 1], 0.2],
        expected: [-0.15, [0, 0, -0.375, 0.125]],
      },
      {
        args: [[0.8, 1.2], [-1, 1], 0.2],
        expected: [0.2, [-0.4, 0.6]],
      },
      {
        args: [[2, 0.2], [0, 0], 0.1],
        expected: [0, [0, 0]],
      },
      {
        args: [[0.5], [2], 0.2],
        expected: [1, [1]],
      },
    ],
    proof:
      "Derive the positive/negative advantage branches and their log-ratio derivatives. Give a reason clipping is not a hard global KL constraint. Prove the displayed identity under the stated assumptions: \\[\\ell_i=\\min(r_iA_i,\\operatorname{clip}(r_i,1-\\epsilon,1+\\epsilon)A_i),\\quad \\partial_{\\log r_i}L=\\frac1N\\partial_{r_i}\\ell_i\\,r_i\\]",
    proofSteps: [
      {
        text: "For positive advantage the upper tail is flat.",
        tex: "A>0:\\quad\\ell(r,A)=A\\min(r,1+\\epsilon)",
      },
      {
        text: "For negative advantage the lower tail is flat.",
        tex: "A<0:\\quad\\ell(r,A)=A\\max(r,1-\\epsilon)",
      },
      {
        text: "Use dr/dlog(r)=r; at the kink we choose the active unclipped derivative by convention.",
        tex: "\\frac{\\partial L}{\\partial\\log r_i}=\\begin{cases}r_iA_i/N&\\text{unclipped branch},\\\\0&\\text{flat branch}.\\end{cases}",
      },
    ],
    checks: [
      "I derived both sign branches and specified the boundary subgradient convention.",
      "I applied the log-ratio chain rule and batch normalization.",
      "I explained that shared parameters can change unsampled actions and KL despite a flat sample objective.",
    ],
    complexity: "O(N) time and O(N) gradient output space.",
    example:
      "ppo_clip([1.5, 0.5, 1.5, 0.5], [1, -1, -1, 1], 0.2) → [-0.15, [0, 0, -0.375, 0.125]]",
  },
  {
    id: "atlas-ddpg",
    atlasTopic: "ddpg",
    title: "Deterministic Actor Gradient through tanh",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "deterministic_actor_step",
    args: "weights, features, action_gradients, learning_rate",
    desc: "Implement a deterministic actor ascent step for a scalar bounded action a=tanh(w dot x), given fixed critic action derivatives. This is an actor-gradient kernel, not a full DDPG trainer. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty features[N][D], weights[D], action_gradients[N] containing dQ/da evaluated at the current actor actions. Treat features and critic derivatives as fixed; learning_rate >= 0.",
    output:
      "Return the updated actor weights, averaging the chain-rule gradients over N replay states.",
    equation:
      "w^+=w+\\frac\\eta N\\sum_i\\left.\\frac{\\partial Q}{\\partial a}\\right|_{a_i}(1-\\tanh^2(w^\\top x_i))x_i",
    hint: "The critic derivative multiplies the actor tanh derivative; update every weight only after accumulating at the old actor.",
    solution:
      "def deterministic_actor_step(weights, features, action_gradients, learning_rate):\n    import math\n    gradient = [0.0] * len(weights)\n    for x, dq in zip(features, action_gradients):\n        a = math.tanh(sum(w * v for w, v in zip(weights, x)))\n        for j in range(len(weights)):\n            gradient[j] += dq * (1 - a * a) * x[j] / len(features)\n    return [w + learning_rate * g for w, g in zip(weights, gradient)]",
    tests: [
      {
        args: [[0], [[1]], [2], 0.1],
        expected: [0.2],
      },
      {
        args: [
          [0, 0],
          [
            [1, 0],
            [0, 1],
          ],
          [2, -4],
          0.1,
        ],
        expected: [0.1, -0.2],
      },
      {
        args: [[1], [[0]], [100], 1],
        expected: [1],
      },
      {
        args: [[0], [[1]], [3], 0],
        expected: [0],
      },
    ],
    proof:
      "Derive the actor gradient of the fixed replay-state surrogate and explain what is held constant. Prove the displayed identity under the stated assumptions: \\[w^+=w+\\frac\\eta N\\sum_i\\left.\\frac{\\partial Q}{\\partial a}\\right|_{a_i}(1-\\tanh^2(w^\\top x_i))x_i\\]",
    proofSteps: [
      {
        text: "Write the finite replay-state objective.",
        tex: "J_\\beta(w)=\\frac1N\\sum_iQ_\\phi(x_i,\\tanh(w^\\top x_i))",
      },
      {
        text: "Differentiate through the action with the critic fixed.",
        tex: "\\nabla_wJ_\\beta=\\frac1N\\sum_i(\\partial_aQ_\\phi)(1-a_i^2)x_i",
      },
      {
        text: "Maximize the surrogate by ascent.",
        tex: "w^+=w+\\eta\\nabla_wJ_\\beta",
      },
    ],
    checks: [
      "I differentiated tanh and multiplied by the critic action derivative.",
      "I kept critic parameters and replay-state distribution fixed.",
      "I used ascent and did not equate the replay surrogate unconditionally with the start-state objective.",
    ],
    complexity: "O(ND) time and O(D) auxiliary space.",
    example: "deterministic_actor_step([0], [[1]], [2], 0.1) → [0.2]",
  },
  {
    id: "atlas-td3",
    atlasTopic: "td3",
    title: "TD3 Smoothed Twin-Critic Targets",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "td3_targets",
    args: "rewards, terminals, next_actions, noises, critic1, critic2, gamma, noise_clip, action_limit",
    desc: "Construct TD3 target values using supplied deterministic noise samples and two affine scalar critics. The outer algorithm would sample Gaussian noise, maintain target networks and delay actor updates. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal-length rewards/terminals/next_actions/noises. Each critic is [slope, intercept] and is frozen. noise_clip >= 0, action_limit > 0, gamma in [0,1].",
    output:
      "Return one target per transition. Clip noise first, add it to the target action, clip the action, then take the minimum of the two critic outputs.",
    equation:
      "\\tilde a=\\operatorname{clip}(a^\\prime+\\operatorname{clip}(\\epsilon,-c,c),-L,L),\\quad y=r+\\gamma(1-d)\\min(Q_1(\\tilde a),Q_2(\\tilde a))",
    hint: "The order of noise clipping and action clipping matters. A terminal removes both target critics.",
    solution:
      "def td3_targets(rewards, terminals, next_actions, noises, critic1, critic2, gamma, noise_clip, action_limit):\n    out = []\n    for r, done, a, noise in zip(rewards, terminals, next_actions, noises):\n        noise = min(noise_clip, max(-noise_clip, noise))\n        a = min(action_limit, max(-action_limit, a + noise))\n        q1, q2 = critic1[0] * a + critic1[1], critic2[0] * a + critic2[1]\n        out.append(r + gamma * (0 if done else min(q1, q2)))\n    return out",
    tests: [
      {
        args: [
          [1, 2],
          [false, true],
          [0.9, 0],
          [1, 0],
          [2, 0],
          [-1, 3],
          0.5,
          0.2,
          1,
        ],
        expected: [2, 2],
      },
      {
        args: [[0], [false], [-0.9], [-2], [1, 0], [2, 0], 1, 0.2, 1],
        expected: [-2],
      },
      {
        args: [[3], [false], [0], [1], [1, 0], [1, 0], 0.9, 0, 1],
        expected: [3],
      },
      {
        args: [[], [], [], [], [1, 0], [1, 0], 0.9, 0.2, 1],
        expected: [],
      },
    ],
    proof:
      "Prove the algebraic decomposition of the twin minimum and use it to explain potential underestimation. Prove the displayed identity under the stated assumptions: \\[\\tilde a=\\operatorname{clip}(a^\\prime+\\operatorname{clip}(\\epsilon,-c,c),-L,L),\\quad y=r+\\gamma(1-d)\\min(Q_1(\\tilde a),Q_2(\\tilde a))\\]",
    proofSteps: [
      {
        text: "For arbitrary real x and y, expand their minimum.",
        tex: "\\min(x,y)=\\frac{x+y-|x-y|}{2}",
      },
      {
        text: "If both estimators have mean q, average and take expectations.",
        tex: "\\mathbb E[\\min(Q_1,Q_2)]=q-\\tfrac12\\mathbb E|Q_1-Q_2|\\leq q",
      },
      {
        text: "Apply the clipped smoothed action to the target; do not infer a statistical lower confidence bound.",
        tex: "y=r+\\gamma(1-d)\\min(Q_1(\\tilde a),Q_2(\\tilde a))",
      },
    ],
    checks: [
      "I proved the minimum identity and stated the unbiased-equal-mean assumption for the expectation result.",
      "I applied noise and action clipping in the specified order and masked terminals.",
      "I distinguished pessimistic bias from a certified confidence bound and did not claim this kernel implements delayed actor updates.",
    ],
    complexity: "O(N) time and O(N) output space.",
    example:
      "td3_targets([1, 2], [False, True], [0.9, 0], [1, 0], [2, 0], [-1, 3], 0.5, 0.2, 1) → [2, 2]",
  },
  {
    id: "atlas-sac",
    atlasTopic: "sac",
    title: "Discrete Soft Value and Entropy-Regularized Policy",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "soft_value",
    args: "q_values, temperature",
    desc: "Compute the exact finite-action entropy-regularized optimum with a numerically stable log-sum-exp. This discrete illustration isolates SAC’s soft-value concept; continuous SAC additionally needs sampling, critics and a squashed-density Jacobian. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty finite Q values and temperature > 0. Inputs stay within ordinary floating-point range.",
    output:
      "Return [optimal_probabilities, soft_value]. Use a maximum shift before exponentiation.",
    equation:
      "\\pi_i^*=\\frac{e^{Q_i/\\alpha}}{\\sum_je^{Q_j/\\alpha}},\\quad V=\\alpha\\log\\sum_i e^{Q_i/\\alpha}",
    hint: "With m=max(Q), compute exp((Q_i-m)/alpha) and V=m+alpha*log(sum(exp(...))).",
    solution:
      "def soft_value(q_values, temperature):\n    import math\n    maximum = max(q_values)\n    weights = [math.exp((q - maximum) / temperature) for q in q_values]\n    total = sum(weights)\n    return [[w / total for w in weights], maximum + temperature * math.log(total)]",
    tests: [
      {
        args: [[0, 0], 1],
        expected: [[0.5, 0.5], 0.6931471805599453],
      },
      {
        args: [[1000, 1000], 0.5],
        expected: [[0.5, 0.5], 1000.34657359028],
      },
      {
        args: [[2], 0.7],
        expected: [[1], 2],
      },
      {
        args: [[0, 0, 0], 2],
        expected: [
          [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
          2.1972245773362196,
        ],
      },
    ],
    proof:
      "Prove the soft-value variational identity and recover the maximizing distribution. Prove the displayed identity under the stated assumptions: \\[\\pi_i^*=\\frac{e^{Q_i/\\alpha}}{\\sum_je^{Q_j/\\alpha}},\\quad V=\\alpha\\log\\sum_i e^{Q_i/\\alpha}\\]",
    proofSteps: [
      {
        text: "Define p_star proportional to exp(Q/alpha).",
        tex: "\\log\\pi_i^*=Q_i/\\alpha-\\log Z",
      },
      {
        text: "Expand the KL divergence for any candidate p.",
        tex: "\\alpha D_{\\rm KL}(p\\|\\pi^*)=\\alpha\\sum_ip_i\\log p_i-\\sum_ip_iQ_i+\\alpha\\log Z",
      },
      {
        text: "Rearrange and use nonnegative KL.",
        tex: "\\mathbb E_pQ+\\alpha\\mathcal H(p)=\\alpha\\log Z-\\alpha D_{\\rm KL}(p\\|\\pi^*)\\leq\\alpha\\log Z",
      },
    ],
    checks: [
      "I normalized the Gibbs probabilities and used a stable exponential shift.",
      "I derived the KL identity for alpha>0.",
      "I identified the equality case and stated that this finite-action calculation is not a full continuous SAC implementation.",
    ],
    complexity: "O(A) time and O(A) output space.",
    example: "soft_value([0, 0], 1) → [[0.5, 0.5], 0.6931471805599453]",
  },
  {
    id: "atlas-off-policy-evaluation",
    atlasTopic: "off-policy-evaluation",
    title: "Trajectory IS and Contextual Doubly Robust Evaluation",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "off_policy_estimates",
    args: "rewards, target_probs, behavior_probs, model_values, chosen_values",
    desc: "Implement two separately scoped off-policy estimators: ordinary trajectory-wise importance sampling over episodic rewards, and contextual-bandit doubly robust estimation using each episode’s first decision only. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty list of nonempty episodes. rewards/target_probs/behavior_probs share their ragged shape. Logged target probabilities are in [0,1], behavior probabilities > 0. model_values and chosen_values have one entry per episode: target-policy model expectation and chosen-action model value at its first context. Returns are undiscounted.",
    output:
      "Return [ordinary_trajectory_IS_mean, first_decision_bandit_DR_mean]. Do not self-normalize IS weights; DR is explicitly not a sequential doubly robust estimator.",
    equation:
      "\\hat V_{\\rm IS}=\\frac1N\\sum_i\\left(\\prod_t\\frac{\\pi_{it}}{\\mu_{it}}\\right)\\sum_tr_{it},\\quad\\hat V_{\\rm DR}=\\frac1N\\sum_i\\left[\\hat v_i+\\frac{\\pi_{i0}}{\\mu_{i0}}(r_{i0}-\\hat q_i)\\right]",
    hint: "Multiply action ratios along each trajectory. The second estimator uses only index zero and has a different estimand.",
    solution:
      "def off_policy_estimates(rewards, target_probs, behavior_probs, model_values, chosen_values):\n    is_total, dr_total = 0.0, 0.0\n    for rs, ps, ms, v, q in zip(rewards, target_probs, behavior_probs, model_values, chosen_values):\n        weight = 1.0\n        for p, m in zip(ps, ms):\n            weight *= p / m\n        is_total += weight * sum(rs)\n        dr_total += v + ps[0] / ms[0] * (rs[0] - q)\n    return [is_total / len(rewards), dr_total / len(rewards)]",
    tests: [
      {
        args: [
          [[1, 2], [4]],
          [[0.5, 0.5], [0.5]],
          [[0.25, 0.5], [0.5]],
          [1, 2],
          [0, 3],
        ],
        expected: [5, 3],
      },
      {
        args: [[[2]], [[0]], [[0.5]], [7], [99]],
        expected: [0, 7],
      },
      {
        args: [
          [[3], [5]],
          [[1], [1]],
          [[1], [1]],
          [0, 0],
          [0, 0],
        ],
        expected: [4, 4],
      },
    ],
    proof:
      "Prove the contextual-bandit DR expectation identity when behavior probabilities are correct and have target support. Separately state trajectory IS assumptions. Prove the displayed identity under the stated assumptions: \\[\\hat V_{\\rm IS}=\\frac1N\\sum_i\\left(\\prod_t\\frac{\\pi_{it}}{\\mu_{it}}\\right)\\sum_tr_{it},\\quad\\hat V_{\\rm DR}=\\frac1N\\sum_i\\left[\\hat v_i+\\frac{\\pi_{i0}}{\\mu_{i0}}(r_{i0}-\\hat q_i)\\right]\\]",
    proofSteps: [
      {
        text: "Condition on a context and take expectation over logged actions.",
        tex: "\\mathbb E_\\mu[\\hat v(s)+\\tfrac{\\pi(a|s)}{\\mu(a|s)}(r-\\hat q(s,a))\\mid s]=\\hat v(s)+\\sum_a\\pi(a|s)(q(s,a)-\\hat q(s,a))",
      },
      {
        text: "Use v_hat as the target-policy model expectation.",
        tex: "\\hat v(s)=\\sum_a\\pi(a|s)\\hat q(s,a)\\ \\Rightarrow\\ \\mathbb E[\\hat V_{\\rm DR}\\mid s]=\\sum_a\\pi(a|s)q(s,a)",
      },
      {
        text: "For complete trajectories, shared dynamics cancel from the density ratio.",
        tex: "\\frac{p_\\pi(\\tau)}{p_\\mu(\\tau)}=\\prod_t\\frac{\\pi(a_t|s_t)}{\\mu(a_t|s_t)}",
      },
    ],
    checks: [
      "I stated common dynamics, target support and integrable weighted returns for IS.",
      "I derived the contextual DR cancellation with a model expectation consistent with the target policy.",
      "I kept the two estimands separate and did not claim a first-decision DR formula evaluates a sequential return.",
    ],
    complexity: "O(total logged decisions) time and O(1) auxiliary space.",
    example:
      "off_policy_estimates([[1, 2], [4]], [[0.5, 0.5], [0.5]], [[0.25, 0.5], [0.5]], [1, 2], [0, 3]) → [5, 3]",
  },
  {
    id: "atlas-model-based",
    atlasTopic: "model-based",
    title: "Finite-Horizon Planning in a Learned Model",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "model_plan",
    args: "transitions, rewards, gamma, horizon",
    desc: "Plan from scratch in a supplied finite model using synchronous finite-horizon backups. This evaluates the model; it does not learn dynamics or claim the model is correct. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Transitions[S][A][S] are stochastic; rewards[S][A] are bounded expected immediate rewards shared with the true model for the proof below. At least one action per state; horizon >= 0; gamma in [0,1).",
    output:
      "Return optimal state values after exactly horizon backups from zero. Use a fresh value array per backup.",
    equation:
      "V_{h+1}(s)=\\max_a\\left[r(s,a)+\\gamma\\sum_{s\\prime}\\hat P(s\\prime|s,a)V_h(s\\prime)\\right],\\quad V_0=0",
    hint: "Back up the whole model without in-place reuse. The requested model-error proof concerns a fixed policy in the infinite-horizon discounted limit, a separate scope from finite-horizon optimal planning.",
    solution:
      "def model_plan(transitions, rewards, gamma, horizon):\n    n = len(transitions)\n    values = [0.0] * n\n    for _ in range(horizon):\n        values = [max(rewards[s][a] + gamma * sum(p * v for p, v in zip(row, values))\n                      for a, row in enumerate(transitions[s])) for s in range(n)]\n    return values",
    tests: [
      {
        args: [[[[1]]], [[2]], 0.5, 3],
        expected: [3.5],
      },
      {
        args: [
          [
            [
              [1, 0],
              [0, 1],
            ],
            [
              [0, 1],
              [1, 0],
            ],
          ],
          [
            [0, 1],
            [2, 0],
          ],
          0.5,
          2,
        ],
        expected: [2, 3],
      },
      {
        args: [[[[1]]], [[-2]], 0.9, 0],
        expected: [0],
      },
      {
        args: [[[[1]]], [[-2]], 0, 3],
        expected: [-2],
      },
    ],
    proof:
      "For a fixed policy with identical rewards bounded by R_max, gamma<1 and sup TV(P,P_hat)<=epsilon, derive the model value-error bound. Prove the displayed identity under the stated assumptions: \\[V_{h+1}(s)=\\max_a\\left[r(s,a)+\\gamma\\sum_{s\\prime}\\hat P(s\\prime|s,a)V_h(s\\prime)\\right],\\quad V_0=0\\]",
    proofSteps: [
      {
        text: "Subtract the two fixed-policy Bellman equations.",
        tex: "V-\\hat V=\\gamma P(V-\\hat V)+\\gamma(P-\\hat P)\\hat V",
      },
      {
        text: "Use stochasticity and the TV-to-L1 factor two.",
        tex: "(1-\\gamma)\\|V-\\hat V\\|_\\infty\\leq2\\gamma\\epsilon\\|\\hat V\\|_\\infty",
      },
      {
        text: "Bound the learned-model value magnitude by its reward bound.",
        tex: "\\|V-\\hat V\\|_\\infty\\leq\\frac{2\\gamma R_{\\max}\\epsilon}{(1-\\gamma)^2}",
      },
    ],
    checks: [
      "I used a synchronous planner and did not mix current and next sweeps.",
      "I stated fixed-policy, identical-reward and uniform total-variation assumptions.",
      "I derived the factor two and both discount denominators without claiming the bound directly certifies the optimal learned policy.",
    ],
    complexity: "O(HAS²) time and O(S) auxiliary value space.",
    example: "model_plan([[[1]]], [[2]], 0.5, 3) → [3.5]",
  },
  {
    id: "atlas-pomdp",
    atlasTopic: "pomdp",
    title: "Bayesian Belief-State Filter",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "belief_update",
    args: "belief, transition, likelihood",
    desc: "Implement the predict-observe-normalize update for one action in a POMDP. The supplied transition matrix already corresponds to that action. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "belief[S] is a distribution; transition[S][S] is row-stochastic; likelihood[S] is the probability of the received observation in each next state. At least one state. If observation evidence is zero, return [].",
    output:
      "Return the normalized next-state belief, or [] when conditioning on this observation is undefined. Do not replace an impossible observation with a uniform belief.",
    equation:
      "b\\prime(s\\prime)=\\frac{O(o|s\\prime)\\sum_sP(s\\prime|s,a)b(s)}{\\sum_jO(o|j)\\sum_sP(j|s,a)b(s)}",
    hint: "Prediction sums over old states; the observation likelihood multiplies the predicted next-state mass.",
    solution:
      "def belief_update(belief, transition, likelihood):\n    predicted = [sum(belief[s] * transition[s][ns] for s in range(len(belief)))\n                 for ns in range(len(belief))]\n    weighted = [p * o for p, o in zip(predicted, likelihood)]\n    evidence = sum(weighted)\n    return [] if evidence == 0 else [p / evidence for p in weighted]",
    tests: [
      {
        args: [
          [0.5, 0.5],
          [
            [1, 0],
            [0, 1],
          ],
          [0.8, 0.2],
        ],
        expected: [0.8, 0.2],
      },
      {
        args: [
          [1, 0],
          [
            [0.25, 0.75],
            [0, 1],
          ],
          [1, 1],
        ],
        expected: [0.25, 0.75],
      },
      {
        args: [
          [0.5, 0.5],
          [
            [1, 0],
            [0, 1],
          ],
          [0, 0],
        ],
        expected: [],
      },
      {
        args: [[1], [[1]], [0.2]],
        expected: [1],
      },
    ],
    proof:
      "Derive the update from the Markov transition and Bayes’ rule, including the evidence-zero case. Prove the displayed identity under the stated assumptions: \\[b\\prime(s\\prime)=\\frac{O(o|s\\prime)\\sum_sP(s\\prime|s,a)b(s)}{\\sum_jO(o|j)\\sum_sP(j|s,a)b(s)}\\]",
    proofSteps: [
      {
        text: "Marginalize the previous hidden state.",
        tex: "\\bar b(s\\prime)=\\sum_sP(s\\prime|s,a)b(s)",
      },
      {
        text: "Multiply prediction by observation likelihood to obtain joint mass.",
        tex: "p(s\\prime,o|h,a)=O(o|s\\prime)\\bar b(s\\prime)",
      },
      {
        text: "Normalize by the observation evidence only when it is positive.",
        tex: "b\\prime(s\\prime)=\\frac{O(o|s\\prime)\\bar b(s\\prime)}{p(o|h,a)},\\quad p(o|h,a)>0",
      },
    ],
    checks: [
      "I summed over previous states with the correct transition orientation.",
      "I derived the normalizer as observation evidence.",
      "I handled zero evidence as undefined conditioning rather than inventing a posterior.",
    ],
    complexity: "O(S²) time and O(S) auxiliary space.",
    example:
      "belief_update([0.5, 0.5], [[1, 0], [0, 1]], [0.8, 0.2]) → [0.8, 0.2]",
  },
  {
    id: "atlas-offline-cql",
    atlasTopic: "offline-cql",
    title: "Discrete CQL Penalty and Gradient",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "cql_penalty",
    args: "q_values, data_probabilities",
    desc: "Implement the discrete conservative penalty and its Q-vector gradient at one state. This is only the regularizer: full CQL also requires TD fitting and an appropriate offline algorithm. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty finite Q values and nonnegative empirical data-action probabilities summing to one.",
    output:
      "Return [logsumexp(Q)-dot(data_probabilities,Q), gradient], where gradient is softmax(Q)-data_probabilities.",
    equation:
      "C(Q)=\\log\\sum_ae^{Q_a}-\\sum_ad_aQ_a,\\quad\\nabla_QC=\\operatorname{softmax}(Q)-d",
    hint: "Use a maximum-shifted log-sum-exp. A common additive Q shift cancels from the penalty.",
    solution:
      "def cql_penalty(q_values, data_probabilities):\n    import math\n    maximum = max(q_values)\n    weights = [math.exp(q - maximum) for q in q_values]\n    total = sum(weights)\n    penalty = maximum + math.log(total) - sum(p * q for p, q in zip(data_probabilities, q_values))\n    return [penalty, [w / total - d for w, d in zip(weights, data_probabilities)]]",
    tests: [
      {
        args: [
          [0, 0],
          [1, 0],
        ],
        expected: [0.6931471805599453, [-0.5, 0.5]],
      },
      {
        args: [
          [1000, 1000],
          [0.25, 0.75],
        ],
        expected: [0.6931471805599453, [0.25, -0.25]],
      },
      {
        args: [[7], [1]],
        expected: [0, [0]],
      },
      {
        args: [
          [0, 0, 0],
          [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
        ],
        expected: [1.0986122886681098, [0, 0, 0]],
      },
    ],
    proof:
      "Derive the gradient and prove invariance to a common additive shift of Q. Prove the displayed identity under the stated assumptions: \\[C(Q)=\\log\\sum_ae^{Q_a}-\\sum_ad_aQ_a,\\quad\\nabla_QC=\\operatorname{softmax}(Q)-d\\]",
    proofSteps: [
      {
        text: "Differentiate the log partition function.",
        tex: "\\partial_{Q_j}\\log\\sum_ae^{Q_a}=\\frac{e^{Q_j}}{\\sum_ae^{Q_a}}",
      },
      {
        text: "Subtract the data expectation derivative.",
        tex: "\\partial_{Q_j}C=\\operatorname{softmax}(Q)_j-d_j",
      },
      {
        text: "A common constant appears once in each normalized term and cancels.",
        tex: "C(Q+c\\mathbf1)=c+\\log\\sum_ae^{Q_a}-\\sum_ad_aQ_a-c\\sum_ad_a=C(Q)",
      },
    ],
    checks: [
      "I derived both gradient terms and checked that their components sum to zero.",
      "I used normalized empirical action probabilities for shift invariance.",
      "I distinguished this discrete regularizer from full CQL and avoided claiming a lower bound for every trained critic.",
    ],
    complexity: "O(A) time and O(A) output space.",
    example: "cql_penalty([0, 0], [1, 0]) → [0.6931471805599453, [-0.5, 0.5]]",
  },
  {
    id: "atlas-offline-iql",
    atlasTopic: "offline-iql",
    title: "IQL Expectile Fit and Advantage Weights",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "iql_expectile",
    args: "q_values, probabilities, tau, beta",
    desc: "Fit a scalar expectile of a fixed finite Q distribution by bisection, then compute normalized behavior-weighted advantage exponential action weights. This is a tabular population illustration of IQL, not its full neural trainer. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty finite Q values, matching strictly positive probabilities summing to one, 0 < tau < 1, beta >= 0. Perform 100 bisection iterations, or return the sole Q value for constant Q.",
    output:
      "Return [expectile_value, normalized_weights]. Normalize probabilities[i]*exp(beta*(Q_i-V)) using a stable shift.",
    equation:
      "\\sum_ip_i|\\tau-\\mathbf1_{Q_i-V<0}|(Q_i-V)=0,\\quad w_i\\propto p_i e^{\\beta(Q_i-V)}",
    hint: "The expectile root is monotone in V and lies between min(Q) and max(Q). Do not compute a quantile.",
    solution:
      "def iql_expectile(q_values, probabilities, tau, beta):\n    import math\n    low, high = min(q_values), max(q_values)\n    for _ in range(100):\n        value = (low + high) / 2\n        score = sum(p * (tau if q >= value else 1 - tau) * (q - value)\n                    for q, p in zip(q_values, probabilities))\n        if score > 0:\n            low = value\n        else:\n            high = value\n    value = (low + high) / 2\n    maximum = max(q_values)\n    weights = [p * math.exp(beta * (q - maximum)) for p, q in zip(probabilities, q_values)]\n    total = sum(weights)\n    return [value, [w / total for w in weights]]",
    tests: [
      {
        args: [[0, 10], [0.5, 0.5], 0.8, 0],
        expected: [8, [0.5, 0.5]],
      },
      {
        args: [[0, 10], [0.5, 0.5], 0.5, 0],
        expected: [5, [0.5, 0.5]],
      },
      {
        args: [[3, 3], [0.2, 0.8], 0.9, 3],
        expected: [3, [0.2, 0.8]],
      },
      {
        args: [[2], [1], 0.2, 100],
        expected: [2, [1]],
      },
    ],
    proof:
      "Derive the expectile first-order condition, show tau one-half recovers the mean, and prove that a state-only value offset cancels from normalized fixed-Q action weights. Prove the displayed identity under the stated assumptions: \\[\\sum_ip_i|\\tau-\\mathbf1_{Q_i-V<0}|(Q_i-V)=0,\\quad w_i\\propto p_i e^{\\beta(Q_i-V)}\\]",
    proofSteps: [
      {
        text: "Differentiate asymmetric squared residuals on either side of zero.",
        tex: "L(V)=\\sum_ip_i|\\tau-\\mathbf1_{Q_i-V<0}|(Q_i-V)^2,\\quad\\partial_VL=-2\\sum_ip_iw_\\tau(Q_i-V)(Q_i-V)",
      },
      {
        text: "At tau one-half every residual has the same coefficient.",
        tex: "\\tau=\\tfrac12\\Rightarrow\\sum_ip_i(Q_i-V)=0\\Rightarrow V=\\mathbb E_pQ",
      },
      {
        text: "Cancel the common state-only factor in normalized weights.",
        tex: "\\frac{p_i e^{\\beta(Q_i-V)}}{\\sum_jp_je^{\\beta(Q_j-V)}}=\\frac{p_i e^{\\beta Q_i}}{\\sum_jp_je^{\\beta Q_j}}",
      },
    ],
    checks: [
      "I differentiated squared residuals and solved a monotone score root, not a quantile.",
      "I proved the mean special case.",
      "I canceled only the common baseline for fixed Q and did not claim expectile fitting is irrelevant to full IQL.",
    ],
    complexity: "O(100A) time and O(A) output space.",
    example: "iql_expectile([0, 10], [0.5, 0.5], 0.8, 0) → [8, [0.5, 0.5]]",
  },
  {
    id: "atlas-imitation",
    atlasTopic: "imitation",
    title: "Behavioral Cloning Loss and Distribution Shift Bound",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "cloning_metrics",
    args: "logits, expert_probabilities, horizon, epsilon",
    desc: "Compute population behavioral-cloning cross-entropy and its logit gradient at one covered state, plus an illustrative sequential error upper bound. The bound is a separate worst-case calculation, not measured imitation performance. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty finite logits and nonnegative expert probabilities summing to one; integer horizon >= 0; epsilon in [0,1]. For the bound assume unit-bounded per-step loss, zero loss before the first mistake, and first-mistake probability at each step <= epsilon.",
    output:
      "Return [cross_entropy, logit_gradient, sum_{t=1}^horizon min(1,t*epsilon)]. Compute log probabilities stably even for very unfavorable logits.",
    equation:
      "L=-\\sum_a\\pi_E(a)\\log\\pi_\\theta(a),\\quad\\nabla_zL=\\pi_\\theta-\\pi_E,\\quad\\mathbb E[L_T]\\leq\\sum_{t=1}^T\\min(1,t\\epsilon)",
    hint: "Use logsumexp minus the expert-weighted logits; a probability may underflow, but the corresponding log probability must remain finite.",
    solution:
      "def cloning_metrics(logits, expert_probabilities, horizon, epsilon):\n    import math\n    maximum = max(logits)\n    weights = [math.exp(z - maximum) for z in logits]\n    total = sum(weights)\n    log_z = maximum + math.log(total)\n    loss = sum(p * (log_z - z) for p, z in zip(expert_probabilities, logits))\n    gradient = [w / total - p for w, p in zip(weights, expert_probabilities)]\n    bound = sum(min(1, t * epsilon) for t in range(1, horizon + 1))\n    return [loss, gradient, bound]",
    tests: [
      {
        args: [[0, 0], [1, 0], 3, 0.1],
        expected: [0.6931471805599453, [-0.5, 0.5], 0.6],
      },
      {
        args: [[1000, -1000], [0, 1], 0, 0],
        expected: [2000, [1, -1], 0],
      },
      {
        args: [[0, 0], [0.5, 0.5], 10, 0.1],
        expected: [0.6931471805599453, [0, 0], 5.5],
      },
      {
        args: [[4], [1], 3, 1],
        expected: [0, [0], 3],
      },
    ],
    proof:
      "Derive the softmax cross-entropy gradient and justify the sequential error bound using a union bound. Prove the displayed identity under the stated assumptions: \\[L=-\\sum_a\\pi_E(a)\\log\\pi_\\theta(a),\\quad\\nabla_zL=\\pi_\\theta-\\pi_E,\\quad\\mathbb E[L_T]\\leq\\sum_{t=1}^T\\min(1,t\\epsilon)\\]",
    proofSteps: [
      {
        text: "Write the loss as log-partition minus expert-weighted logits.",
        tex: "L=\\log\\sum_ae^{z_a}-\\sum_a\\pi_E(a)z_a",
      },
      {
        text: "Differentiate each term.",
        tex: "\\partial_{z_j}L=\\pi_\\theta(j)-\\pi_E(j)",
      },
      {
        text: "Under the first-mistake assumptions, bound expected per-step loss and sum.",
        tex: "\\Pr(\\text{mistake by }t)\\leq\\min(1,t\\epsilon)\\Rightarrow\\mathbb E[L_T]\\leq\\sum_{t=1}^T\\min(1,t\\epsilon)",
      },
    ],
    checks: [
      "I derived the cross-entropy gradient with normalized expert probabilities.",
      "I stated the first-mistake and bounded-loss assumptions for the union bound.",
      "I separated population loss on covered states from learner rollout performance.",
    ],
    complexity: "O(A+T) time and O(A) output space.",
    example:
      "cloning_metrics([0, 0], [1, 0], 3, 0.1) → [0.6931471805599453, [-0.5, 0.5], 0.6]",
  },
  {
    id: "atlas-multi-agent",
    atlasTopic: "multi-agent",
    title: "Zero-Sum Payoffs and Pure-Response Exploitability",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "zero_sum_metrics",
    args: "payoffs, row_policy, column_policy",
    desc: "Compute expected payoffs and pure best-response gains for a finite two-player zero-sum game. This evaluates supplied mixed policies; it is not an equilibrium-learning algorithm. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "payoffs[R][C] is the row player reward; the column player receives its negative. Both supplied policies are nonnegative distributions of matching dimensions.",
    output:
      "Return [expected_row_payoff, row_best_response_gain, column_best_response_gain]. Gains are nonnegative up to floating-point error. Do not add arbitrary clipping.",
    equation:
      "v=p^\\top Aq,\\quad e_{\\rm row}=\\max_i(Aq)_i-v,\\quad e_{\\rm col}=v-\\min_j(p^\\top A)_j",
    hint: "Against a fixed mixed opponent, best-response payoff is linear in the responding distribution, so a pure maximizing/minimizing action suffices.",
    solution:
      "def zero_sum_metrics(payoffs, row_policy, column_policy):\n    row_values = [sum(a * q for a, q in zip(row, column_policy)) for row in payoffs]\n    col_values = [sum(row_policy[i] * payoffs[i][j] for i in range(len(payoffs)))\n                  for j in range(len(column_policy))]\n    value = sum(p * v for p, v in zip(row_policy, row_values))\n    return [value, max(row_values) - value, value - min(col_values)]",
    tests: [
      {
        args: [
          [
            [1, -1],
            [-1, 1],
          ],
          [0.5, 0.5],
          [0.5, 0.5],
        ],
        expected: [0, 0, 0],
      },
      {
        args: [
          [
            [1, -1],
            [-1, 1],
          ],
          [1, 0],
          [1, 0],
        ],
        expected: [1, 0, 2],
      },
      {
        args: [[[3, 3]], [1], [0.25, 0.75]],
        expected: [3, 0, 0],
      },
      {
        args: [
          [
            [1, -1],
            [-1, 1],
          ],
          [0.5, 0.5],
          [1, 0],
        ],
        expected: [0, 1, 0],
      },
    ],
    proof:
      "Prove nonnegative best-response gains and explain why both zero gains give a Nash equilibrium for this specified zero-sum game. Prove the displayed identity under the stated assumptions: \\[v=p^\\top Aq,\\quad e_{\\rm row}=\\max_i(Aq)_i-v,\\quad e_{\\rm col}=v-\\min_j(p^\\top A)_j\\]",
    proofSteps: [
      {
        text: "The row value is a convex combination of pure-response values.",
        tex: "v=\\sum_ip_i(Aq)_i\\leq\\max_i(Aq)_i",
      },
      {
        text: "The column mixture averages its pure-response payoffs.",
        tex: "v=\\sum_jq_j(p^\\top A)_j\\geq\\min_j(p^\\top A)_j",
      },
      {
        text: "When both inequalities are equalities, neither player can improve unilaterally.",
        tex: "e_{\\rm row}=e_{\\rm col}=0\\Rightarrow p^\\top Aq\\geq\\tilde p^\\top Aq,\\quad p^\\top Aq\\leq p^\\top A\\tilde q",
      },
    ],
    checks: [
      "I used opposite payoffs for the column player.",
      "I proved both gains are nonnegative through convex combinations.",
      "I connected zero gains to unilateral deviations without promising independent learners converge.",
    ],
    complexity: "O(RC) time and O(R+C) auxiliary space.",
    example:
      "zero_sum_metrics([[1, -1], [-1, 1]], [0.5, 0.5], [0.5, 0.5]) → [0, 0, 0]",
  },
  {
    id: "atlas-dpo",
    atlasTopic: "dpo",
    title: "DPO Pair Loss and Analytic Margin Gradient",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "dpo_pair",
    args: "policy_chosen, policy_rejected, reference_chosen, reference_rejected, beta",
    desc: "Implement the DPO logistic loss for one preference pair using sequence log probabilities and return its derivatives with respect to the two policy log probabilities. Reference log probabilities are fixed. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Four finite sequence log probabilities and beta > 0. They are already sums over tokens; do not exponentiate individual sequence probabilities.",
    output:
      "Return [loss, derivative_policy_chosen, derivative_policy_rejected]. Compute softplus and sigmoid stably for large margins. This is an offline preference-pair kernel, not an online rollout optimizer.",
    equation:
      "m=\\beta[(\\log\\pi_c-\\log q_c)-(\\log\\pi_r-\\log q_r)],\\quad L=\\log(1+e^{-m})",
    hint: "Use max(0,-m)+log1p(exp(-abs(m))). The chosen derivative is -beta*sigmoid(-m), and the rejected derivative has the opposite sign.",
    solution:
      "def dpo_pair(policy_chosen, policy_rejected, reference_chosen, reference_rejected, beta):\n    import math\n    margin = beta * ((policy_chosen - reference_chosen) - (policy_rejected - reference_rejected))\n    loss = max(0.0, -margin) + math.log1p(math.exp(-abs(margin)))\n    if margin >= 0:\n        e = math.exp(-margin)\n        tail = e / (1 + e)\n    else:\n        tail = 1 / (1 + math.exp(margin))\n    return [loss, -beta * tail, beta * tail]",
    tests: [
      {
        args: [-2, -3, -2, -3, 0.5],
        expected: [0.6931471805599453, -0.25, 0.25],
      },
      {
        args: [0, -1000, 0, 0, 1],
        expected: [0, 0, 0],
      },
      {
        args: [-1000, 0, 0, 0, 1],
        expected: [1000, -1, 1],
      },
      {
        args: [-1, -1, -2, -2, 2],
        expected: [0.6931471805599453, -1, 1],
      },
    ],
    proof:
      "Derive the margin derivatives and explain why the reference is fixed and the training objective uses preference pairs. Prove the displayed identity under the stated assumptions: \\[m=\\beta[(\\log\\pi_c-\\log q_c)-(\\log\\pi_r-\\log q_r)],\\quad L=\\log(1+e^{-m})\\]",
    proofSteps: [
      {
        text: "Differentiate the logistic loss with respect to its margin.",
        tex: "\\partial_m\\log(1+e^{-m})=-\\sigma(-m)",
      },
      {
        text: "Apply the chosen/rejected log-probability chain rule.",
        tex: "\\partial_{\\log\\pi_c}L=-\\beta\\sigma(-m),\\quad\\partial_{\\log\\pi_r}L=\\beta\\sigma(-m)",
      },
      {
        text: "A shared policy-log-probability offset cancels from this pair margin.",
        tex: "m(\\log\\pi_c+k,\\log\\pi_r+k)=m(\\log\\pi_c,\\log\\pi_r)",
      },
    ],
    checks: [
      "I differentiated the loss through the beta-scaled reference-relative margin.",
      "I kept reference log probabilities fixed and used stable formulas at extreme margins.",
      "I distinguished independent log-probability partials from full model gradients and DPO from online RL.",
    ],
    complexity:
      "O(1) time and O(1) space for precomputed sequence log probabilities.",
    example:
      "dpo_pair(-2, -3, -2, -3, 0.5) → [0.6931471805599453, -0.25, 0.25]",
  },
  {
    id: "atlas-rubric-grpo",
    atlasTopic: "rubric-grpo",
    title: "Gated Rubric Rewards and Group Advantages",
    level: "Hard",
    topic: "",
    minutes: 70,
    hybrid: true,
    fn: "rubric_group",
    args: "scores, weights, gates, epsilon",
    desc: "Aggregate normalized rubric criteria for each candidate, apply hard gates, and compute population-standardized within-group advantages. This prepares GRPO rewards; it does not itself perform a policy update or KL estimation. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Nonempty scores[G][K] with entries in [0,1], nonnegative weights[K] with positive sum, Boolean gates[G], epsilon > 0. Use population variance with divisor G, not G-1.",
    output:
      "Return [gated_rewards, advantages]. Reward_i is zero for a failed gate, otherwise the weighted mean. Divide centered rewards by sqrt(population_variance)+epsilon; an equal-reward group gives zero advantages.",
    equation:
      "R_i=g_i\\frac{\\sum_kw_ks_{ik}}{\\sum_kw_k},\\quad A_i=\\frac{R_i-\\bar R}{\\sqrt{G^{-1}\\sum_j(R_j-\\bar R)^2}+\\epsilon}",
    hint: "Gate before computing group mean and variance. Epsilon is added after the square root by this lab’s convention.",
    solution:
      "def rubric_group(scores, weights, gates, epsilon):\n    import math\n    total_weight = sum(weights)\n    rewards = [sum(w * s for w, s in zip(weights, row)) / total_weight if gate else 0.0\n               for row, gate in zip(scores, gates)]\n    mean = sum(rewards) / len(rewards)\n    std = math.sqrt(sum((r - mean) ** 2 for r in rewards) / len(rewards))\n    return [rewards, [(r - mean) / (std + epsilon) for r in rewards]]",
    tests: [
      {
        args: [[[0], [1]], [1], [true, true], 0.5],
        expected: [
          [0, 1],
          [-0.5, 0.5],
        ],
      },
      {
        args: [
          [
            [1, 1],
            [1, 1],
          ],
          [1, 3],
          [false, true],
          0.5,
        ],
        expected: [
          [0, 1],
          [-0.5, 0.5],
        ],
      },
      {
        args: [[[0.8], [0.8]], [1], [true, true], 0.01],
        expected: [
          [0.8, 0.8],
          [0, 0],
        ],
      },
      {
        args: [[[1]], [1], [true], 0.01],
        expected: [[1], [0]],
      },
    ],
    proof:
      "Prove reward bounds and zero mean of group advantages. Explain why this is not a claim of an unbiased return estimator or always unit advantage variance. Prove the displayed identity under the stated assumptions: \\[R_i=g_i\\frac{\\sum_kw_ks_{ik}}{\\sum_kw_k},\\quad A_i=\\frac{R_i-\\bar R}{\\sqrt{G^{-1}\\sum_j(R_j-\\bar R)^2}+\\epsilon}\\]",
    proofSteps: [
      {
        text: "A normalized nonnegative weighted average lies in the score interval; a gate maps it to zero.",
        tex: "0\\leq\\frac{\\sum_kw_ks_{ik}}{\\sum_kw_k}\\leq1\\Rightarrow0\\leq R_i\\leq1",
      },
      {
        text: "The common denominator allows centered rewards to sum to zero.",
        tex: "\\sum_iA_i=\\frac{\\sum_iR_i-G\\bar R}{\\sigma+\\epsilon}=0",
      },
      {
        text: "Compute the population advantage variance under the explicit epsilon convention.",
        tex: "\\frac1G\\sum_iA_i^2=\\frac{\\sigma^2}{(\\sigma+\\epsilon)^2}\\leq1",
      },
    ],
    checks: [
      "I normalized nonnegative weights and applied gates before group statistics.",
      "I used population variance and added epsilon after the square root.",
      "I proved zero group mean, handled constant groups and did not claim group advantages are exact action values.",
    ],
    complexity: "O(GK) time and O(G) output space.",
    example:
      "rubric_group([[0], [1]], [1], [True, True], 0.5) → [[0, 1], [-0.5, 0.5]]",
  },
  {
    id: "atlas-constrained-rl",
    atlasTopic: "constrained-rl",
    title: "Projected Dual Update for a Cost Constraint",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "constrained_step",
    args: "reward_gradient, cost_gradient, multiplier, observed_cost, budget, actor_rate, dual_rate",
    desc: "Implement a local primal/dual step for maximizing reward subject to an expected-cost budget. Return an actor parameter increment and a projected nonnegative multiplier. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal finite gradient vectors evaluated at old parameters; multiplier >= 0; actor_rate,dual_rate >= 0; finite observed_cost and budget. Use the old multiplier for the actor increment; observed_cost is an estimate, not an exact expected cost.",
    output:
      "Return [actor_increment, new_multiplier]. Cost violation increases the multiplier, penalizing future expensive actions.",
    equation:
      "\\Delta\\theta=\\eta_\\theta(g_R-\\lambda g_C),\\quad\\lambda^+=\\max(0,\\lambda+\\eta_\\lambda(\\hat J_C-d))",
    hint: "With L=J_R-lambda*(J_C-budget), maximize over theta and minimize over lambda. The two update directions differ.",
    solution:
      "def constrained_step(reward_gradient, cost_gradient, multiplier, observed_cost, budget, actor_rate, dual_rate):\n    increment = [actor_rate * (r - multiplier * c) for r, c in zip(reward_gradient, cost_gradient)]\n    new_multiplier = max(0.0, multiplier + dual_rate * (observed_cost - budget))\n    return [increment, new_multiplier]",
    tests: [
      {
        args: [[2, 1], [1, 3], 0.5, 4, 2, 0.1, 0.2],
        expected: [[0.15, -0.05], 0.9],
      },
      {
        args: [[1], [2], 0.1, 0, 10, 1, 1],
        expected: [[0.8], 0],
      },
      {
        args: [[1], [2], 0, 5, 1, 1, 0.5],
        expected: [[1], 2],
      },
      {
        args: [[3], [1], 2, 7, 7, 0, 0],
        expected: [[0], 2],
      },
    ],
    proof:
      "Derive both update signs from the constrained maximization Lagrangian and explain the nonnegative projection. Prove the displayed identity under the stated assumptions: \\[\\Delta\\theta=\\eta_\\theta(g_R-\\lambda g_C),\\quad\\lambda^+=\\max(0,\\lambda+\\eta_\\lambda(\\hat J_C-d))\\]",
    proofSteps: [
      {
        text: "Write the maximization-form Lagrangian.",
        tex: "\\mathcal L(\\theta,\\lambda)=J_R(\\theta)-\\lambda(J_C(\\theta)-d),\\quad\\lambda\\geq0",
      },
      {
        text: "Take primal ascent with the old multiplier.",
        tex: "\\nabla_\\theta\\mathcal L=\\nabla J_R-\\lambda\\nabla J_C",
      },
      {
        text: "Take dual descent and project onto the nonnegative half-line.",
        tex: "\\lambda^+=\\Pi_{[0,\\infty)}(\\lambda-\\eta_\\lambda\\partial_\\lambda\\mathcal L)=\\max(0,\\lambda+\\eta_\\lambda(J_C-d))",
      },
    ],
    checks: [
      "I derived the primal-ascent and dual-descent signs from the same Lagrangian.",
      "I used the old multiplier for the actor step and projected the new multiplier.",
      "I distinguished noisy observed cost from expectation and did not promise feasibility or convergence from one step.",
    ],
    complexity: "O(D) time and O(D) output space.",
    example:
      "constrained_step([2, 1], [1, 3], 0.5, 4, 2, 0.1, 0.2) → [[0.15, -0.05], 0.9]",
  },
  {
    id: "atlas-evaluation",
    atlasTopic: "evaluation",
    title: "Paired-Seed Evaluation with a Known-Variance Interval",
    level: "Medium",
    topic: "",
    minutes: 45,
    hybrid: true,
    fn: "paired_evaluation",
    args: "returns_a, returns_b, known_sigma_difference, z",
    desc: "Compare two algorithms using paired evaluation runs and a normal interval with a supplied known standard deviation of paired differences. This is not an estimated-variance t interval or a benchmark replication. Implement using Python loops and the standard library only; do not use NumPy, automatic differentiation or an RL library.",
    input:
      "Equal nonempty finite return arrays with genuinely paired runs; known_sigma_difference >= 0; z >= 0. For an exact normal interval, paired differences are independent Gaussian draws with the given known sigma. Pairing does not guarantee positive covariance.",
    output:
      "Return [mean_difference_A_minus_B, standard_error, interval_low, interval_high]. z=1.96 gives approximately 95% coverage under the stated normal assumptions.",
    equation:
      "D_i=R_i^A-R_i^B,\\quad\\bar D=\\frac1N\\sum_iD_i,\\quad\\operatorname{SE}=\\frac{\\sigma_D}{\\sqrt N},\\quad I=[\\bar D-z\\operatorname{SE},\\bar D+z\\operatorname{SE}]",
    hint: "Use the supplied sigma of differences, not either algorithm’s sigma, and preserve the A-minus-B sign.",
    solution:
      "def paired_evaluation(returns_a, returns_b, known_sigma_difference, z):\n    import math\n    mean = sum(a - b for a, b in zip(returns_a, returns_b)) / len(returns_a)\n    se = known_sigma_difference / math.sqrt(len(returns_a))\n    return [mean, se, mean - z * se, mean + z * se]",
    tests: [
      {
        args: [[3, 5, 7, 9], [1, 3, 5, 7], 2, 1.96],
        expected: [2, 1, 0.04, 3.96],
      },
      {
        args: [[1], [4], 0, 1.96],
        expected: [-3, 0, -3, -3],
      },
      {
        args: [[1, 2], [1, 2], 1, 0],
        expected: [0, 0.7071067811865475, 0, 0],
      },
      {
        args: [[10, 0], [0, 10], 2, 2],
        expected: [
          0, 1.4142135623730951, -2.8284271247461903, 2.8284271247461903,
        ],
      },
    ],
    proof:
      "Derive the standard error under independent paired differences, and show how cross-algorithm covariance affects variance reduction from pairing. Prove the displayed identity under the stated assumptions: \\[D_i=R_i^A-R_i^B,\\quad\\bar D=\\frac1N\\sum_iD_i,\\quad\\operatorname{SE}=\\frac{\\sigma_D}{\\sqrt N},\\quad I=[\\bar D-z\\operatorname{SE},\\bar D+z\\operatorname{SE}]\\]",
    proofSteps: [
      {
        text: "Use independence across pairs to compute the mean-difference variance.",
        tex: "\\operatorname{Var}(\\bar D)=\\frac1{N^2}\\sum_i\\operatorname{Var}(D_i)=\\frac{\\sigma_D^2}{N}",
      },
      {
        text: "Expand the variance within one pair.",
        tex: "\\sigma_D^2=\\sigma_A^2+\\sigma_B^2-2\\operatorname{Cov}(R^A,R^B)",
      },
      {
        text: "Under the known-variance Gaussian model, standardize the mean for the stated interval.",
        tex: "\\frac{\\bar D-\\mu_D}{\\sigma_D/\\sqrt N}\\sim\\mathcal N(0,1),\\quad\\sigma_D>0",
      },
    ],
    checks: [
      "I stated independence across pairs and used sigma of paired differences.",
      "I derived the covariance term and did not claim pairing always helps.",
      "I distinguished exact Gaussian known-variance inference from asymptotic or estimated-variance alternatives.",
    ],
    complexity: "O(N) time and O(1) auxiliary space.",
    example:
      "paired_evaluation([3, 5, 7, 9], [1, 3, 5, 7], 2, 1.96) → [2, 1, 0.04, 3.96]",
  },
];
