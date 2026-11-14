import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { lessons } from "../src/content.js";
import { tutorTopics } from "../src/tutor-context.js";
import { normalizeAgentState } from "../src/tutor-agent.js";
import { readTutorSkill } from "./tutor-skills.js";

const records = lessons.flatMap((lesson) =>
  tutorTopics(lesson.id).map((topic) => ({
    lessonId: lesson.id,
    title: lesson.title + " · " + topic.title,
    section: topic.key,
    url: "/#lesson/" + lesson.id,
    text: JSON.stringify(topic.content),
  })),
);
export function searchCourse(query) {
  const words =
    query
      .toLowerCase()
      .match(/[\p{L}\p{N}-]+/gu)
      ?.filter((s) => s.length > 1)
      .slice(0, 12) || [];
  return records
    .map((r) => ({
      r,
      score: words.reduce(
        (score, word) =>
          score +
          (r.title.toLowerCase().includes(word) ? 4 : 0) +
          (r.text.toLowerCase().includes(word) ? 1 : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ r }) => ({ ...r, text: r.text.slice(0, 1300) }));
}
async function publicationSearch(query, signal, fetchImpl) {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", "5");
  url.searchParams.set("select", "title,DOI,URL,published");
  const response = await fetchImpl(url, {
    signal: AbortSignal.any([
      ...(signal ? [signal] : []),
      AbortSignal.timeout(6500),
    ]),
    headers: {
      Accept: "application/json",
      "User-Agent": "RLAtlas/1.0 (https://rlatlas.vercel.app)",
    },
  });
  if (!response.ok)
    throw new Error("Publication search is unavailable. Try course search.");
  const raw = await response.text();
  if (raw.length > 256000) throw new Error("Search response is too large.");
  const data = JSON.parse(raw);
  return (data.message?.items || [])
    .slice(0, 5)
    .map((item) => ({
      title: String(item.title?.[0] || "Publication")
        .replace(/<[^>]*>/g, "")
        .slice(0, 180),
      url:
        "https://doi.org/" +
        encodeURIComponent(String(item.DOI || "")).replaceAll("%2F", "/"),
      year: item.published?.["date-parts"]?.[0]?.[0] || null,
    }))
    .filter(
      (item) => item.url.length < 1000 && item.url !== "https://doi.org/",
    );
}
export async function createTutorMCP({
  options,
  attachments = [],
  onAgent = () => {},
  fetchImpl = fetch,
  signal,
}) {
  const server = new McpServer({ name: "rl-atlas-learning", version: "1.0.0" });
  const client = new Client({ name: "rl-atlas-harness", version: "1.0.0" });
  let state = normalizeAgentState(options.state);
  const result = (value) => ({
    content: [{ type: "text", text: JSON.stringify(value) }],
  });
  const tool = (name, description, inputSchema, run) =>
    server.registerTool(
      name,
      { description, inputSchema },
      async (args, extra) => {
        signal?.throwIfAborted();
        try {
          return result(await run(args, extra.signal));
        } catch {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "This tool could not complete. Do not invent its results.",
              },
            ],
          };
        }
      },
    );
  tool(
    "course_search",
    "Search authored RL Atlas lessons and return relevant excerpts with source links.",
    { query: z.string().min(2).max(200) },
    ({ query }) => {
      const matches = searchCourse(query);
      onAgent({ type: "sources", sources: matches });
      return { matches };
    },
  );
  tool(
    "read_lesson",
    "Read an authored lesson section. section defaults to overview; use proof for the mathematical proof.",
    { lessonId: z.string().max(60), section: z.string().max(60).optional() },
    ({ lessonId, section = "overview" }) => {
      const match = records.find(
        (r) => r.lessonId === lessonId && r.section === section,
      );
      if (!match)
        return { error: "Unknown lesson/section. Use course_search." };
      onAgent({ type: "sources", sources: [match] });
      return { ...match, text: match.text.slice(0, 7000) };
    },
  );
  tool(
    "load_skill",
    "Load one trusted learning skill: intuition, proof, python, review.",
    { id: z.enum(["intuition", "proof", "python", "review"]) },
    ({ id }) => {
      const skill = readTutorSkill(id);
      onAgent({ type: "skill", label: "Loaded skill: " + skill.name });
      return skill;
    },
  );
  tool(
    "read_attachment",
    "Read an attached text/PDF/code excerpt by attachment id, using offset for subsequent excerpts. Images are already provided as native image input.",
    {
      id: z.string().max(10),
      offset: z.number().int().min(0).max(32000).optional(),
    },
    ({ id, offset = 0 }) => {
      const file = attachments.find((f) => f.id === id);
      if (!file) return { error: "Attachment not found." };
      if (file.kind === "image")
        return {
          name: file.name,
          kind: "image",
          note: "Inspect the native image input. No OCR text was extracted.",
        };
      return {
        name: file.name,
        text: file.text.slice(offset, offset + 8000),
        offset,
        nextOffset: offset + 8000 < file.text.length ? offset + 8000 : null,
        partial: file.partial,
      };
    },
  );
  tool(
    "update_plan",
    "Create or replace this learner’s plan (maximum 8 steps). This records a plan, not executed work or course completion.",
    {
      steps: z
        .array(
          z.object({
            title: z.string().min(1).max(180),
            status: z.enum(["pending", "in_progress", "done"]),
          }),
        )
        .min(1)
        .max(8),
    },
    ({ steps }) => {
      state = normalizeAgentState({ ...state, steps });
      onAgent({ type: "plan", state });
      return { state };
    },
  );
  tool(
    "update_goal",
    "Set the learner’s goal and its personal tracking status; does not award course achievements.",
    {
      goal: z.string().min(1).max(240),
      status: z.enum(["active", "paused", "done"]),
    },
    ({ goal, status }) => {
      state = normalizeAgentState({ ...state, goal, status });
      onAgent({ type: "goal", state });
      return { state };
    },
  );
  if (options.webSearch)
    tool(
      "web_search",
      "Search external scholarly publication metadata via Crossref. Returns titles, DOI links and publication years, not full paper contents. Cite returned links and distinguish metadata from evidence read in a paper.",
      { query: z.string().min(2).max(200) },
      async ({ query }, toolSignal) => {
        const sources = await publicationSearch(query, toolSignal, fetchImpl);
        onAgent({ type: "sources", sources });
        return {
          provider: "Crossref",
          kind: "publication metadata, not full-text pages",
          sources,
        };
      },
    );
  server.registerResource(
    "course-index",
    "rlatlas://course/index",
    {
      description: "Available RL Atlas chapters",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            lessons.map((l) => ({ id: l.id, title: l.title })),
          ),
        },
      ],
    }),
  );
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  } catch (error) {
    await Promise.allSettled([client.close(), server.close()]);
    throw error;
  }
  const { tools } = await client.listTools();
  onAgent({
    type: "status",
    label: `Built-in MCP connected · ${tools.length} tools`,
  });
  const activeSkill = readTutorSkill(options.skill);
  if (activeSkill)
    onAgent({ type: "skill", label: "Loaded skill: " + activeSkill.name });
  return {
    client,
    tools,
    get state() {
      return state;
    },
    close: async () => {
      await Promise.allSettled([client.close(), server.close()]);
    },
  };
}
