import { load } from "cheerio";
import { validPaperId } from "../src/paper-context.js";
import { inferPrerequisites } from "../src/paper-prerequisites.js";
import { readBounded } from "./research-feed.js";
export const PAPER_CONTENT_PARSER = 2;
const HOSTS = new Set([
  "arxiv.org",
  "www.arxiv.org",
  "export.arxiv.org",
  "ar5iv.labs.arxiv.org",
  "ar5iv.org",
]);
export function safePaperUrl(value, id, kind = "html") {
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      !HOSTS.has(u.hostname) ||
      u.username ||
      u.password ||
      u.port
    )
      return null;
    const path = decodeURIComponent(u.pathname),
      prefix = `/${kind}/${id}`;
    if (!path.startsWith(prefix)) return null;
    const rest = path.slice(prefix.length);
    if (kind === "pdf" && !/^(?:v\d+)?(?:\.pdf)?$/.test(rest)) return null;
    if (kind === "html" && !/^(?:v\d+)?(?:\/[^\x00]*)?$/.test(rest))
      return null;
    if (
      path.split("/").some((p) => p === ".." || p === ".") ||
      /[\x00-\x1f]/.test(path)
    )
      return null;
    u.hash = "";
    u.search = "";
    return u.href;
  } catch {
    return null;
  }
}
export async function fetchPaperResource(
  url,
  id,
  { fetchImpl = fetch, signal, kind = "html" } = {},
) {
  let current = safePaperUrl(url, id, kind);
  if (!current) throw new Error("Invalid paper source");
  for (let i = 0; i < 4; i++) {
    const response = await fetchImpl(current, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": "RLAtlasResearch/1.0 (https://rlatlas.vercel.app)",
        Accept: kind === "pdf" ? "application/pdf" : "text/html",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      await response.body?.cancel();
      current = safePaperUrl(new URL(next, current).href, id, kind);
      if (!current) throw new Error("Invalid source redirect");
      continue;
    }
    if (!response.ok) throw new Error("Paper source unavailable");
    return { response, url: current };
  }
  throw new Error("Too many source redirects");
}
export function parsePaperHtml(html, paper, sourceUrl) {
  if (!validPaperId(paper.id) || !safePaperUrl(sourceUrl, paper.id))
    throw new Error("Invalid source");
  const $ = load(html),
    root = $("article.ltx_document, .ltx_document, article").first();
  if (!root.length) throw new Error("No paper document");
  root
    .find(
      "script,style,nav,button,.ltx_bibliography,.ltx_page_footer,.ltx_page_header",
    )
    .remove();
  function text(node, max = 16000) {
    const clone = $(node).clone();
    clone.find("math").each((_, m) => {
      const tex =
        $(m).attr("alttext") ||
        $(m).find('annotation[encoding="application/x-tex"]').first().text();
      $(m).replaceWith(
        $("<span></span>").text(
          tex
            ? ` ${$(m).attr("display") === "block" ? "\\[" : "\\("}${tex}${$(m).attr("display") === "block" ? "\\]" : "\\)"} `
            : $(m).text(),
        ),
      );
    });
    return clone.text().replace(/\s+/g, " ").trim().slice(0, max);
  }
  const fullText = text(root, 250000),
    assets = [],
    tables = [],
    unsupported = [];
  if (fullText.length < 300 && !root.find(".ltx_figure,.ltx_table").length)
    throw new Error("No usable full-text conversion");
  const seen = new Set();
  root.find("img,object[data],embed[src]").each((_, el) => {
    const node = $(el),
      raw = node.attr("src") || node.attr("data");
    if (!raw) return;
    let url;
    try {
      url =
        safePaperUrl(new URL(raw, sourceUrl).href, paper.id) ||
        safePaperUrl(
          new URL(raw, sourceUrl.replace(/\/$/, "") + "/").href,
          paper.id,
        );
    } catch {
      return;
    }
    if (!url) {
      unsupported.push({
        reason: "Asset is outside the paper source",
        sourceId: node.attr("id") || null,
      });
      return;
    }
    if (seen.has(url)) return;
    seen.add(url);
    const format = /\.(svg|png|jpe?g|gif|webp|avif)$/i
      .exec(new URL(url).pathname)?.[1]
      ?.toLowerCase();
    let figure = node.closest("figure"),
      caption = figure.children("figcaption").first();
    if (!caption.length) {
      for (const parent of figure.parents("figure").toArray()) {
        const c = $(parent).children("figcaption").first();
        if (c.length) {
          figure = $(parent);
          caption = c;
          break;
        }
      }
    }
    const record = {
      id: node.attr("id") || "asset-" + (assets.length + 1),
      figureId: figure.attr("id") || null,
      url,
      format: format || "unsupported",
      caption: text(caption) || node.attr("alt") || "Uncaptioned paper image",
      alt: node.attr("alt") || "",
      sourceAnchor: figure.attr("id") || node.attr("id") || null,
    };
    assets.push(record);
    if (!format)
      unsupported.push({
        reason: "Asset format is not an image; open the source or complete PDF",
        sourceId: record.id,
      });
  });
  root.find("figure svg, svg.ltx_graphics").each((_, el) => {
    if (
      !$(el).closest("math,.ltx_float_algorithm").length &&
      $(el).find(
        "path,rect,circle,line,polyline,polygon,text,image,foreignObject",
      ).length
    )
      unsupported.push({
        reason: "Inline vector graphic; use source or complete PDF",
        sourceId: $(el).attr("id") || null,
      });
  });
  root
    .find("table.ltx_tabular, figure.ltx_table > table, .ltx_table table")
    .each((_, el) => {
      const node = $(el);
      if (node.parents("table").length) return;
      let wrapper = node.closest(".ltx_table,figure"),
        caption = wrapper.children("figcaption,.ltx_caption").first();
      if (!caption.length) {
        for (const parent of wrapper.parents(".ltx_table,figure").toArray()) {
          const candidate = $(parent)
            .children("figcaption,.ltx_caption")
            .first();
          if (candidate.length) {
            wrapper = $(parent);
            caption = candidate;
            break;
          }
        }
      }
      const rows = [];
      node.find("tr").each((_, tr) => {
        if ($(tr).closest("table")[0] !== el) return;
        const cells = $(tr)
          .children("th,td")
          .map((_, cell) => ({
            text: text(cell, 12000),
            header: cell.name === "th",
            rowspan: Math.min(
              100,
              Math.max(1, Number($(cell).attr("rowspan")) || 1),
            ),
            colspan: Math.min(
              100,
              Math.max(1, Number($(cell).attr("colspan")) || 1),
            ),
          }))
          .get();
        if (cells.length) rows.push(cells);
      });
      if (rows.length)
        tables.push({
          id:
            wrapper.attr("id") ||
            node.attr("id") ||
            "table-" + (tables.length + 1),
          caption: text(caption) || "Uncaptioned paper table",
          rows,
          sourceAnchor: wrapper.attr("id") || node.attr("id") || null,
        });
    });
  return {
    version: 1,
    parserVersion: PAPER_CONTENT_PARSER,
    paperId: paper.id,
    sourceUpdatedAt: paper.updatedAt || paper.publishedAt,
    sourceUrl,
    checkedAt: new Date().toISOString(),
    status: unsupported.length ? "partial" : "html",
    assets,
    tables,
    unsupported,
    coverage: {
      basis: "HTML conversion",
      assets: assets.length,
      tables: tables.length,
      unsupported: unsupported.length,
      includesAppendices: true,
      note: "All image/object assets and semantic tables found in this HTML document, including its appendix. The HTML conversion may differ from the PDF; use Complete PDF for the full visual record.",
    },
    prerequisites: inferPrerequisites(paper, fullText),
  };
}
export async function collectPaperContent(paper, { fetchImpl = fetch } = {}) {
  for (const host of ["https://arxiv.org", "https://ar5iv.labs.arxiv.org"]) {
    try {
      const { response, url } = await fetchPaperResource(
        host + "/html/" + paper.id,
        paper.id,
        { fetchImpl, signal: AbortSignal.timeout(13000) },
      );
      if (!response.headers.get("content-type")?.includes("text/html"))
        throw new Error("Not HTML");
      const html = await readBounded(response, 12000000);
      return parsePaperHtml(html, paper, url);
    } catch {}
  }
  return {
    version: 1,
    parserVersion: PAPER_CONTENT_PARSER,
    paperId: paper.id,
    sourceUpdatedAt: paper.updatedAt || paper.publishedAt,
    sourceUrl: "https://arxiv.org/abs/" + paper.id,
    checkedAt: new Date().toISOString(),
    status: "pdf-only",
    assets: [],
    tables: [],
    unsupported: [],
    prerequisites: inferPrerequisites(paper),
    coverage: {
      basis: "Abstract only; HTML conversion unavailable",
      assets: 0,
      tables: 0,
      unsupported: 0,
      includesAppendices: false,
      note: "A usable full-text HTML conversion could not be retrieved. No claim of zero figures or tables is made. Complete PDF shows the original pages, including their figures and tables.",
    },
  };
}
