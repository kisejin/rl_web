# Daily RL research desk

Open `/#research`. The desk covers RL and emerging methods, reinforcement learning with verifiable rewards (RLVR), on-policy self-distillation, and rubric-driven rewards. It has topic/search/date/source filters, incremental loading, links to abstracts/PDFs, and a browser-local saved reading list.

## Production automation

`vercel.json` schedules `/api/research-refresh` at `0 2 * * *`: daily at **09:00 in Asia/Ho_Chi_Minh**. Vercel may delay scheduled execution. The endpoint requires `Authorization: Bearer <CRON_SECRET>` for GET and POST. The secret is stored as a production Sensitive environment variable; it is not a browser credential. A successful refresh is skipped if already attempted successfully on the same UTC day. A failed all-source attempt is eligible for retry.

The existing `rlatlas` project is connected to the `rlatlas-research` Vercel Blob store in `iad1`. `BLOB_READ_WRITE_TOKEN` is used only by server code. The public object `research/feed.json` contains paper metadata and summaries, with no credentials. Blob persistence survives deployments and function cold starts; no server filesystem write is used for production data.

`GET /api/research` reads the saved feed and has a five-minute shared-cache window. It cannot initiate crawling or AI calls. If live storage is missing/unavailable, the endpoint serves the dated `public/research-feed.json` bootstrap with `storage: "bundled"`. The UI labels that fallback. An HTTP failure also allows the browser to load the static bootstrap directly. Reloading reads saved data; it does not trigger the expensive refresh endpoint.

## Discovery and retention

- arXiv Atom API: a general RL query and a targeted query for verifiable rewards, distillation and rubric methods. Requests are separated by at least 3.1 seconds; each has a bounded timeout and response size.
- Hugging Face Daily Papers and three public keyword-search endpoints: distillation, rubric rewards, and verifiable rewards. Keyword-search results must match the corresponding text classifier.
- Recent discovery uses a 60-day publication window. Targeted searches may additionally surface background work from the preceding year. Actual source publication dates are displayed separately from first-collected dates.
- Records are canonicalized and deduplicated by arXiv identifier without version suffix. Sources are unioned; the first-collected date is retained. A revised abstract invalidates its previous AI digest.
- The archive retains at most 180 papers, ordered by publication date. Saved-reading-list IDs are local to the browser and do not prevent a paper from leaving the bounded server archive.
- This is keyword-based discovery, not exhaustive coverage. arXiv can rate-limit requests; available HF sources and already stored records keep the desk useful. Each source’s health is exposed. Complete source failure preserves the previous successful date and archive instead of reporting a fresh empty collection.

## Summary provenance

Every paper has a deterministic abstract excerpt fallback. Up to eight unsummarized entries per refresh, with targeted topics prioritized, are enriched using the existing server-only `QWENCODER_API_KEY`, `QWENCODER_BASE_URL` and the verified OpenAI-compatible `gemini-3.8-flash` model. Up to four concurrent streaming batches of two papers keep the daily enrichment bounded to 20 seconds per batch, 2,000 output tokens per batch and a fixed response size. The overall daily work reserves time for persistence within the 60-second function limit. An authenticated administrator can POST to `/api/research-refresh?mode=summaries` to retry only pending summaries with a 40-second deadline; this does not crawl sources or change the successful discovery date. Fixed diagnostic codes report timeouts or malformed JSON without exposing provider response bodies or credentials. No extra provider credential is needed.

The summary prompt treats abstracts as untrusted reference data, requests JSON tied to supplied IDs, and forbids outside claims or invented metrics. Malformed/provider-failed output retains extractive digests. Summaries are labeled **AI abstract summary** or **Abstract excerpt**; the UI explicitly distinguishes these from a full-paper review, reproducibility check or peer-review status. AI factual accuracy cannot be established by a JSON-schema check. The original abstract and canonical source links remain available for verification.

## Development and verification

`npm run research:seed` regenerates only the public metadata bootstrap; it does not load production credentials. Production AI enrichment occurs inside the protected Vercel refresh. Local Vite serves the read and refresh APIs through its native Node middleware adapter.

Tests cover topic specificity, Atom/HF parsing, rejected entities/error feeds, canonical IDs, deduplication/revisions, discovery windows and partial failures, response bounds, AI output validation/fallback, public read-only behavior, cron authorization/idempotence, failed-refresh retention, the declared schedule, filters/bookmarks, source-text escaping, incremental loading, mobile themes and route cleanup.

## Mathematics and paper discussions

`server/ai-provider.js` supplies the same `QWENCODER_API_KEY` and `QWENCODER_BASE_URL` to chat and research enrichment. The summary model defaults to the supported `gemini-3.8-flash` and can be changed with the server-only `RESEARCH_SUMMARY_MODEL`; the chat selector retains all 13 supported models. Secrets are never included in paper records or browser requests. New summary prompts preserve source LaTeX with correctly escaped JSON backslashes and forbid invented source equations.

Cards render dollar and bracket/parenthesis math delimiters plus common equation/align/gather environments through bounded, untrusted KaTeX. Source prose is escaped, monetary text and code stay literal, and unsupported TeX remains readable. Mathematical angle brackets are retained during collection. Stored older abstracts refresh from source on subsequent crawls.

The per-card discussion button selects a paper in the existing chat panel. Overview, methods, equations, limitations and theory connections have separate session histories per paper. The browser sends only a canonical `paperId`; the tutor server loads its own live/dated-bundled record before constructing the prompt. Unknown IDs and forged source content cannot override canonical material. The chatbot distinguishes abstract evidence, derived AI digests and teaching examples, and cites the arXiv URL. It does not claim to have read a full PDF unless full text has actually been supplied/read.

MCP `search_papers` and `read_paper` access the saved collection independently of optional Crossref publication search. Reads in one request share a consistent snapshot; the library cache is bounded to one minute. The Docker image includes its dated bootstrap and supports offline paper tools as well as live Blob access when configured.
