import { list, put } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { readBounded, FEED_VERSION, MAX_PAPERS } from "./research-feed.js";
export function validFeed(data) {
  return (
    data?.version === FEED_VERSION &&
    Array.isArray(data.papers) &&
    data.papers.length <= MAX_PAPERS
  );
}
export async function seedFeed() {
  return JSON.parse(
    await readFile(
      new URL("../public/research-feed.json", import.meta.url),
      "utf8",
    ),
  );
}
export async function readResearchStore({
  token = process.env.BLOB_READ_WRITE_TOKEN,
  fetchImpl = fetch,
} = {}) {
  if (!token) throw new Error("Research storage is not configured");
  const result = await list({
    prefix: "research/feed.json",
    limit: 1,
    token,
    abortSignal: AbortSignal.timeout(5000),
  });
  const blob = result.blobs.find((b) => b.pathname === "research/feed.json");
  if (!blob) return null;
  const data = JSON.parse(
    await readBounded(
      await fetchImpl(blob.url + "?read=" + Date.now(), {
        signal: AbortSignal.timeout(5000),
      }),
      4000000,
    ),
  );
  if (!validFeed(data)) throw new Error("Stored research feed is invalid");
  return data;
}
export async function writeResearchStore(
  feed,
  { token = process.env.BLOB_READ_WRITE_TOKEN } = {},
) {
  if (!token || !validFeed(feed))
    throw new Error("Research storage is not configured or feed is invalid");
  return put("research/feed.json", JSON.stringify(feed), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    token,
    abortSignal: AbortSignal.timeout(5000),
  });
}
