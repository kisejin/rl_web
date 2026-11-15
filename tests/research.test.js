import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyResearch } from "../src/research-topics.js";
import {
  parseArxiv,
  parseHuggingFace,
  mergeResearch,
  discoverResearch,
  summarizeResearch,
  makeFeed,
  extractiveSummary,
  readBounded,
  MAX_PAPERS,
} from "../server/research-feed.js";
import { createResearchHandler } from "../api/research.js";
import { createResearchRefreshHandler } from "../api/research-refresh.js";
const now = new Date("2026-11-15T02:00:00Z");
const abstract =
  "We study reinforcement learning with verifiable rewards. Our method uses a rubric reward and on-policy self-distillation. Results are author claims only.";
const hf = (
  id = "2611.12345",
  text = abstract,
  published = "2026-11-13T00:00:00Z",
) => ({
  paper: {
    id,
    title: "Verifiable policy learning",
    summary: text,
    publishedAt: published,
    authors: [{ name: "A. Researcher" }],
  },
});
const p = () => parseHuggingFace([hf()])[0];
const xml = (entry = true) =>
  `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entry ? `<entry><id>http://arxiv.org/abs/2611.12345v2</id><title>RL &amp; rewards</title><summary>${abstract}</summary><published>2026-11-13T00:00:00Z</published><updated>2026-11-14T00:00:00Z</updated><author><name>A &amp; B</name></author></entry>` : ""}</feed>`;
