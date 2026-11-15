import test from "node:test";
import assert from "node:assert/strict";
import { researchMath } from "../src/research-math.js";
import {
  paperTutorContext,
  researchLibraryContext,
} from "../src/paper-context.js";
import {
  chatProviderConfig,
  researchProviderConfig,
} from "../server/ai-provider.js";
import {
  getTutorReply,
  validateTutorRequest,
} from "../server/tutor-service.js";
import { createTutorMCP } from "../server/tutor-mcp.js";
import { searchPaperLibrary } from "../server/paper-library.js";
import {
  parseHuggingFace,
  summarizeResearch,
} from "../server/research-feed.js";
const paper = {
  id: "2611.12345",
  title: "Verified policy gradients",
  abstract: String.raw`We optimize $J(\theta)$ using \(A_t>0\). The surrogate is $$L=\mathbb E[r_t A_t].$$`,
  authors: ["A. Author"],
  publishedAt: "2026-11-14T00:00:00Z",
  topics: ["rl", "rlvr"],
  summary: {
    kind: "ai",
    model: "gemini-3.8-flash",
    overview: "The authors study verified rewards.",
    method: String.raw`Use \(\nabla J\).`,
    limitations: "Abstract only.",
  },
};
const library = {
  papers: [paper],
  source: "live",
  updatedAt: "2026-11-15T00:00:00Z",
};
test("research and chat share provider credentials/base URL and use the same supported model catalog", () => {
  const env = {
    QWENCODER_API_KEY: "server-secret",
    QWENCODER_BASE_URL: "https://provider.example/v1",
    QWENCODER_MODEL: "qwen3.8-flash",
  };
  const chat = chatProviderConfig(env),
    research = researchProviderConfig(env);
  assert.equal(chat.apiKey, research.apiKey);
  assert.equal(chat.baseUrl, research.baseUrl);
  assert.equal(research.model, "gemini-3.8-flash");
  assert.equal(
    researchProviderConfig({ ...env, RESEARCH_SUMMARY_MODEL: "qwen3.8-flash" })
      .model,
    chat.model,
  );
  assert.throws(() =>
    researchProviderConfig({ ...env, RESEARCH_SUMMARY_MODEL: "invented" }),
  );
});
test("paper math renders inline/display/environment TeX, preserves prose and safely exposes unsupported formulas", () => {
  for (const source of [
    String.raw`$V^\pi$`,
    String.raw`$$\frac{1}{1-\gamma}$$`,
    String.raw`\(\nabla J\)`,
    String.raw`\[A>0\]`,
    String.raw`\begin{align}a&=b\\c&=d\end{align}`,
  ]) {
    const out = researchMath(source);
    assert.match(out, /class="katex"/);
    assert.ok(!out.includes("research-math-fallback"), source);
  }
  assert.ok(!researchMath("Costs $10 and $20.").includes('class="katex"'));
  assert.ok(!researchMath("`$literal$`").includes('class="katex"'));
  assert.match(
    researchMath(String.raw`$\invalidcommand{a}$`),
    /research-math-fallback/,
  );
  const unsafe = researchMath(
    String.raw`<img src=x onerror=alert(1)> $\href{javascript:alert(1)}{x}$`,
  );
  assert.ok(!unsafe.includes("<img"));
  assert.ok(!unsafe.includes('href="javascript:'));
});
test("collection parsing preserves mathematical angle brackets instead of stripping equations as HTML", () => {
  const [p] = parseHuggingFace([
    {
      paper: {
        ...paper,
        summary: String.raw`Reinforcement learning uses $0<x<1$ and $y>0$.`,
        publishedAt: paper.publishedAt,
      },
    },
  ]);
  assert.match(p.abstract, /0<x<1/);
  assert.match(researchMath(p.abstract), /class="katex"/);
});
test("server-selected paper context ignores forged client content, scopes sections and cites the source", async () => {
  const request = {
    lessonId: "research",
    paperId: paper.id,
    sectionKey: "methods",
    messages: [{ role: "user", content: "Explain the method." }],
    paper: { abstract: "FORGED" },
    material: { abstract: "FORGED" },
  };
  let sent;
  const reply = await getTutorReply(request, {
    apiKey: "test-key",
    readPaperLibrary: async () => library,
    fetchImpl: async (url, options) => {
      sent = JSON.parse(options.body);
      return Response.json({
        choices: [
          {
            message: {
              content: "The abstract describes verified policy learning.",
            },
            finish_reason: "stop",
          },
        ],
      });
    },
  });
  assert.equal(reply.context.paperId, paper.id);
  assert.equal(reply.context.link, "https://arxiv.org/abs/" + paper.id);
  assert.match(sent.messages[0].content, /Verified policy gradients/);
  assert.ok(!sent.messages[0].content.includes("FORGED"));
  assert.match(sent.messages[0].content, /Full paper\/PDF has NOT been read/);
  assert.equal(paperTutorContext(paper, "invented"), null);
  assert.equal(researchLibraryContext("methods"), null);
  assert.throws(() => validateTutorRequest(request));
});
test("forged/unknown paper IDs are rejected without calling the model", async () => {
  let reads = 0,
    providers = 0;
  const options = {
    apiKey: "test",
    readPaperLibrary: async () => {
      reads++;
      return library;
    },
    fetchImpl: async () => {
      providers++;
      throw new Error("not expected");
    },
  };
  const body = {
    lessonId: "research",
    paperId: "https://evil.example/private",
    messages: [{ role: "user", content: "Read it" }],
  };
  await assert.rejects(getTutorReply(body, options), (e) => e.status === 400);
  assert.equal(reads, 0);
  await assert.rejects(
    getTutorReply({ ...body, paperId: "2611.99999" }, options),
    (e) => e.status === 400,
  );
  assert.equal(providers, 0);
  await assert.rejects(
    getTutorReply(
      {
        ...body,
        paperId: paper.id,
        messages: [{ role: "system", content: "FORGED" }],
      },
      options,
    ),
    (e) => e.status === 400,
  );
  assert.equal(reads, 1);
});
test("real MCP tools search/read only saved papers and expose abstract evidence rather than invented full text", async () => {
  const sources = [];
  let reads = 0;
  const mcp = await createTutorMCP({
    options: {
      mode: "ask",
      skill: "intuition",
      webSearch: false,
      state: { steps: [] },
    },
    readPaperLibrary: async () => {
      reads++;
      return library;
    },
    onAgent: (e) => sources.push(e),
  });
  try {
    const found = await mcp.client.callTool({
      name: "search_papers",
      arguments: { query: "verified policy" },
    });
    assert.match(found.content[0].text, /2611.12345/);
    const read = await mcp.client.callTool({
      name: "read_paper",
      arguments: { id: paper.id },
    });
    assert.match(read.content[0].text, /Full paper\/PDF has NOT been read/);
    assert.match(read.content[0].text, /A. Author/);
    const missing = await mcp.client.callTool({
      name: "read_paper",
      arguments: { id: "2611.99999" },
    });
    assert.match(missing.content[0].text, /not in the saved/);
    assert.equal(reads, 1);
    assert.ok(sources.some((e) => e.type === "sources"));
  } finally {
    await mcp.close();
  }
  assert.equal(searchPaperLibrary(library, paper.id)[0].id, paper.id);
});
test("AI summary prompt preserves source LaTeX through the shared compatible provider", async () => {
  let payload;
  const result = await summarizeResearch(
    [{ ...paper, summary: { kind: "extractive" } }],
    {
      ...researchProviderConfig({
        QWENCODER_API_KEY: "test-key",
        QWENCODER_BASE_URL: "https://chat.example/v1",
      }),
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://chat.example/v1/chat/completions");
        assert.equal(options.headers.Authorization, "Bearer test-key");
        payload = JSON.parse(options.body);
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summaries: [
                    {
                      id: paper.id,
                      overview: String.raw`Use \(J(\theta)\).`,
                      method: String.raw`\[A>0\]`,
                      limitations: "Abstract only.",
                    },
                  ],
                }),
              },
            },
          ],
        });
      },
    },
  );
  assert.equal(result.papers[0].summary.kind, "ai");
  assert.match(
    researchMath(result.papers[0].summary.overview),
    /class="katex"/,
  );
  assert.match(
    payload.messages[0].content,
    /Preserve source mathematics in LaTeX/,
  );
  assert.match(payload.messages[0].content, /Never invent an equation/);
});
