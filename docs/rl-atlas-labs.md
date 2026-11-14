# From the RL atlas to Python and mathematical proofs

The 35-topic atlas now links to **36 Python labs**, including **33 required proof-and-code problems** and three coding warm-ups. The original nine exercise IDs are retained, so existing drafts and saved progress remain available. The 27 new problems extend implementation practice through deep RL, offline evaluation/learning, imitation and multi-agent methods, preference/group rewards, constraints and evaluation.

Each problem starts with an empty function, specifies inputs/outputs and edge cases, exposes public cases and a small hint, and links back to the matching theory and interactive illustration. The Editorial contains an original Python reference implementation, a mathematical derivation and complexity analysis. Tests run in a disposable local Pyodide worker. The standard library is allowed; numerical updates must be implemented without RL libraries or automatic differentiation.

A hybrid problem requires passing code cases, a proof draft of at least 80 characters and every exercise-specific rubric checkbox. This is explicitly **self-review**, not automated proof verification. Three coding warm-ups retain their original completion rules and now also provide mathematical editorials. Numerical testing does not establish mathematical correctness, convergence or generalization.

## Scope

- Foundations: policy-induced transition matrices, returns, expectations, Bellman backups, value iteration, n-step returns, Q-learning and UCB scores.
- Deep value learning: linear value regression, an actual batch gradient step for a linear DQN head, separate Double DQN selection/evaluation with dueling centering, PER and C51.
- Policy optimization: REINFORCE, baseline cancellation, one-step actor-critic, GAE, a diagonal-Fisher trust-region subproblem and the PPO clipping objective/log-ratio derivative.
- Continuous control: the deterministic tanh-actor chain rule, clipped TD3 target-policy noise and twin critics, and the discrete entropy-regularized soft-value optimum.
- Beyond fully observed on-policy control: trajectory IS and separately scoped contextual-bandit DR, learned-model planning and a fixed-policy model-error bound, Bayesian belief filtering, CQL regularization, IQL expectiles/advantage weights, behavioral cloning and zero-sum best responses.
- Reward learning and evaluation: potential shaping, bounded gated rubric rewards, a finite-action KL-regularized policy step, DPO pair derivatives, GRPO-style group preparation, constrained primal/dual updates and paired evaluation with a supplied known variance.

Large algorithms are split into explicitly named numerical kernels. A linear DQN step is not a complete neural agent; discrete soft values are not a continuous SAC trainer; reward standardization alone is not a GRPO policy optimizer. The finite-horizon optimal model planner and infinite-horizon fixed-policy error proof have different stated scopes. The off-policy problem explicitly separates sequential IS from first-decision contextual DR.

## Validation

Every reference implementation is checked against all public fixtures with CPython and in real browser Pyodide workers. All equations and proof-editorial steps are parsed by KaTeX. Independent finite-difference objectives check DQN, PPO, CQL, behavioral-cloning and DPO derivatives. Additional invariants cover GAE/n-step boundary agreement, C51 probability mass and clipped mean, exact PER correction, IQL shift behavior and trust-region budgets. Browser checks cover theory-to-lab navigation, mathematical editorials, hybrid acceptance/proof invalidation, advanced lab-specific tutor context and narrow-screen containment.

The new exercises are also included in the built-in MCP course search and `read_lesson` tool (use `section: "lab"` with the `labId` returned by search). Tutor context includes the selected exercise statement, signature, equation, hint and proof rubric. The reference implementation and the learner’s unsent code/proof drafts are not automatically included.