function response() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };
}
test("research topics classify actual concepts without relabeling off-policy distillation as on-policy", () => {
  assert.deepEqual(classifyResearch("RL", abstract), [
    "rl",
    "rlvr",
    "self-distillation",
    "rubric",
  ]);
  assert.ok(
    !classifyResearch(
      "Off-policy self-distillation in reinforcement learning",
    ).includes("self-distillation"),
  );
  assert.deepEqual(classifyResearch("A rubric for teaching algebra"), []);
  assert.ok(
    classifyResearch("On–policy self–distillation").includes(
      "self-distillation",
    ),
  );
});
test("Atom parsing handles namespaces, singleton authors and version deduplication, and rejects XML entities and error feeds", () => {
  const [paper] = parseArxiv(xml());
  assert.equal(paper.id, "2611.12345");
  assert.equal(paper.title, "RL & rewards");
  assert.equal(paper.authors[0], "A & B");
  assert.equal(paper.url, "https://arxiv.org/abs/2611.12345");
  assert.deepEqual(parseArxiv(xml(false)), []);
  assert.throws(() =>
    parseArxiv(
      '<!DOCTYPE feed [<!ENTITY x SYSTEM "file:///etc/passwd">]><feed/>',
    ),
  );
  assert.throws(() =>
    parseArxiv(
      "<feed><entry><id>http://arxiv.org/api/errors#bad</id></entry></feed>",
    ),
  );
  assert.throws(() => parseArxiv("not XML"));
});
test("HF metadata gets canonical links and faithful extractive fallback; malformed IDs are excluded", () => {
  const papers = parseHuggingFace([
    hf(),
    hf("javascript:alert(1)"),
    hf("2611.00001", "Unrelated image reconstruction"),
  ]);
  assert.equal(papers.length, 1);
  assert.equal(papers[0].summary.kind, "extractive");
  assert.match(papers[0].summary.overview, /We study/);
  assert.match(papers[0].summary.limitations, /Full-paper/);
  assert.equal(
    extractiveSummary("One. Two. Three. Four.").overview,
    "One. Two. Three.",
  );
  assert.throws(() => parseHuggingFace({ papers: [] }));
});
test("merging deduplicates versions and sources, preserves first-seen and summaries, and invalidates revised abstracts", () => {
  const old = {
    ...p(),
    firstSeenAt: "2026-11-01T00:00:00Z",
    summary: { kind: "ai", overview: "Prior digest" },
  };
  let result = mergeResearch(
    { papers: [old] },
    [{ ...p(), sources: ["arxiv"] }],
    now,
  );
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].sources, ["huggingface", "arxiv"]);
  assert.equal(result[0].summary.kind, "ai");
  assert.equal(result[0].firstSeenAt, old.firstSeenAt);
  const revised = {
    ...p(),
    abstract: abstract + " Revision.",
    updatedAt: "2026-11-15T00:00:00Z",
  };
  result = mergeResearch({ papers: [old] }, [revised], now);
  assert.equal(result[0].summary.kind, "extractive");
  const many = Array.from({ length: MAX_PAPERS + 10 }, (_, i) => ({
    ...p(),
    id: "2611." + String(i).padStart(5, "0"),
  }));
  assert.equal(mergeResearch(null, many, now).length, MAX_PAPERS);
});
test("discovery retains available sources, restricts target-search tags and distinguishes recent from background windows", async () => {
  const fetchImpl = async (url) => {
    const s = String(url);
    if (s.includes("arxiv")) throw new Error("rate limited");
    if (s.includes("daily_papers"))
      return Response.json([
        hf(),
        hf("2501.11111", abstract, "2025-01-01T00:00:00Z"),
      ]);
    if (s.includes("self-distillation"))
      return Response.json([
        hf("2601.11111", abstract, "2026-01-01T00:00:00Z"),
        hf("2611.22222", "Reinforcement learning for games"),
      ]);
    return Response.json([]);
  };
  const result = await discoverResearch({ fetchImpl, now, arxivDelayMs: 0 });
  assert.equal(result.sourceStatuses.length, 6);
  assert.equal(result.sourceStatuses.filter((s) => !s.ok).length, 2);
  assert.ok(result.papers.some((p) => p.id === "2601.11111"));
  assert.ok(
    !result.papers.some((p) => p.id === "2501.11111" || p.id === "2611.22222"),
  );
});
test("summary enrichment is bounded, validates IDs, uses server-only credentials and falls back on malformed provider output", async () => {
  const papers = [p()];
  let payload;
  const enriched = await summarizeResearch(papers, {
    apiKey: "secret-test-key",
    fetchImpl: async (url, options) => {
      assert.equal(options.headers.Authorization, "Bearer secret-test-key");
      payload = JSON.parse(options.body);
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summaries: [
                  {
                    id: papers[0].id,
                    overview: "The authors study verified rewards.",
                    method: "A rubric is used.",
                    limitations: "Abstract evidence only.",
                  },
                  {
                    id: "2611.99999",
                    overview: "invented",
                    method: "x",
                    limitations: "x",
                  },
                ],
              }),
            },
          },
        ],
      });
    },
  });
  assert.equal(enriched.papers.length, 1);
  assert.equal(enriched.papers[0].summary.kind, "ai");
  assert.ok(!JSON.stringify(payload).includes("secret-test-key"));
  assert.equal(payload.model, "gemini-3.8-flash");
  const bad = await summarizeResearch(papers, {
    apiKey: "secret-test-key",
    fetchImpl: async () =>
      Response.json({ choices: [{ message: { content: "broken" } }] }),
  });
  assert.equal(bad.summaryStatus, "extractive-fallback");
  assert.equal(bad.papers[0].summary.kind, "extractive");
  assert.equal(
    (await summarizeResearch(papers)).summaryStatus,
    "extractive-only",
  );
});
test("bounded upstream readers reject oversized or unsuccessful responses", async () => {
  await assert.rejects(readBounded(new Response("too large"), 3));
  await assert.rejects(readBounded(new Response("error", { status: 429 })));
});
test("public research endpoint is read-only and labels the dated bundled fallback", async () => {
  const fallback = { version: 1, papers: [p()], updatedAt: now.toISOString() };
  const handler = createResearchHandler({
    read: async () => {
      throw new Error("private storage error");
    },
    seed: async () => fallback,
  });
  let res = response();
  await handler({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.storage, "bundled");
  assert.match(res.headers["Cache-Control"], /s-maxage=300/);
  assert.ok(!JSON.stringify(res.data).includes("private storage"));
  res = response();
  await handler({ method: "POST" }, res);
  assert.equal(res.statusCode, 405);
});
test("cron rejects unauthenticated requests before storage/provider access and skips completed UTC days", async () => {
  let reads = 0,
    discovered = 0;
  const handler = createResearchRefreshHandler({
    secret: () => "cron-secret",
    now: () => now,
    read: async () => {
      reads++;
      return {
        lastAttemptAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "ok",
        papers: [p()],
      };
    },
    discover: async () => {
      discovered++;
    },
  });
  let res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(reads, 0);
  res = response();
  await handler(
    { method: "GET", headers: { authorization: "Bearer cron-secret" } },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.status, "already-updated");
  assert.equal(discovered, 0);
});
test("failed crawls preserve the last successful date and paper archive rather than reporting a fresh empty feed", async () => {
  const previous = {
    version: 1,
    updatedAt: "2026-11-14T02:00:00Z",
    papers: [p()],
  };
  let written;
  const handler = createResearchRefreshHandler({
    secret: () => "cron-secret",
    now: () => now,
    read: async () => previous,
    write: async (feed) => (written = feed),
    discover: async () => ({
      papers: [],
      sourceStatuses: [{ id: "arxiv", ok: false, count: 0 }],
    }),
    summarize: async (papers) => ({ papers, summaryStatus: "extractive-only" }),
  });
  const res = response();
  await handler(
    { method: "POST", headers: { authorization: "Bearer cron-secret" } },
    res,
  );
  assert.equal(res.statusCode, 502);
  assert.equal(written.updatedAt, previous.updatedAt);
  assert.equal(written.lastAttemptAt, now.toISOString());
  assert.equal(written.papers.length, 1);
  const partial = makeFeed(
    previous,
    { sourceStatuses: [{ ok: true }, { ok: false }] },
    { papers: [p()], summaryStatus: "extractive-only" },
    now,
  );
  assert.equal(partial.status, "partial");
  assert.equal(partial.updatedAt, now.toISOString());
});
test("production config schedules a single protected daily refresh and the initial collection contains only sourced canonical papers", () => {
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url)),
  );
  assert.deepEqual(config.crons, [
    { path: "/api/research-refresh", schedule: "0 2 * * *" },
  ]);
  assert.equal(config.functions["api/research-refresh.js"].maxDuration, 60);
  const seed = JSON.parse(
    readFileSync(new URL("../public/research-feed.json", import.meta.url)),
  );
  assert.ok(seed.papers.length > 0);
  for (const p of seed.papers) {
    assert.equal(p.url, "https://arxiv.org/abs/" + p.id);
    assert.ok(p.abstract && p.topics.length);
    assert.ok(["extractive", "ai"].includes(p.summary.kind));
  }
});

