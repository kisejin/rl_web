# RL Atlas

An interactive reinforcement learning course in English, from first principles to rubric-based rewards. The visual teaching approach is inspired by MLU Explain, with original design, content, and interactions.

## Run locally

Requires Node.js 22+ and npm. No API keys, database, or external runtime services are required.

```sh
npm ci --cache /tmp/rl-npm-cache
npm run dev -- --port 3000
```

For a production build:

```sh
npm run build
npm run preview -- --port 4173
```

The development server uses port 3000. Deploy `dist/` to a static host. Hash-based routing needs no URL rewrites. Fonts and KaTeX are bundled locally, so the app does not need a CDN at runtime.

## Manim animation library

The course now embeds ten original films rendered with **Manim Community 0.22.1**, the community-maintained version of the mathematical animation engine associated with 3Blue1Brown. Each module defaults to **Watch Manim**; switch to **Explore parameters** for the existing live numerical model. Films include mathematical writing and matching transforms, vector motion, native playback controls, speed selection, English captions, and a seekable transcript. They do not autoplay.

See [the animation sources and rendering guide](animations/README.md) for the library comparison, installation, licenses, and reproducible rendering commands. Manim is an authoring dependency: Vercel serves the generated MP4s and needs no Python server.

## Course and features

- Larger reading typography throughout: 18px lesson prose, 20px lesson introductions, 16px quiz options, and 14–15px code editors.
- Ten original, interactive mathematical scenes across all nine chapters, inspired by visual mathematical storytelling: discounted returns, expectations, MDP transitions, Bellman contraction, synchronous DP, TD updates, REINFORCE, telescoping potential shaping, rubric aggregation, and KL-regularized optimization. Each scene includes Play/Pause, step navigation, a scrubber, a parameter slider, computed equations, and explanatory narration. There is no autoplay; smooth transitions respect reduced-motion preferences. Diagrams can be scrolled on narrow screens to keep their labels readable.
- Step-by-step proof highlighting with controls to focus on a derivation or show the full proof.

- 9 chapters: foundations, probability, MDPs, Bellman equations, dynamic programming, Monte Carlo/TD and Q-learning, policy gradients and an introduction to PPO, reward shaping, rubric rewards, and KL regularization.
- Each chapter requires a correct quiz answer, a written proof, and confirmation that the proof has been checked against the solution before completion.
- 9 Python challenges from Easy to Hard, starting with an empty function and using no RL libraries. There are 45 public test cases.
- 6 combined Math + Code challenges. Completion requires passing code tests, writing a proof, and confirming every self-review rubric item. **Mathematical proofs are self-reviewed, not automatically verified.**
- A capstone implements a categorical policy update using rubric rewards and a KL penalty, with an exact expected gradient. It is a finite-action contextual bandit, not real LLM training.
- A 5×5 Gridworld with a policy computed by value iteration: adjust the discount, inspect state values, and run, pause, or reset the agent.
- A rubric sandbox with fixed weights and a hard gate.
- Quizzes with feedback, chapter notes, saved code and progress, and Markdown notebook export.
- Responsive desktop/mobile layouts, keyboard navigation, and reduced motion support.

Data is stored in `localStorage` in the current browser. There is no account or cloud synchronization. Learner code and proofs are not submitted to a server. Export your notebook before clearing browser data. Existing learner notes, code, proofs, and progress are preserved when switching to this English version; user-written content is not translated automatically.

## Tests

```sh
npm test
npm run test:e2e
```

The 44 unit/content tests cover reference implementations, TeX, Gridworld dynamics and goal reachability, the reward aggregator, and capstone gradient properties. The 47 Playwright browser tests cover simulation, quizzes, saved notes and export, filters, workers, proof completion, errors/timeouts, rubric interactions, mobile layouts, and English copy.

Playwright requires Chromium. This cloud image provides `/usr/bin/chromium`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

On other machines, run `npx playwright install chromium` or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an available Chromium executable. Unit tests do not need a browser.

## Deploy to Vercel

`vercel.json` configures Vite, `npm run build`, and the `dist` output directory. Deploy this directory as the project root; no environment variables or backend configuration are needed.

For an authenticated account:

```sh
npx vercel login
npx vercel --prod
```

If the current Vercel CLI offers `--temporary`, it can create a claimable deployment without an account session. Claim that deployment through Vercel to manage it in your account; it is not a substitute for a permanent production project until claimed.

## Project structure

- `src/content.js`: lessons, proofs, challenges, test cases, and reference solutions.
- `src/visuals.js` and `src/visuals.css`: mathematical scene models, SVG animations, accessible playback controls, and proof walkthroughs.
- `src/engine.js`: Gridworld dynamics, value iteration, and rubric scoring.
- `src/runner.js` and `public/python-worker.js`: Pyodide/CPython in a disposable worker, with separate loading and execution timeouts.
- `src/main.js`: routing, rendering, interactions, and saved progress.
- `src/style.css`: visual design and responsive layouts.

