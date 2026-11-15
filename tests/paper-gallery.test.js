import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { once } from "node:events";
import katex from "katex";
import {
  inferPrerequisites,
  mathConcepts,
} from "../src/paper-prerequisites.js";
import { atlasTopics } from "../src/atlas-content.js";
import {
  safePaperUrl,
  parsePaperHtml,
  collectPaperContent,
  fetchPaperResource,
} from "../server/paper-content.js";
import { getPaperContent } from "../server/paper-content-store.js";
import { createPaperContentHandler } from "../api/paper-content.js";
import { createPaperPdfHandler, MAX_PDF_BYTES } from "../api/paper-pdf.js";
import { paperTutorContext } from "../src/paper-context.js";
import { makePaperPdf } from "./fixtures/paper-pdf.mjs";
const paper = {
  id: "2611.12345",
  title: "Policy gradients with rubric rewards",
  abstract:
    "Reinforcement learning uses policy optimization and a KL penalty with a rubric reward.",
  publishedAt: "2026-11-15T00:00:00Z",
  topics: ["rl", "rubric"],
  authors: ["A. Author"],
};
const html = readFileSync(
  new URL("./fixtures/paper-visuals.html", import.meta.url),
  "utf8",
);
const res = () => ({
  headers: {},
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
});
test("every recommended math concept has valid reference TeX and an existing course link; matches have source evidence", () => {
  for (const c of mathConcepts) {
    assert.doesNotThrow(() =>
      katex.renderToString(c.formula, { throwOnError: true }),
    );
    assert.ok(
      atlasTopics.some((t) => t.id === c.link),
      c.id,
    );
  }
  const inferred = inferPrerequisites(
    paper,
    "A high-probability regret theorem uses martingales.",
  );
  assert.ok(
    inferred.some((c) => c.id === "information" && c.basis === "abstract"),
  );
  assert.ok(
    inferred.some((c) => c.id === "concentration" && c.basis === "full-text"),
  );
  assert.ok(
    inferred.filter((c) => c.basis !== "foundation").every((c) => c.evidence),
  );
  assert.ok(
    paperTutorContext(paper, "prerequisites").material.recommendedMathematics
      .length >= 2,
  );
});
test("HTML gallery includes every image/subpanel and appendix table, preserves math/cell spans, and ignores equation layout", () => {
  const d = parsePaperHtml(html, paper, "https://arxiv.org/html/" + paper.id);
  assert.equal(d.status, "html");
  assert.equal(d.assets.length, 3);
  assert.equal(d.tables.length, 2);
  assert.match(d.assets[0].url, /2611.12345v2\/panel-a.svg$/);
  assert.match(d.assets[0].caption, /0<x<1/);
  assert.equal(d.tables[0].rows[0][0].rowspan, 2);
  assert.equal(d.tables[0].rows[0][1].colspan, 2);
  assert.match(d.tables[0].rows[2][2].text, /\\sqrt/);
  assert.match(d.tables[1].caption, /Appendix/);
  assert.equal(d.unsupported.length, 0);
  assert.ok(
    !d.prerequisites.some((c) => c.id === "bayes" || c.id === "distributional"),
  );
  const figureTable = parsePaperHtml(
    html.replace(
      "</article>",
      '<figure class="ltx_figure" id="FigureGrid"><table class="ltx_tabular"><tr><td>Diagram in a table</td></tr></table><figcaption>Figure 3: A structured example.</figcaption></figure></article>',
    ),
    paper,
    "https://arxiv.org/html/" + paper.id,
  );
  assert.equal(
    figureTable.tables[2].caption,
    "Figure 3: A structured example.",
  );
  assert.equal(figureTable.tables[2].sourceAnchor, "FigureGrid");
});
test("paper source URLs reject cross-paper paths, off-host assets, credentials, ports and redirect escapes", async () => {
  for (const bad of [
    "https://evil.example/html/2611.12345/a.svg",
    "https://arxiv.org/html/2611.99999/a.png",
    "https://arxiv.org:444/html/2611.12345/a.png",
    "https://u:p@arxiv.org/html/2611.12345/a.png",
    "https://arxiv.org/html/2611.12345/%2e%2e/private",
  ])
    assert.equal(safePaperUrl(bad, paper.id), null, bad);
  assert.ok(
    safePaperUrl("https://arxiv.org/html/2611.12345v2/a.svg", paper.id),
  );
  await assert.rejects(
    fetchPaperResource("https://arxiv.org/html/" + paper.id, paper.id, {
      fetchImpl: async () =>
        new Response("", {
          status: 302,
          headers: { location: "https://evil.example/private" },
        }),
    }),
  );
});
test("failed HTML sources and PDF-wrapper conversions produce explicit PDF-only coverage rather than invented empty galleries", async () => {
  const d = await collectPaperContent(paper, {
    fetchImpl: async () => new Response("not found", { status: 404 }),
  });
  assert.equal(d.status, "pdf-only");
  assert.match(d.coverage.note, /No claim of zero/);
  assert.ok(d.prerequisites.length >= 2);
  assert.throws(() =>
    parsePaperHtml(
      '<article class="ltx_document">See pages 1-last of paper.pdf</article>',
      paper,
      "https://arxiv.org/html/" + paper.id,
    ),
  );
});
test("persistent gallery caching coalesces requests and invalidates on a new paper revision", async () => {
  let calls = 0,
    writes = 0;
  const options = {
    read: async () => null,
    write: async () => {
      writes++;
    },
    collect: async (p) => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return {
        version: 1,
        parserVersion: 2,
        paperId: p.id,
        sourceUpdatedAt: p.updatedAt || p.publishedAt,
        checkedAt: new Date().toISOString(),
        status: "html",
        assets: [],
        tables: [],
      };
    },
  };
  const fixture = { ...paper, id: "2611.77777" };
  await Promise.all([
    getPaperContent(fixture, options),
    getPaperContent(fixture, options),
  ]);
  assert.equal(calls, 1);
  assert.equal(writes, 1);
  await getPaperContent(fixture, options);
  assert.equal(calls, 1);
  await getPaperContent(
    { ...fixture, updatedAt: "2026-11-16T00:00:00Z" },
    options,
  );
  assert.equal(calls, 2);
});
test("gallery endpoint accepts only collected canonical IDs and does not accept arbitrary source URLs", async () => {
  let collections = 0;
  const handler = createPaperContentHandler({
    readLibrary: async () => ({ papers: [paper] }),
    collect: async () => {
      collections++;
      return parsePaperHtml(html, paper, "https://arxiv.org/html/" + paper.id);
    },
  });
  let out = res();
  await handler(
    {
      method: "GET",
      url: "/api/paper-content?paperId=https://evil.example",
      headers: {},
    },
    out,
  );
  assert.equal(out.statusCode, 400);
  assert.equal(collections, 0);
  out = res();
  await handler(
    {
      method: "GET",
      url: "/api/paper-content?paperId=2611.99999",
      headers: {},
    },
    out,
  );
  assert.equal(out.statusCode, 404);
  assert.equal(collections, 0);
  out = res();
  await handler(
    {
      method: "GET",
      url: "/api/paper-content?paperId=" + paper.id,
      headers: {},
    },
    out,
  );
  assert.equal(out.statusCode, 200);
  assert.equal(out.data.assets.length, 3);
});
test("PDF proxy streams verified original bytes and rejects unknown papers and oversized bodies", async () => {
  const bytes = makePaperPdf(8);
  let upstream = 0,
    oversized = false;
  const handler = createPaperPdfHandler({
    readLibrary: async () => ({ papers: [paper] }),
    fetchImpl: async (url) => {
      upstream++;
      assert.equal(String(url), "https://arxiv.org/pdf/" + paper.id);
      return new Response(bytes, {
        headers: {
          "content-type": "application/pdf",
          "content-length": String(
            oversized ? MAX_PDF_BYTES + 1 : bytes.length,
          ),
        },
      });
    },
  });
  const server = createServer((req, response) => {
    response.status = (n) => {
      response.statusCode = n;
      return response;
    };
    response.json = (data) => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(data));
    };
    handler(req, response);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    let response = await fetch(url + "/?paperId=" + paper.id);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    response = await fetch(url + "/?paperId=2611.99999");
    assert.equal(response.status, 404);
    assert.equal(upstream, 1);
    oversized = true;
    response = await fetch(url + "/?paperId=" + paper.id);
    assert.equal(response.status, 413);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
