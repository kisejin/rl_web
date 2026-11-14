import test from "node:test";
import assert from "node:assert/strict";
import { validateAttachments } from "../src/tutor-attachments.js";
import {
  validateAgentOptions,
  normalizeAgentEvent,
} from "../src/tutor-agent.js";
import {
  validateTutorRequest,
  getTutorReply,
  tutorSystemPrompt,
} from "../server/tutor-service.js";
import { createTutorMCP } from "../server/tutor-mcp.js";
import { readTutorResponse } from "../src/tutor-response.js";
const settings = () =>
  validateAgentOptions({
    mode: "plan",
    skill: "proof",
    webSearch: false,
    state: { goal: "Understand Bellman", steps: [] },
  });
const question = {
  lessonId: "bellman",
  sectionKey: "proof",
  model: "gemini-3.8-flash",
  messages: [{ role: "user", content: "Review this proof." }],
  agent: settings(),
  attachments: [
    { kind: "text", name: "proof.txt", text: "Use the triangle inequality." },
  ],
};
test("agent requests validate trusted skill IDs and attachments while retaining authored lesson context", () => {
  const value = validateTutorRequest(question);
  const prompt = tutorSystemPrompt(
    value.context,
    value.agent,
    value.attachments,
  );
  assert.match(prompt, /ACTIVE SKILL/);
  assert.match(prompt, /State the theorem/);
  assert.match(prompt, /update_plan/);
  assert.ok(!prompt.includes("Use the triangle inequality."));
  for (const patch of [
    { agent: { ...settings(), skill: "../../secret" } },
    {
      attachments: [
        {
          kind: "image",
          name: "x.png",
          dataUrl: "data:image/png;base64,ZmFrZQ==",
          width: 10,
          height: 10,
        },
      ],
    },
    { attachments: new Array(4).fill(question.attachments[0]) },
  ])
    assert.throws(() => validateTutorRequest({ ...question, ...patch }));
  assert.throws(() =>
    validateAttachments([
      { name: "a.txt", kind: "text", text: "x".repeat(24001) },
    ]),
  );
});
test("agent metadata and files travel through the authenticated Harness bridge, never as a system-role browser override", async () => {
  const token = "test-bridge-" + "a".repeat(40);
  let payload;
  await getTutorReply(question, {
    apiKey: "private-provider",
    harnessUrl: "https://harness.test/v1",
    harnessToken: token,
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, "Bearer " + token);
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: "A useful explanation." },
              finish_reason: "stop",
            },
          ],
        }),
      };
    },
  });
  assert.equal(
    payload.rl_atlas.attachments[0].text,
    question.attachments[0].text,
  );
  assert.equal(payload.rl_atlas.skill, "proof");
  assert.equal(payload.messages[0].role, "system");
  assert.ok(!JSON.stringify(payload).includes(token));
});
test("MCP exposes real tools/resources, reads trusted skills and attachments, and isolates per-request plans", async () => {
  const a = await createTutorMCP({
    options: settings(),
    attachments: [
      { id: "1", name: "notes.txt", kind: "text", text: "Bellman fixed point" },
    ],
  });
  const b = await createTutorMCP({ options: settings() });
  try {
    assert.equal(a.tools.length, 6);
    assert.ok(!a.tools.some((t) => t.name === "web_search"));
    const resources = await a.client.listResources();
    assert.equal(resources.resources[0].uri, "rlatlas://course/index");
    const resource = await a.client.readResource({
      uri: "rlatlas://course/index",
    });
    assert.match(resource.contents[0].text, /Bellman/);
    const search = await a.client.callTool({
      name: "course_search",
      arguments: { query: "Bellman contraction" },
    });
    assert.match(search.content[0].text, /bellman/);
    const skill = await a.client.callTool({
      name: "load_skill",
      arguments: { id: "python" },
    });
    assert.match(skill.content[0].text, /standard Python/);
    const file = await a.client.callTool({
      name: "read_attachment",
      arguments: { id: "1" },
    });
    assert.match(file.content[0].text, /fixed point/);
    await a.client.callTool({
      name: "update_plan",
      arguments: { steps: [{ title: "Prove contraction", status: "pending" }] },
    });
    assert.equal(a.state.steps.length, 1);
    assert.equal(b.state.steps.length, 0);
  } finally {
    await a.close();
    await b.close();
  }
});
test("opt-in web search calls only Crossref and exposes publication metadata with real DOI links", async () => {
  let called;
  const mcp = await createTutorMCP({
    options: { ...settings(), webSearch: true },
    fetchImpl: async (url) => {
      called = new URL(url);
      return new Response(
        JSON.stringify({
          message: {
            items: [
              {
                title: ["Policy gradients"],
                DOI: "10.1234/rl",
                published: { "date-parts": [[2025]] },
              },
            ],
          },
        }),
      );
    },
  });
  try {
    const result = await mcp.client.callTool({
      name: "web_search",
      arguments: { query: "reinforcement learning policy gradient" },
    });
    assert.equal(called.origin, "https://api.crossref.org");
    assert.match(result.content[0].text, /https:\/\/doi.org\/10.1234\/rl/);
    assert.match(result.content[0].text, /not full-text/);
  } finally {
    await mcp.close();
  }
});
test("agent events are separate from answer deltas and unsafe source links are discarded", async () => {
  const events = [],
    text = [];
  const data = [
    ["agent", { type: "tool", name: "course_search", status: "running" }],
    ["delta", { text: "Answer" }],
    ["done", { truncated: false }],
  ]
    .map(
      ([event, value]) => `event: ${event}\ndata: ${JSON.stringify(value)}\n\n`,
    )
    .join("");
  await readTutorResponse(
    new Response(data, { headers: { "Content-Type": "text/event-stream" } }),
    { onAgent: (e) => events.push(e), onDelta: (t) => text.push(t) },
  );
  assert.equal(events[0].name, "course_search");
  assert.deepEqual(text, ["Answer"]);
  assert.equal(
    normalizeAgentEvent({
      type: "sources",
      sources: [{ title: "Bad", url: "javascript:alert(1)" }],
    }).sources.length,
    0,
  );
});
