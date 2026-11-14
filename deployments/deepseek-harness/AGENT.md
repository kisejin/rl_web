# RL Atlas agent workspace

The existing chat UI now supports the built-in learning MCP server, authored skills, course/publication search, learning plans and goals, and attached images, PDFs and text/code. The official Harness core executes model tool calls and resumes the model with their results. This is a learning agent; terminal execution and arbitrary plugin installation are not included.

## Use it

1. Open **Ask AI** from a lesson or Python lab. Use **Expand tutor** for a wider workspace.
2. Choose **Ask** or **Plan** and an optional **Skill**. The four authored skills are Explain concepts, Proof coach, Python lab coach and Review files; their source is `skills/tutor/*/SKILL.md`. Skills load on the server from these trusted files.
3. Open **Plan & goal**, set a goal, then **Ask for a plan**. The model can update the plan through MCP; check off steps yourself as you work. Goals, plan steps and agent preferences are saved locally per lesson section. They do not award course/lab completion, and goals do not continue running after the request ends.
4. Enable **Search papers** to let the model search Crossref publication metadata. Results include real DOI links and publication years; metadata is not a claim that the agent read the full paper. Without this option, the web-search tool is not offered to the model. Course search remains available.
5. Use **Attach**, drag files onto the composer, or paste an image. Files remain attached to the current section until removed. Reattach after a page reload; file bytes are not persisted in browser history or server storage.
6. Inspect **Agent activity** for actual tool starts, completions, failures and source links. **Stop** aborts the model/tool request; visible answer text is retained as a partial answer.

Commands:

| Command                           | Action                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `/goal Learn Bellman contraction` | Save a personal goal locally without calling the model                                    |
| `/plan Learn value iteration`     | Ask the model to create a plan through `update_plan`                                      |
| `/search policy gradient`         | Ask the model to search authored course material                                          |
| `/skill proof`                    | Select a skill for the next request (`default`, `intuition`, `proof`, `python`, `review`) |

## Actual MCP integration

The official `@modelcontextprotocol/sdk` client and `McpServer` connect with a linked in-memory transport for each request. Harness discovers the server's tool schemas with `listTools` and invokes each accepted tool through `client.callTool`; the server also exposes `rlatlas://course/index` as an MCP resource. No arbitrary browser-provided MCP endpoints or external MCP server tokens are accepted.

| Tool              | Capability                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| `course_search`   | Search authored lesson sections and return bounded excerpts/source links |
| `read_lesson`     | Read a specific lesson section, including authored proofs                |
| `load_skill`      | Load one of the four trusted Markdown skills                             |
| `read_attachment` | Read an attached text/PDF/code excerpt with offset pagination            |
| `update_plan`     | Replace up to eight personal plan steps                                  |
| `update_goal`     | Update the personal goal/status                                          |
| `web_search`      | Opt-in Crossref publication search via a fixed HTTPS endpoint            |

Only actual tool execution generates tool activity events. External content, attachment text and tool results are reference data, not instructions. Per-request contexts and MCP connections are closed after completion/cancellation; one user's plan and files are not stored in another request.

## Attachments

- Up to three files per request, at most 10 MB per source file.
- PNG/JPEG/WebP images are normalized in the browser to bounded JPEG images (up to 1280 pixels on the long edge and 500,000 data-URL characters). The actual pixels reach the selected provider through native `image_url` input; no fabricated OCR description replaces them. Vision support depends on the model/gateway. Gemini Flash is a useful starting model.
- Text PDFs are processed locally with a bundled PDF.js worker. Up to 20 pages / 24,000 characters are extracted with page markers. Scanned PDFs without selectable text need a page screenshot attached as an image. Encrypted/unreadable PDFs report a file error.
- `.py`, `.txt`, `.md`, `.json`, `.csv` and `.ipynb` are read as text. Files over the text limit are visibly marked as excerpts. The aggregate text limit is 32,000 characters.
- Binary file data is not saved to conversation history. History retains filenames and answer text. Files are sent only when the learner submits the question. No uploaded code or skill is executed.

The tutor body limit is 1.9 MB (below Vercel's request limit). The authenticated runtime allows 1.95 MB including server-authored context. The visible output limit remains 14,000 characters. Each agent request is bounded to four model steps and eight tool calls, with a 45-second deadline; this is not a persistent CLI/background worker. Tool loops may use more model requests than a single ordinary answer.

## Streaming and validation

The private runtime relays model chunks plus `event: rl-agent` updates. The public tutor validates/normalizes those updates and forwards `event: agent`; the UI keeps tool activity separate from answer text and safely renders the answer with the existing Markdown/KaTeX path. Native tool calls/results, image references, system prompts and conversation history are assembled by the actual Harness agent loop. Skills, model IDs, options, attachments, plan sizes and source link protocols are bounded and validated server-side.

Unit/runtime/browser tests cover real MCP discovery/resources/calls, a full tool → result → model continuation, two-layer HTTP event relay, per-request plan isolation, opt-in search provenance, native images, real PDF extraction in a browser, goal/plan persistence, file errors and mobile controls. Provider calls are mocked in automated tests. Production smoke checks can use the normal website; credentials remain in Vercel Sensitive variables.
