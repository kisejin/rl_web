import { timingSafeEqual } from "node:crypto";
import {
  discoverResearch,
  mergeResearch,
  summarizeResearch,
  makeFeed,
} from "../server/research-feed.js";
import {
  readResearchStore,
  writeResearchStore,
  seedFeed,
} from "../server/research-store.js";
export const config = { maxDuration: 60 };
function authorized(header, secret) {
  if (!secret || typeof header !== "string") return false;
  const expected = Buffer.from("Bearer " + secret),
    actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function createResearchRefreshHandler({
  read = readResearchStore,
  write = writeResearchStore,
  seed = seedFeed,
  discover = discoverResearch,
  summarize = summarizeResearch,
  now = () => new Date(),
  secret = () => process.env.CRON_SECRET,
  summaryOptions = () => ({
    apiKey: process.env.QWENCODER_API_KEY,
    baseUrl:
      process.env.QWENCODER_BASE_URL || "https://api.qwencoder.cloud/api/v1",
    model: "qwen3.8-flash",
  }),
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!authorized(req.headers.authorization, secret()))
      return res.status(401).json({ error: "Unauthorized" });
    try {
      const current = now(),
        stored = await read();
      if (
        stored?.lastAttemptAt?.slice(0, 10) ===
          current.toISOString().slice(0, 10) &&
        stored.status !== "unavailable"
      )
        return res
          .status(200)
          .json({
            status: "already-updated",
            papers: stored.papers.length,
            updatedAt: stored.updatedAt,
          });
      const previous = stored || (await seed());
      const discovered = await discover({ now: current });
      const papers = mergeResearch(previous, discovered.papers, current);
      const summarized = await summarize(papers, summaryOptions());
      const feed = makeFeed(previous, discovered, summarized, current);
      await write(feed);
      return res
        .status(feed.status === "unavailable" ? 502 : 200)
        .json({
          status: feed.status,
          papers: feed.papers.length,
          updatedAt: feed.updatedAt,
          sourceStatuses: feed.sourceStatuses,
          summaryStatus: feed.summaryStatus,
        });
    } catch {
      return res
        .status(503)
        .json({
          error:
            "Research refresh is temporarily unavailable. The saved feed is retained.",
        });
    }
  };
}
export default createResearchRefreshHandler();
