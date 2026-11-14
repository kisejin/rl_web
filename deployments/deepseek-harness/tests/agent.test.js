import test from "node:test";
import assert from "node:assert/strict";
import { runHarnessCompletion } from "../engine.js";
const agent = {
  enabled: true,
  mode: "plan",
  skill: "default",
  webSearch: false,
  state: { goal: "Understand Bellman", status: "active", steps: [] },
  attachments: [],
};
const body = {
  model: "qwen3.8-flash",
  stream: true,
  max_tokens: 1800,
  messages: [
    { role: "system", content: "Teach RL and use tools." },
    { role: "user", content: "Make a study plan." },
  ],
  rl_atlas: agent,
};
const json = (message) =>
  new Response(
    JSON.stringify({
      choices: [
        { message, finish_reason: message.tool_calls ? "tool_calls" : "stop" },
      ],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
test("official Harness executes a plan update through the real MCP protocol, then resumes the model", async () => {
  const events = [];
  let requests = 0;
  const result = await runHarnessCompletion(body, {
    apiKey: "test-only-provider-secret",
    baseUrl: "https://gateway.test/v1",
    onAgent: (e) => events.push(e),
    fetchImpl: async (_url, options) => {
      const sent = JSON.parse(options.body);
      requests++;
      assert.ok(sent.tools.some((t) => t.function.name === "update_plan"));
      assert.ok(!sent.tools.some((t) => t.function.name === "web_search"));
      if (requests === 1)
        return json({
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "plan-call",
              type: "function",
              function: {
                name: "update_plan",
                arguments: JSON.stringify({
                  steps: [
                    {
                      title: "Derive the contraction inequality",
                      status: "pending",
                    },
                    { title: "Implement value iteration", status: "pending" },
                  ],
                }),
              },
            },
          ],
        });
      assert.ok(
        sent.messages.some(
          (m) =>
            m.role === "tool" &&
            m.tool_call_id === "plan-call" &&
            m.content.includes("Derive the contraction"),
        ),
      );
      assert.ok(
        sent.messages.some(
          (m) => m.role === "assistant" && m.tool_calls?.[0].id === "plan-call",
        ),
      );
      return json({
        role: "assistant",
        content: "Your two-step learning plan is ready.",
      });
    },
  });
  assert.equal(requests, 2);
  assert.equal(result.agentState.steps.length, 2);
  assert.ok(events.some((e) => e.type === "plan"));
  assert.deepEqual(
    events.filter((e) => e.type === "tool").map((e) => e.status),
    ["running", "done"],
  );
  assert.match(result.text, /two-step learning plan/);
});

test("native image input reaches the selected model without replacing the image with an invented description", async () => {
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
  let sent;
  const result = await runHarnessCompletion(
    {
      ...body,
      rl_atlas: {
        ...agent,
        mode: "ask",
        attachments: [
          {
            id: "1",
            kind: "image",
            name: "plot.png",
            dataUrl: image,
            width: 1,
            height: 1,
          },
        ],
      },
    },
    {
      apiKey: "test-only-provider-secret",
      baseUrl: "https://gateway.test/v1",
      fetchImpl: async (_url, options) => {
        sent = JSON.parse(options.body);
        return json({
          role: "assistant",
          content: "I can inspect the supplied image.",
        });
      },
    },
  );
  assert.equal(sent.messages.at(-1).content[1].image_url.url, image);
  assert.match(result.text, /supplied image/);
});

test("fragmented streamed tool-call arguments execute through MCP before a final streamed answer", async () => {
  let requests = 0;
  const updates = [];
  const result = await runHarnessCompletion(body, {
    apiKey: "test-only-provider-secret",
    baseUrl: "https://gateway.test/v1",
    onText: (t) => updates.push(t),
    fetchImpl: async (_url, options) => {
      const sent = JSON.parse(options.body);
      requests++;
      const chunks =
        requests === 1
          ? [
              { choices: [{ delta: { content: "I will create the plan." } }] },
              {
                choices: [
                  {
                    delta: {
                      tool_calls: [
                        {
                          index: 0,
                          id: "fragmented-plan",
                          function: {
                            name: "update_plan",
                            arguments: '{"steps":[',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
              {
                choices: [
                  {
                    delta: {
                      tool_calls: [
                        {
                          index: 0,
                          function: {
                            arguments:
                              '{"title":"Study γ contraction","status":"pending"}]}',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
              { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
            ]
          : [
              { choices: [{ delta: { content: "The plan has been saved." } }] },
              { choices: [{ delta: {}, finish_reason: "stop" }] },
            ];
      if (requests === 2)
        assert.ok(
          sent.messages.some(
            (m) =>
              m.role === "tool" && m.content.includes("Study γ contraction"),
          ),
        );
      return new Response(
        chunks.map((c) => "data: " + JSON.stringify(c) + "\n\n").join("") +
          "data: [DONE]\n\n",
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  });
  assert.equal(requests, 2);
  assert.equal(result.agentState.steps[0].title, "Study γ contraction");
  assert.equal(
    updates.join(""),
    "I will create the plan.\n\nThe plan has been saved.",
  );
});

test("an unending tool loop is bounded to four actual model calls", async () => {
  let calls = 0;
  await assert.rejects(
    runHarnessCompletion(body, {
      apiKey: "test-only-provider-secret",
      baseUrl: "https://gateway.test/v1",
      fetchImpl: async () => {
        calls++;
        return json({
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "search-" + calls,
              type: "function",
              function: {
                name: "course_search",
                arguments: '{"query":"Bellman"}',
              },
            },
          ],
        });
      },
    }),
  );
  assert.equal(calls, 4);
});
