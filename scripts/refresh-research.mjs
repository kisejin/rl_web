// Local seed generation uses public metadata only; production enrichment uses server credentials.
import { readFile, writeFile } from "node:fs/promises";
import {
  discoverResearch,
  mergeResearch,
  summarizeResearch,
  makeFeed,
} from "../server/research-feed.js";
const path = new URL("../public/research-feed.json", import.meta.url),
  now = new Date();
let previous;
try {
  previous = JSON.parse(await readFile(path, "utf8"));
} catch {
  previous = { papers: [] };
}
const discovered = await discoverResearch({ now });
if (!discovered.sourceStatuses.some((s) => s.ok))
  throw new Error(
    "All discovery sources failed; the previous seed was retained.",
  );
const papers = mergeResearch(previous, discovered.papers, now),
  summarized = await summarizeResearch(papers);
const feed = makeFeed(previous, discovered, summarized, now);
await writeFile(path, JSON.stringify(feed, null, 2) + "\n");
console.log(
  JSON.stringify({
    papers: papers.length,
    sources: feed.sourceStatuses,
    summaryStatus: feed.summaryStatus,
  }),
);
