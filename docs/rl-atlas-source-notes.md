# Visual RL & Deep RL atlas: sources and review

The extended atlas contains **35 topics**, **248 equation/derivation displays**, and **35 original browser animations**. Explanations and proofs were authored for RL Atlas; linked course text, figures, videos and implementation files were not copied into the site. This is a curated path through major concepts, not a claim to cover every RL subfield or paper.

## Requested resources

Reviewed during development on 14 November 2026:

- [NeatRL](https://www.neatrl.com/): the from-scratch curriculum and its summaries of DQN, Double DQN, dueling architectures and policy-based methods.
- [CleanRL](https://docs.cleanrl.dev/): algorithm catalog and DQN/C51 implementation documentation. Links to PPO, SAC, RND and recurrent variants give implementation follow-up.
- [Spinning Up](https://spinningup.openai.com/en/latest/): key concepts, trajectory policy-gradient derivation, PPO, TRPO, TD3 and SAC documentation. VPG/DDPG links supplement those readings.
- [Hugging Face course](https://huggingface.co/learn/deep-rl-course/en/unit0/introduction): syllabus, tabular Q-learning discussion and the multi-agent course branch. Imitation learning is linked through its course syllabus and primary papers.
- [The supplied YouTube playlist](https://www.youtube.com/playlist?list=PLqYmG7hTraZDVH599EItlEWsUOsJbAodm): retained as a further-study resource. Automated access returned HTTP 403; no transcript, video titles or lecture-specific claims were invented.

Every topic has a reading list in `src/atlas-sources.js`. Offline RL, model-based bounds, POMDPs, imitation/multi-agent learning, constrained optimization and preference/group-reward optimization additionally cite primary or extension papers. They are not presented as material necessarily covered by all five requested resources.

## Mathematical conventions

- `r_t` denotes the reward after action `a_t`. Infinite-horizon bounds use bounded rewards and `0 <= gamma < 1`; finite episodic tasks can use gamma one under appropriate integrability.
- A bootstrap mask is zero at a true task terminal. A data-collection time limit does not automatically terminate the modeled continuing task.
- The policy-gradient reward-to-go formula includes `gamma^t` for the start-state discounted objective. The normalized discounted-occupancy version includes `1/(1-gamma)`.
- A state-only baseline has zero expected score correction. It is not generally the exact variance-minimizing baseline; actor advantages are detached.
- Monte Carlo/TD, traces and GAE distinguish true terminals from rollout boundaries. GAE at lambda one telescopes to a bootstrapped return minus the old value, not unconditionally to a completed-episode return.
- DQN targets are detached. The tabular Bellman contraction is not a neural-network convergence proof. Double estimation and dueling action centering are separate mechanisms.
- PER's unbiased uniform-replay identity uses beta one and unnormalized weights. C51's integer-index projection retains the entire atom mass.
- TRPO's quadratic step assumes a suitable local positive-definite metric. PPO's negative-advantage branch clips on the opposite side, and clipping is not a hard global KL constraint.
- DDPG's replay actor objective is a stated surrogate. TD3's minimum is not a certified lower confidence bound. SAC's tanh density needs its Jacobian, and the discrete softmax illustration is not a continuous-control benchmark.
- Model-based value bounds state a uniform total-variation assumption. The separate mismatch-probability illustration is a toy coupling model.
- CQL's discrete penalty is distinct from its full TD-fitting objective. An expectile is not a quantile; a state-only IQL baseline cancels in normalized fixed-Q action weights.
- DPO is described as an offline preference likelihood objective, not online environment interaction. GRPO states group-standard-deviation, normalization, support and KL-estimation conventions explicitly.
- Nash reasoning uses a specified zero-sum game; independent learners are not promised convergence. Behavioral-cloning error curves are bounds, not measured losses. The doubly robust display is explicitly a contextual-bandit formula.
- The evaluation animation is one seeded Gaussian experiment with known sigma, not an RL benchmark or evidence of measured confidence-interval coverage.

## Interactive presentation

`src/atlas-scenes.js` is a pure numerical model library. The renderer draws vector plots, probability bars, state graphs, local KL geometry and parameter-dependent markers. Play/pause, stepping, reset, scrubbing, keyboard-native sliders, responsive scrolling and reduced-motion behavior share one lifecycle with route cleanup. Values are recomputed from the displayed parameter. Some frames reveal a fixed mathematical object; that is not claimed to be a sampled training trajectory.

Derivation steps can be revealed individually. Local quizzes explain the reasoning, and self-review is tracked separately from core-course completion and lab grading. Each topic exposes its overview, equations, proof and practice to the tutor and built-in MCP course tools. Slider changes are not silently sent as tutor context.

## Verification

Automated checks validate every static formula and every numerical scene formula at all step/parameter endpoints with KaTeX. Numerical invariants include contraction ratios, DP propagation, GAE sums, C51 mass/mean preservation, PPO sign branches, soft-value identities, normalized KL optima, importance correction, expectiles, shaping offsets, group advantages and local trust-region budgets. Browser checks cover all 35 routes, responsive content, proof reveal, quizzes, self-review, animation teardown/reduced motion, search ranking and section-aware tutor requests.

These checks verify the implemented illustrations and identities. They do not establish universal neural-RL convergence, formally certify proofs, or reproduce paper benchmark results.
