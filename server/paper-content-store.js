import { list, put } from "@vercel/blob";
import { readBounded } from "./research-feed.js";
import { collectPaperContent, PAPER_CONTENT_PARSER } from "./paper-content.js";
const memory = new Map(),
  pending = new Map();
const pathFor = (id) =>
  "research/paper-content/" + id.replace("/", "_") + ".json";
export async function readPaperContentStore(id) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const path = pathFor(id),
    result = await list({
      prefix: path,
      limit: 1,
      token,
      abortSignal: AbortSignal.timeout(4000),
    }),
    blob = result.blobs.find((b) => b.pathname === path);
  if (!blob) return null;
  const response = await fetch(blob.url, { signal: AbortSignal.timeout(4000) }),
    data = JSON.parse(await readBounded(response, 4000000));
  return data.version === 1 && data.paperId === id ? data : null;
}
export async function writePaperContentStore(data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  const raw = JSON.stringify(data);
  if (Buffer.byteLength(raw) > 3800000) return;
  await put(pathFor(data.paperId), raw, {
    token,
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    abortSignal: AbortSignal.timeout(4000),
  });
}
export async function getPaperContent(
  paper,
  {
    collect = collectPaperContent,
    read = readPaperContentStore,
    write = writePaperContentStore,
  } = {},
) {
  const current = memory.get(paper.id),
    revision = paper.updatedAt || paper.publishedAt;
  if (
    current &&
    current.expires > Date.now() &&
    current.data.parserVersion === PAPER_CONTENT_PARSER &&
    current.data.sourceUpdatedAt === revision
  )
    return current.data;
  if (pending.has(paper.id)) return pending.get(paper.id);
  const work = (async () => {
    let saved;
    try {
      saved = await read(paper.id);
    } catch {}
    const ttl = (d) => (d.status === "pdf-only" ? 1800000 : 86400000);
    if (
      saved &&
      saved.parserVersion === PAPER_CONTENT_PARSER &&
      saved.sourceUpdatedAt === revision &&
      Date.now() - Date.parse(saved.checkedAt) < ttl(saved)
    ) {
      if (memory.size >= 30 && !memory.has(paper.id)) memory.delete(memory.keys().next().value);
      memory.set(paper.id, { data: saved, expires: Date.now() + ttl(saved) });
      return saved;
    }
    const data = await collect(paper);
    try {
      await write(data);
    } catch {}
    if (memory.size >= 30) memory.delete(memory.keys().next().value);
    memory.set(paper.id, { data, expires: Date.now() + ttl(data) });
    return data;
  })();
  pending.set(paper.id, work);
  try {
    return await work;
  } finally {
    pending.delete(paper.id);
  }
}
