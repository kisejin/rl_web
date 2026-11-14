# DeepSeek Harness runtime for RL Atlas

Status: Docker runtime and Vercel connection are prepared. **Not activated on the public website:** no external runtime server has been provisioned. Until `DEEPSEEK_HARNESS_URL` is configured on Vercel, the existing direct tutor backend remains active.

This container embeds the official DeepSeek Harness **agent core**, pinned to `0.2.2-rc.3`, behind a narrow OpenAI-compatible API. It does not run or iframe the full Harness administrative Web UI. The existing RL Atlas chat UI, 13-model picker, lesson context, word reveal, Stop button, Markdown and LaTeX remain the user interface.

```text
Browser → Vercel /api/tutor → HTTPS Harness runtime → Qwencoder /chat/completions
          bridge token        provider key
          (server only)       (server only)
```

The Harness agent loop owns prompt assembly, a private in-memory session, streamed attempts and cancellation. A custom OpenAI-compatible adapter uses the existing Qwencoder endpoint and model IDs. Each request imports the supplied text conversation into a fresh session; the browser retains its current section-scoped history. No cross-user server sessions or persistent volumes are used. No shell, filesystem, browser, plugin-management, MCP or code-execution tools are registered. Python labs continue to execute through their existing browser workers.

## Prepare a Docker server

Run these commands on your future server from the repository checkout:

```sh
cd deployments/deepseek-harness
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
```

Edit the private `.env`:

- Set `QWENCODER_API_KEY` to the same provider key already configured for RL Atlas. Do not commit it or put it in browser code.
- Set `HARNESS_BRIDGE_TOKEN` to the newly generated random value. This is a separate credential, not an encoding of the provider key.
- Keep `QWENCODER_BASE_URL=https://api.qwencoder.cloud/api/v1`.

Then build and launch:

```sh
docker compose up -d --build
curl --fail http://127.0.0.1:3080/healthz
docker compose ps
```

Compose publishes port 3080 only on the server's loopback interface. The process runs as a non-root user with a read-only root filesystem, no added capabilities, a two-request concurrency limit, a 45-second deadline and bounded input/output. It receives no host source mount or Docker socket. Health checks do not call the model API or spend credits.

## Add HTTPS, then connect Vercel

Point a dedicated domain (for example `harness.example.com`) at your server. Run Caddy on that server using `Caddyfile.example`, with your real hostname, to terminate HTTPS and forward streaming responses without buffering. Allow ports 80/443 to Caddy; keep 3080 private. Use a host reverse proxy: the example's `127.0.0.1` is the Docker host, not a separate proxy container.

Verify:

```sh
curl --fail https://harness.example.com/healthz
```

Configure these **server-side Production environment variables** on the existing Vercel `rlatlas` project:

| Variable                 | Value                                            |
| ------------------------ | ------------------------------------------------ |
| `DEEPSEEK_HARNESS_URL`   | `https://harness.example.com/v1` (include `/v1`) |
| `DEEPSEEK_HARNESS_TOKEN` | Exactly the runtime's `HARNESS_BRIDGE_TOKEN`     |

Redeploy the website after setting the variables. `QWENCODER_API_KEY` and `QWENCODER_BASE_URL` on the runtime supply the actual model credential and endpoint. The provider key on Vercel remains available for rollback. The browser receives neither credential. Keep the runtime bridge token out of URLs, prompts, access logs and client settings.

Requests fail closed if a runtime URL is configured without a valid bridge token, or if that URL is not HTTPS. A runtime failure is reported in chat; the service does not silently send a second model request to a different backend. Remove the two Harness variables and redeploy to roll back to the direct backend.

## Verification

From the repository root:

```sh
npm ci --prefix deployments/deepseek-harness --ignore-scripts
npm --prefix deployments/deepseek-harness test
npm test
docker build -f deployments/deepseek-harness/Dockerfile -t rl-atlas-harness:0.2.2-rc.3 .
npm --prefix deployments/deepseek-harness run test:docker
```

On networks with a private certificate authority, pass its CA bundle to BuildKit with `--secret id=build_ca,src=/path/to/ca-bundle.pem`; it is mounted only during dependency installation and is not copied into the image. TLS verification stays enabled. If your runtime gateway requires a private CA, supply its bundle separately at runtime with `NODE_EXTRA_CA_CERTS`.

Runtime tests use the actual official Harness core with mocked provider responses. They check system-prompt and history preservation, incremental HTTP delivery before provider completion, cancellation, credential redaction across delta boundaries, error masking, bridge authentication, model validation and concurrent-request limits. They do not use the real API key or spend provider credits.

## Upstream references

- [DeepSeek Harness source and MIT license](https://github.com/deepseek-ai/deepseek-harness)
- [Agent loop API](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/README.md)
- [Provider adapter contract](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm/README.md)
- [Full Web UI deployment](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/public-deployments.md) — a separate product surface with its own authentication and process requirements.
