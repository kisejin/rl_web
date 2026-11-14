# Run the RL Atlas Harness core on Vercel with HTTPS

This deployment uses the **official DeepSeek Harness agent core** inside a Node 24 Vercel Function. Vercel provides the HTTPS endpoint and certificate. It requires no VPS, Docker host, listening server, subprocess or persistent filesystem. The full upstream Harness administrative Web UI and its shell tools are not part of this runtime.

## Endpoints

- Website and chat UI: `https://rlatlas.vercel.app`
- Runtime health: `GET https://rlatlas.vercel.app/api/harness`
- Protected runtime completion: `POST https://rlatlas.vercel.app/harness/v1/chat/completions`
- Browser-facing tutor: `POST https://rlatlas.vercel.app/api/tutor`

The browser calls the tutor. The tutor validates the authored lesson context and selected model, then calls the protected Harness function. Harness assembles the system prompt and history, streams the model response through the existing Qwencoder endpoint and closes its private in-memory session. The tutor forwards answer-text SSE events to the existing UI. Model selection, word reveal, Stop, safe Markdown and LaTeX use the same UI as before.

```text
Browser → /api/tutor → /harness/v1/chat/completions → Qwencoder
                      official Harness core
                      all on the existing Vercel project
```

## Reproduce the setup

1. Use the existing **`kisejins-projects / rlatlas`** Vercel project. Install the repository's root dependencies with `npm ci`. The root manifest selects Node `24.x` and pins the official Harness packages to `0.2.2-rc.3`.
2. In **Project Settings → Environment Variables**, keep the existing production `QWENCODER_API_KEY`, `QWENCODER_BASE_URL` and `QWENCODER_MODEL`. The provider key can stay Sensitive; it does not need to be revealed, exported or copied to another project.
3. Generate a separate random bridge token, for example with `openssl rand -hex 32`. Add it as both `HARNESS_BRIDGE_TOKEN` and `DEEPSEEK_HARNESS_TOKEN` for **Production**. Store these as Sensitive values. Do not put them in `VITE_` variables, Git, URLs or browser settings.
4. Deploy the repository to Production. `api/harness.js` reuses the Docker runtime's request handler without starting a listener. The rewrite in `vercel.json` exposes its OpenAI-compatible completion path. Check `GET /api/harness`: it should return `status: ready`, `runtime: deepseek-harness` and the pinned core version. A POST without a bridge token must return 401.
5. Verify an authenticated completion from a trusted server or script, with a supported model, one system message and a final user message. Do not expose the bridge token in a public test page. Verify incremental SSE and `[DONE]` before enabling the tutor route.
6. Add `DEEPSEEK_HARNESS_URL=https://rlatlas.vercel.app/harness/v1` to **Production**. Redeploy so the tutor uses Harness. Test a real question, Stop and reloading the section history in the website.

Changing Vercel environment variables affects the next deployment. Production settings are not automatically copied to Preview deployments; either configure matching credentials and a deployment-specific HTTPS runtime there or leave Harness routing unset for previews.

## Runtime limits and rollback

Each request gets a fresh in-memory Harness context. The existing browser history is imported into that request; there is no shared cross-user session, persistent disk or background agent job. The runtime registers no shell, filesystem, browser, MCP or plugin-management tools. Python lab execution stays in browser workers.

Both functions have a 60-second Vercel duration limit. The tutor and runtime keep their 45-second request deadlines and bounded messages/output. The runtime's two-request cap is per warm function instance; Vercel can run multiple instances. Platform usage and plan limits apply normally.

To return to the direct Qwencoder backend, remove `DEEPSEEK_HARNESS_URL` and redeploy. Keep `QWENCODER_API_KEY` configured. A Harness failure does not silently trigger another paid request through a different backend.

## Checks

```sh
npm ci
npm test
npm ci --prefix deployments/deepseek-harness --ignore-scripts
npm --prefix deployments/deepseek-harness test
npm run build
```

The Vercel handler test exercises pre-parsed request bodies, missing configuration, endpoint authentication, body limits and real Harness core execution with a mocked provider. Runtime tests separately verify conversation fidelity, incremental HTTP streaming, cancellation, credential redaction and sanitized failures.
