import { once } from "node:events";
import { loadPaperLibrary } from "../server/paper-library.js";
import { fetchPaperResource } from "../server/paper-content.js";
import { validPaperId } from "../src/paper-context.js";
export const config = { maxDuration: 60 };
export const MAX_PDF_BYTES = 48 * 1024 * 1024;
export function createPaperPdfHandler({
  readLibrary = loadPaperLibrary,
  fetchImpl = fetch,
} = {}) {
  return async function handler(req, res) {
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
    const controller = new AbortController(),
      signal = AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]);
    const closed = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on("close", closed);
    let reader,
      started = false;
    try {
      const library = await readLibrary();
      if (!library.papers.some((p) => p.id === id))
        return res
          .status(404)
          .json({ error: "Paper is not in the saved collection." });
      const { response } = await fetchPaperResource(
        "https://arxiv.org/pdf/" + id,
        id,
        { kind: "pdf", fetchImpl, signal },
      );
      if (
        !/application\/pdf|application\/octet-stream/i.test(
          response.headers.get("content-type") || "",
        )
      )
        throw new Error("Not PDF");
      if (Number(response.headers.get("content-length")) > MAX_PDF_BYTES) {
        await response.body.cancel();
        return res
          .status(413)
          .json({
            error:
              "This PDF exceeds the in-app size limit. Open the original PDF.",
          });
      }
      reader = response.body.getReader();
      const first = [];
      let size = 0,
        done = false;
      while (size < 5 && !done) {
        const part = await reader.read();
        done = part.done;
        if (part.value) {
          size += part.value.byteLength;
          first.push(part.value);
        }
      }
      if (!Buffer.concat(first).subarray(0, 5).equals(Buffer.from("%PDF-")))
        throw new Error("Not PDF");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${id.replace("/", "_")}.pdf"`,
      );
      res.setHeader("Accept-Ranges", "none");
      res.setHeader("Cache-Control", "public, max-age=600, s-maxage=86400");
      res.setHeader("Content-Security-Policy", "sandbox");
      res.flushHeaders?.();
      started = true;
      for (const chunk of first)
        if (!res.write(chunk)) await once(res, "drain", { signal });
      while (!done) {
        const part = await reader.read();
        done = part.done;
        if (part.value) {
          size += part.value.byteLength;
          if (size > MAX_PDF_BYTES) throw new Error("PDF too large");
          if (!res.write(part.value)) await once(res, "drain", { signal });
        }
      }
      res.end();
    } catch {
      if (!started)
        return res
          .status(502)
          .json({
            error:
              "The PDF could not be retrieved. Open the original PDF on arXiv.",
          });
      res.destroy();
    } finally {
      await reader?.cancel().catch(() => {});
      reader?.releaseLock();
      res.off("close", closed);
      controller.abort();
    }
  };
}
export default createPaperPdfHandler();