test("authenticated summary retries keep discovery dates intact and do not crawl again", async () => {
  const previous = {
    version: 1,
    updatedAt: "2026-11-15T01:00:00Z",
    lastAttemptAt: "2026-11-15T01:00:00Z",
    status: "ok",
    papers: [p()],
  };
  let written,
    crawls = 0;
  const handler = createResearchRefreshHandler({
    secret: () => "cron-secret",
    now: () => now,
    read: async () => previous,
    write: async (feed) => (written = feed),
    discover: async () => {
      crawls++;
    },
    summarize: async (papers, options) => {
      assert.equal(options.timeoutMs, 40000);
      return {
        papers: papers.map((p) => ({
          ...p,
          summary: {
            kind: "ai",
            overview: "Digest",
            method: "Method",
            limitations: "Abstract only",
          },
        })),
        summaryStatus: "ai-and-extractive",
      };
    },
  });
  const res = response();
  await handler(
    {
      method: "POST",
      url: "/api/research-refresh?mode=summaries",
      headers: { authorization: "Bearer cron-secret" },
    },
    res,
  );
  assert.equal(res.statusCode, 200);
  assert.equal(crawls, 0);
  assert.equal(written.updatedAt, previous.updatedAt);
  assert.equal(written.lastAttemptAt, previous.lastAttemptAt);
  assert.equal(written.papers[0].summary.kind, "ai");
  assert.equal(res.data.aiSummaries, 1);
});

test("research enrichment decodes provider SSE and isolates small-batch failures", async () => {
  const papers = Array.from({ length: 5 }, (_, i) => ({
    ...p(),
    id: "2611." + String(i).padStart(5, "0"),
  }));
  let calls = 0;
  const result = await summarizeResearch(papers, {
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      calls++;
      const payload = JSON.parse(options.body);
      assert.equal(payload.stream, true);
      assert.equal(options.headers.Accept, "text/event-stream");
      const group = JSON.parse(payload.messages[1].content);
      assert.ok(group.length <= 2);
      if (group[0].id === papers[2].id) throw new Error("unavailable");
      const content = JSON.stringify({
        summaries: group.map((p) => ({
          id: p.id,
          overview: "Author claim.",
          method: "A method.",
          limitations: "Abstract only.",
        })),
      });
      const split = Math.floor(content.length / 2);
      const chunks =
        [content.slice(0, split), content.slice(split)]
          .map(
            (part) =>
              "data: " +
              JSON.stringify({ choices: [{ delta: { content: part } }] }) +
              "\n\n",
          )
          .join("") + "data: [DONE]\n\n";
      return new Response(chunks, {
        headers: { "content-type": "text/event-stream" },
      });
    },
  });
  assert.equal(calls, 3);
  assert.equal(result.papers.filter((p) => p.summary.kind === "ai").length, 3);
  assert.equal(result.papers[2].summary.kind, "extractive");
  assert.equal(result.summaryStatus, "ai-and-extractive");
});
