import { readFile } from "node:fs/promises";
import { validPaperId } from "../src/paper-context.js";
let cached,
  expires = 0,
  inflight;
export async function loadPaperLibrary({ fresh = false } = {}) {
  if (!fresh && cached && Date.now() < expires) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    let feed;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { readResearchStore } = await import("./research-store.js");
        feed = await readResearchStore();
      } catch {}
    }
    const source = feed ? "live" : "bundled";
    if (!feed)
      feed = JSON.parse(
        await readFile(
          new URL("../public/research-feed.json", import.meta.url),
          "utf8",
        ),
      );
    if (!Array.isArray(feed.papers))
      throw new Error("Paper collection unavailable");
    cached = {
      papers: feed.papers.filter((p) => validPaperId(p.id)),
      updatedAt: feed.updatedAt,
      source,
    };
    expires = Date.now() + 60000;
    return cached;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
export function searchPaperLibrary(library, query) {
  const words =
    String(query)
      .toLowerCase()
      .match(/[\p{L}\p{N}.-]+/gu)
      ?.slice(0, 12) || [];
  if (!words.length) return [];
  return library.papers
    .map((p) => ({
      p,
      score: words.reduce(
        (score, w) =>
          score +
          (p.id === w ? 30 : 0) +
          (p.title.toLowerCase().includes(w) ? 5 : 0) +
          (p.abstract.toLowerCase().includes(w) ? 1 : 0) +
          ((p.topics || []).join(" ").includes(w) ? 3 : 0),
        0,
      ),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ p }) => ({
      id: p.id,
      title: p.title,
      url: "https://arxiv.org/abs/" + p.id,
      publishedAt: p.publishedAt,
      topics: p.topics,
      abstractExcerpt: p.abstract.slice(0, 900),
    }));
}