Learner code is executed by CPython via Pyodide inside a disposable module Web Worker. The Python runtime is bundled locally from the pinned npm dependency. Initialization has a 60-second loading limit; after the runtime is ready, source execution and all test cases have a 3-second limit. Print output and Python tracebacks are displayed in Test Result. The worker keeps the UI responsive but **is not a security sandbox for untrusted code**. Tests and solutions are public client-side content because this is a personal learning lab. A multi-user exam platform would need an isolated backend runner, resource limits, hidden tests, and a separate proof review process.

## References

- Sutton & Barto, _Reinforcement Learning: An Introduction_, 2nd ed. — returns, MDPs, Bellman equations, DP, TD, and policy gradients: http://incompleteideas.net/book/the-book-2nd.html
- Ng, Harada & Russell (1999), _Policy Invariance Under Reward Transformations: Theory and Application to Reward Shaping_.
- Schulman et al. (2017), _Proximal Policy Optimization Algorithms_: https://arxiv.org/abs/1707.06347
- OpenAI Spinning Up — policy optimization: https://spinningup.openai.com/en/latest/

Rubric rewards are a structured reward design, not a single standardized RL algorithm. Boundedness and monotonicity of an aggregator do not guarantee a correct judge or eliminate reward hacking.

## Mathematics in code labs

Lab prose uses explicit LaTeX delimiters: `\( ... \)` for inline math and `\[ ... \]` for display math. Backticks mark literal Python names. `src/math-text.js` escapes prose and code, then typesets only the explicit mathematical spans with locally bundled KaTeX and trusted commands disabled. Every lab has a display equation; examples also include a mathematical evaluation where useful. Code editors, reference implementations, test arguments, and code examples remain literal text. Long equations scroll inside their own containers on small screens.

## Documentation interface

