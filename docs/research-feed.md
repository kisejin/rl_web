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

Every paper has a deterministic abstract excerpt fallback. Up to eight unsummarized entries per refresh, with targeted topics prioritized, are enriched using the existing server-only `QWENCODER_API_KEY`, `QWENCODER_BASE_URL` and the verified OpenAI-compatible `qwen3.8-flash` model. The call is bounded in time, tokens and response size. No extra provider credential is needed.

The summary prompt treats abstracts as untrusted reference data, requests JSON tied to supplied IDs, and forbids outside claims or invented metrics. Malformed/provider-failed output retains extractive digests. Summaries are labeled **AI abstract summary** or **Abstract excerpt**; the UI explicitly distinguishes these from a full-paper review, reproducibility check or peer-review status. AI factual accuracy cannot be established by a JSON-schema check. The original abstract and canonical source links remain available for verification.

## Development and verification

`npm run research:seed` regenerates only the public metadata bootstrap; it does not load production credentials. Production AI enrichment occurs inside the protected Vercel refresh. Local Vite serves the read and refresh APIs through its native Node middleware adapter.

Tests cover topic specificity, Atom/HF parsing, rejected entities/error feeds, canonical IDs, deduplication/revisions, discovery windows and partial failures, response bounds, AI output validation/fallback, public read-only behavior, cron authorization/idempotence, failed-refresh retention, the declared schedule, filters/bookmarks, source-text escaping, incremental loading, mobile themes and route cleanup.
