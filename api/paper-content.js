import { loadPaperLibrary } from "../server/paper-library.js";
import { getPaperContent } from "../server/paper-content-store.js";
import { validPaperId } from "../src/paper-context.js";
export const config = { maxDuration: 60 };
const limits = new Map();
let active = 0;
function allow(ip) {
  const now = Date.now();
  for (const [k, v] of limits) if (v.until < now) limits.delete(k);
  if (limits.size > 2000) limits.clear();
  const entry = limits.get(ip) || { count: 0, until: now + 60000 };
  entry.count++;
  limits.set(ip, entry);
  return entry.count <= 20;
}
export function createPaperContentHandler({
  readLibrary = loadPaperLibrary,
  collect = getPaperContent,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const id = new URL(
      req.url || "/",
      "https://rlatlas.vercel.app",
    ).searchParams.get("paperId");
    if (!validPaperId(id) || id.length > 60)
      return res.status(400).json({ error: "Choose a valid collected paper." });
    if (
      !allow(String(req.headers["x-forwarded-for"] || "local").split(",")[0]) ||
      active >= 4
    )
      return res
        .status(429)
        .json({ error: "Paper content is busy. Retry shortly." });
    active++;
    try {
      const library = await readLibrary(),
        paper = library.papers.find((p) => p.id === id);
      if (!paper)
        return res
          .status(404)
          .json({ error: "Paper is not in the saved collection." });
      const content = await collect(paper);
      res.setHeader(
        "Cache-Control",
        "public, max-age=60, s-maxage=3600, stale-while-revalidate=3600",
      );
      return res.status(200).json(content);
    } catch {
      return res
        .status(503)
        .json({
          error:
            "Paper content could not be retrieved. The original PDF remains available.",
        });
    } finally {
      active--;
    }
  };
}
export default createPaperContentHandler();
