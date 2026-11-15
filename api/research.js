import { readResearchStore, seedFeed } from "../server/research-store.js";
export function createResearchHandler({
  read = readResearchStore,
  seed = seedFeed,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }
    let data,
      storage = "live";
    try {
      data = await read();
    } catch {
      storage = "bundled";
    }
    if (!data) {
      storage = "bundled";
      data = await seed();
    }
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    );
    return res.status(200).json({ ...data, storage });
  };
}
export default createResearchHandler();