The interface is inspired by the [Gymnasium Basic Usage documentation](https://gymnasium.farama.org/introduction/basic_usage/): a light gray navigation sidebar, white reading canvas, blue links, system typography, and a sticky table of contents. RL Atlas retains its own branding and course content.

`src/docs.js` builds the documentation shell, keyboard-accessible global search (Ctrl/Command + K), heading anchors, active section tracking, mobile navigation, and Light/Dark/Auto themes. `src/docs.css` styles the documentation layout. The appearance preference is saved separately from learning progress, code, notes, and proofs. TOC links use the SPA route plus `::section-id` so they can be reloaded or shared without losing the selected lesson.

## Coding workspace

Lab pages use a LeetCode-inspired workspace with independent scrolling panes: Description / Editorial / Submissions on the left, a CodeMirror Python editor above the Testcase / Test Result console on the right. Drag the dividers or use their arrow keys to resize; editor font size, layout, code and submission history persist locally. The problem picker filters challenges without leaving the workspace. Mobile uses Description / Code / Tests panels.

Run (Ctrl/Command + Enter) checks all public cases. Submit additionally saves a checked attempt, its code and verdict in local submission history; saved code can be restored to the editor. Neither operation is a server judge. Hybrid tasks still require a written, self-reviewed mathematical proof before acceptance. Editable JSON cases support focused debugging and do not award completion. The editor supports syntax highlighting, autocomplete, bracket matching, undo/redo and maximization. Other pages retain the documentation layout.

Lab links open a full-viewport workspace. Use the expand arrow on Description, Code or Testcase to focus that pane; press Escape or its restore arrow to return to the split view. Run and Submit reveal the relevant panel automatically. The desktop Full screen control also hides browser chrome when supported, and reflects browser fullscreen state.

The lab workspace defaults to a dark palette when no explicit theme preference exists. Its test console starts docked as a compact tab bar to maximize editor height. Click Testcase / Test Result or run code to expand it, and use the console chevron to collapse it again. Explicit theme choices continue to apply across pages.

## Standalone Python labs

Open `/lab.html#return` (or another lab ID) for the independent coding page. Vite builds `index.html` for the course and `lab.html` for labs; the lab entry imports only its own base/workspace CSS, Python CodeMirror support and KaTeX, with no course shell or table of contents. Existing `/#lab/<id>` links redirect to the standalone page. `predev` and `prebuild` copy the version-locked Pyodide runtime from node_modules to the generated, ignored `public/python-runtime` directory. No runtime CDN or backend account is required. The initial runtime download is about 13 MB; every run uses a fresh worker.

Python drafts and submissions use the existing local progress store with `codeLanguage: "python"`. On the first migration, previous JavaScript drafts, submissions and solved markers are retained in `legacyJavaScript`; theory progress, notes and mathematical proof drafts remain available. Old JavaScript attempts do not count as accepted Python submissions. Unit checks of Python reference implementations require `python3`; browser checks run the real bundled Pyodide interpreter.

## Section-aware AI study tutor

An Ask AI launcher is available throughout the course and in the standalone Python lab. Lesson sections, equations, proof discussions and proof practice have context-specific buttons. The panel supports chapter/section selection, suggested questions, Markdown, LaTeX, Python code blocks, copying answers, stopping requests and retrying. Histories are separate per section and saved only in the current browser tab via sessionStorage. Questions and the selected course context are sent to the AI provider; code drafts, notes and proof drafts are not automatically included. AI replies do not mark lessons or proofs complete.

The frontend calls only the same-origin `POST /api/tutor`. The Vercel Node function loads the real credential from `QWENCODER_API_KEY`, stored as a Sensitive/Secret production environment variable. Never use a `VITE_` prefix for a secret or put it in client code. A client-side encrypted credential or replacement token would remain readable by a browser user and is not used here. Provider configuration defaults to `https://api.qwencoder.cloud/api/v1` and `qwen3.8-flash`, with optional server-only `QWENCODER_BASE_URL` and `QWENCODER_MODEL` overrides. Requests use OpenAI-compatible chat completions.

For local development, copy `.env.example` to `.env.local`, supply your own credential, and run `npm run dev`. The development middleware reads only server-side QWENCODER settings; `.env` files are ignored by Git and excluded from Vercel uploads. `vite preview` serves the static build only; use `npm run dev` or a Vercel deployment to test the tutor API.

The endpoint validates context IDs and roles against authored course content, bounds message/body sizes and response length, rejects cross-site browser requests, has a 45-second upstream deadline and uses no-store responses. It has a best-effort per-IP limit of 12 requests per minute per serverless instance; this is not a distributed account quota. Provider failures are sanitized, and credentials are never included in the model prompt or returned to the browser. Model Markdown is sanitized with DOMPurify before KaTeX rendering; links use noopener/noreferrer. API tests cover credential isolation, invalid contexts/system-role injection, error masking, origin/body checks and request limits. Browser tests use mocked answers and do not spend provider credits.

### Choosing a tutor model

The Model selector offers the 13 requested models, with display names and exact API IDs shared in `src/tutor-models.js`. IDs were checked against [the provider catalog](https://www.qwencoder.cloud/models?usagePackageId=6a3c217ae8bba3ee79f177f2) on 2026-11-14. The selected model is sent as `model` to the same-origin tutor endpoint and validated against that catalog on the server before any provider call. Requests without `model` continue using the configured server default. Unknown models are rejected instead of silently falling back.

The preference is saved locally under `rl-atlas-tutor-model` and is shared between lessons and standalone labs. Model switching retains the section conversation; each new answer records and displays its own model, including after a reload. Earlier answers without model metadata keep their original generic attribution. Selection is disabled during a pending answer. Credentials stay server-side; tests route all 13 choices with mocked provider responses and do not spend model credits.

### Streaming tutor responses

The chatbot sends `stream: true` to the same-origin tutor API. The server requests OpenAI-compatible SSE streaming and relays answer-text deltas as they arrive, rather than waiting for the full completion or simulating typing afterward. The browser incrementally decodes UTF-8 and SSE frames, updates the visible answer at most every 50 ms, and safely re-renders Markdown and complete LaTeX expressions while generation continues. Scrolling up does not force the learner back to the latest token.

The response protocol is `meta` (selected model/context), `delta` (answer text), `done` (completion/truncation), and `error` (sanitized failure). Streaming requests disable upstream compression and responses explicitly use identity encoding. Server headers disable caching/transformation and proxy buffering; keepalive comments maintain the open connection. Only answer content is relayed: reasoning fields, authorization headers and provider errors are excluded. Credential redaction works even when the key is split across upstream deltas. Output and event sizes remain bounded.

Stop aborts the browser request and the server cancels its upstream request when the client disconnects. Already received text is retained in the section history with a Partial answer label if stopped, interrupted or timed out; it is never silently presented as a completed answer. The 45-second upstream and 55-second browser deadlines still apply. Older callers without `stream: true` continue receiving JSON, and JSON provider responses are accepted without a fake token animation.

Streaming checks cover fragmented UTF-8/CRLF/multiline events, incremental provider and actual HTTP delivery before completion, split-credential redaction, hidden reasoning fields, disconnect cancellation, output limits, safe Markdown/LaTeX while streaming, partial-answer recovery, and legacy JSON behavior. These checks use controlled streams and do not spend provider credits.
