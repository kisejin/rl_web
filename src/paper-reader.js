import { PDF_RUNTIME_OPTIONS } from "./pdf-runtime.js";
import { researchMath } from "./research-math.js";
import { inferPrerequisites } from "./paper-prerequisites.js";
import { escapeText as esc } from "./math-text.js";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./paper-reader.css";
export function prerequisitesMarkup(items, scope = "abstract") {
  return `<p class="paper-reading-scope">Recommended reading background, ${scope === "full-text" ? "matched against the HTML full text" : "based on the title/abstract"}. These are study recommendations, not an author-certified prerequisite list. Formulas below are teaching references.</p><div class="paper-math-grid">${items.map((item) => `<article class="paper-math-concept"><div><span>${esc(item.level)}</span><span>${item.basis === "foundation" ? "General foundation" : item.basis === "full-text" ? "Matched in full text" : "Matched in abstract"}</span></div><h4>${esc(item.title)}</h4><p>${esc(item.why)}</p><div class="paper-concept-equation">${researchMath("\\[" + item.formula + "\\]")}</div>${item.evidence ? `<details><summary>Why this topic is suggested</summary><p>${esc(item.note)}</p><blockquote>${researchMath(item.evidence)}</blockquote></details>` : `<p class="paper-concept-note">${esc(item.note)}</p>`}<a href="/#atlas/${item.link}" target="_blank" rel="noopener">Study this concept →</a></article>`).join("")}</div>`;
}
function sourceAnchor(content, anchor) {
  return content.sourceUrl + (anchor ? "#" + encodeURIComponent(anchor) : "");
}
function tableMarkup(table, content) {
  return `<article class="paper-table"><h3>${researchMath(table.caption)}</h3><div class="paper-table-scroll" tabindex="0" aria-label="Scrollable paper table"><table>${table.rows.map((row) => `<tr>${row.map((cell) => `<${cell.header ? "th" : "td"} rowspan="${cell.rowspan}" colspan="${cell.colspan}">${researchMath(cell.text)}</${cell.header ? "th" : "td"}>`).join("")}</tr>`).join("")}</table></div><a href="${esc(sourceAnchor(content, table.sourceAnchor))}" target="_blank" rel="noopener noreferrer">View table in source ↗</a></article>`;
}
export function mountPaperReader(root, { papers, onDiscuss = () => {} } = {}) {
  const life = new AbortController(),
    options = { signal: life.signal };
  const dialog = document.createElement("dialog");
  dialog.className = "paper-reader";
  dialog.setAttribute("aria-label", "Paper figures, tables and mathematics");
  document.body.append(dialog);
  let paper,
    content,
    tab = "math",
    request,
    pdfTask,
    pdfDoc,
    pdfStart = 1,
    pdfLoading = false,
    renderTasks = [],
    pdfRenderEpoch = 0,
    generation = 0,
    lastFocus;
  const cache = new Map();
  function destroyPdf() {
    generation++;
    pdfRenderEpoch++;
    for (const t of renderTasks) t.cancel();
    renderTasks = [];
    pdfTask?.destroy().catch(() => {});
    pdfTask = null;
    pdfDoc = null;
    pdfLoading = false;
  }
  function shell() {
    dialog.innerHTML = `<header class="paper-reader-header"><div><span>RESEARCH READING ROOM</span><h2>${researchMath(paper.title)}</h2></div><button type="button" data-reader-close aria-label="Close paper reading room">×</button></header><div class="paper-reader-tools"><nav role="tablist" aria-label="Paper reading views">${[
      ["math", "Math prerequisites"],
      ["figures", "Figures"],
      ["tables", "Tables"],
      ["pdf", "Complete PDF"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" role="tab" data-reader-tab="${id}" aria-selected="${tab === id}">${label}</button>`,
      )
      .join(
        "",
      )}</nav><a href="https://arxiv.org/abs/${paper.id}" target="_blank" rel="noopener noreferrer">Original paper ↗</a></div><div class="paper-reader-status" role="status" data-reader-status></div><section class="paper-reader-body" data-reader-body></section>`;
  }
  function status() {
    const el = dialog.querySelector("[data-reader-status]");
    if (!el) return;
    el.textContent = !content
      ? "Loading the full-text HTML conversion…"
      : content.status === "pdf-only"
        ? content.coverage.note
        : `HTML conversion: ${content.assets.length} image assets and ${content.tables.length} tables${content.unsupported.length ? "; some visual formats need the original source or Complete PDF" : ""}. Includes available appendix content. The PDF remains the complete visual reference.`;
  }
  function render() {
    const body = dialog.querySelector("[data-reader-body]");
    if (!body) return;
    dialog
      .querySelectorAll("[data-reader-tab]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.readerTab === tab)),
      );
    status();
    if (tab === "math") {
      body.innerHTML = `<h3>Build the mathematical picture first</h3>${prerequisitesMarkup(content?.prerequisites || inferPrerequisites(paper), content && content.status !== "pdf-only" ? "full-text" : "abstract")}<button type="button" class="paper-ask-math" data-reader-discuss>Ask AI about these prerequisites</button>`;
    } else if (tab === "figures") {
      body.innerHTML = !content
        ? "<p>Loading source figures…</p>"
        : content.assets.length
          ? `<p>All ${content.assets.length} image/object assets found in this HTML conversion. Select an image to enlarge it; source captions are retained.</p><div class="paper-figure-grid">${content.assets.map((asset, i) => `<figure><button type="button" class="paper-figure-open" data-reader-image="${i}" aria-label="Enlarge image ${i + 1}">${asset.format === "unsupported" ? "<span>Open the source for this visual format</span>" : `<img src="${esc(asset.url)}" loading="lazy" referrerpolicy="no-referrer" alt="${esc(asset.alt || asset.caption)}">`}</button><figcaption>${researchMath(asset.caption)}</figcaption><a href="${esc(sourceAnchor(content, asset.sourceAnchor))}" target="_blank" rel="noopener noreferrer">Figure in source ↗</a><p class="paper-image-error" hidden>Image unavailable here. Use the source link or Complete PDF.</p></figure>`).join("")}</div>`
          : `<p>${content.status === "pdf-only" ? "Figures could not be separately extracted from HTML." : "No image assets were found in this HTML conversion."} Use Complete PDF to inspect all original pages.</p>`;
    } else if (tab === "tables") {
      body.innerHTML = !content
        ? "<p>Loading source tables…</p>"
        : content.tables.length
          ? `<p>All ${content.tables.length} semantic tables found in this HTML conversion, including available appendix tables. Scroll wide tables horizontally.</p>${content.tables.map((t) => tableMarkup(t, content)).join("")}`
          : `<p>${content.status === "pdf-only" ? "Tables could not be separately extracted from HTML." : "No semantic tables were found in this HTML conversion."} The original PDF remains available.</p>`;
    } else {
      body.innerHTML = `<h3>Every original PDF page</h3><p>Figures and tables appear in their original page layout, including appendices. This view renders complete pages; it does not claim to segment individual figures or table cells.</p><div class="paper-pdf-status" role="status" data-pdf-status>${pdfDoc ? `PDF loaded · ${pdfDoc.numPages} pages` : "Load the PDF to browse its pages. Up to six pages are rendered at a time to limit memory use."}</div><button type="button" data-reader-pdf-load ${pdfLoading ? "disabled" : ""}>${pdfDoc ? "Render pages" : "Load complete PDF"}</button><a href="https://arxiv.org/pdf/${paper.id}" target="_blank" rel="noopener noreferrer">Open original PDF ↗</a><div data-pdf-pages></div>`;
      if (pdfDoc) renderPdfPages();
    }
  }
  async function open(id, initialTab = "math") {
    const found = papers().find((p) => p.id === id);
    if (!found) return;
    request?.abort();
    destroyPdf();
    paper = found;
    tab = initialTab;
    content = cache.get(id);
    pdfStart = 1;
    lastFocus = document.activeElement;
    shell();
    if (!dialog.open) dialog.showModal();
    render();
    if (content) return;
    request = new AbortController();
    const current = id;
    try {
      const r = await fetch(
        "/api/paper-content?paperId=" + encodeURIComponent(id),
        {
          signal: AbortSignal.any([
            request.signal,
            life.signal,
            AbortSignal.timeout(55000),
          ]),
        },
      );
      if (!r.ok) throw new Error("Source unavailable");
      const result = await r.json();
      if (
        result.paperId !== id ||
        !Array.isArray(result.assets) ||
        !Array.isArray(result.tables)
      )
        throw new Error("Invalid paper content");
      if (paper.id !== current || !dialog.open) return;
      content = result;
      cache.set(id, result);
      render();
    } catch (error) {
      if (paper.id !== current || life.signal.aborted || request.signal.aborted)
        return;
      content = {
        paperId: id,
        status: "pdf-only",
        assets: [],
        tables: [],
        unsupported: [],
        prerequisites: inferPrerequisites(paper),
        coverage: {
          note: "The full-text gallery could not be loaded. Abstract-based prerequisites and the Complete PDF view remain available.",
        },
      };
      render();
    }
  }
  async function loadPdf() {
    if (pdfLoading) return;
    if (pdfDoc) {
      renderPdfPages();
      return;
    }
    pdfLoading = true;
    const current = paper.id,
      seq = generation;
    const el = dialog.querySelector("[data-pdf-status]");
    if (el) el.textContent = "Loading and checking the original PDF…";
    dialog
      .querySelector("[data-reader-pdf-load]")
      ?.setAttribute("disabled", "");
    try {
      const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      if (!dialog.open || current !== paper.id || seq !== generation) return;
      pdfTask = pdfjs.getDocument({
        ...PDF_RUNTIME_OPTIONS,
        url:
          "/api/paper-pdf?paperId=" +
          encodeURIComponent(paper.id) +
          "&revision=" +
          encodeURIComponent(
            content?.sourceUpdatedAt || paper.updatedAt || paper.publishedAt,
          ),
        disableRange: true,
        disableAutoFetch: true,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      pdfTask.onProgress = (progress) => {
        const status = dialog.querySelector("[data-pdf-status]");
        if (status && progress.loaded)
          status.textContent = `Loading PDF · ${(progress.loaded / 1048576).toFixed(1)} MB`;
      };
      pdfDoc = await pdfTask.promise;
      if (!dialog.open || seq !== generation) return;
      renderPdfPages();
    } catch {
      const failedTask = pdfTask;
      pdfTask = null;
      failedTask?.destroy().catch(() => {});
      const status = dialog.querySelector("[data-pdf-status]");
      if (status)
        status.textContent =
          "The PDF could not be loaded here. Open the original PDF to view every figure and table.";
    } finally {
      pdfLoading = false;
      dialog
        .querySelector("[data-reader-pdf-load]")
        ?.removeAttribute("disabled");
    }
  }
  async function renderPdfPages() {
    const host = dialog.querySelector("[data-pdf-pages]");
    if (!host || !pdfDoc) return;
    for (const task of renderTasks) task.cancel();
    renderTasks = [];
    const doc = pdfDoc,
      seq = generation,
      epoch = ++pdfRenderEpoch;
    const end = Math.min(doc.numPages, pdfStart + 5),
      pages = Array.from(
        { length: end - pdfStart + 1 },
        (_, i) => pdfStart + i,
      );
    dialog.querySelector("[data-pdf-status]").textContent =
      `Pages ${pdfStart}–${end} of ${doc.numPages}. All pages are accessible using the page controls.`;
    host.innerHTML = `<div class="paper-pdf-nav"><button type="button" data-pdf-shift="-6" ${pdfStart === 1 ? "disabled" : ""}>Previous pages</button><label>Go to page <input type="number" min="1" max="${doc.numPages}" value="${pdfStart}" data-pdf-goto aria-label="PDF page number"></label><button type="button" data-pdf-go>Go</button><button type="button" data-pdf-shift="6" ${end === doc.numPages ? "disabled" : ""}>Next pages</button></div><div class="paper-pdf-grid">${pages.map((n) => `<figure><button type="button" data-pdf-enlarge="${n}" aria-label="Enlarge PDF page ${n}"><canvas data-pdf-page="${n}"></canvas></button><figcaption>Page ${n}</figcaption></figure>`).join("")}</div>`;
    // Sequential renders keep canvas and worker memory bounded even for long appendices.
    for (const n of pages) {
      if (
        seq !== generation ||
        epoch !== pdfRenderEpoch ||
        doc !== pdfDoc ||
        tab !== "pdf"
      )
        return;
      try {
        const page = await doc.getPage(n);
        if (epoch !== pdfRenderEpoch || tab !== "pdf") return;
        const canvas = host.querySelector(`[data-pdf-page="${n}"]`);
        if (!canvas) return;
        const natural = page.getViewport({ scale: 1 }),
          viewport = page.getViewport({ scale: 400 / natural.width });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const task = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        });
        renderTasks.push(task);
        await task.promise;
        page.cleanup();
      } catch {}
    }
  }
  const zoom = document.createElement("dialog");
  zoom.className = "paper-zoom";
  zoom.setAttribute("aria-label", "Enlarged paper visual");
  document.body.append(zoom);
  async function enlarge(index, isPage = false) {
    zoom.innerHTML = `<button type="button" data-zoom-close aria-label="Close enlarged visual">×</button><div data-zoom-content></div>`;
    zoom.showModal();
    const host = zoom.querySelector("[data-zoom-content]");
    if (!isPage) {
      const asset = content.assets[index];
      host.innerHTML = `<figure>${asset.format === "unsupported" ? "<p>Use the source link to open this visual format.</p>" : `<img src="${esc(asset.url)}" referrerpolicy="no-referrer" alt="${esc(asset.alt || asset.caption)}">`}<figcaption>${researchMath(asset.caption)}</figcaption><a href="${esc(asset.url)}" target="_blank" rel="noopener noreferrer">Open original asset ↗</a></figure>`;
    } else {
      const doc = pdfDoc;
      if (!doc) return;
      host.innerHTML = `<p>Original PDF · page ${index}</p><canvas></canvas>`;
      try {
        const page = await doc.getPage(index);
        if (!zoom.open) return;
        const natural = page.getViewport({ scale: 1 }),
          viewport = page.getViewport({
            scale: Math.min(2, 1600 / natural.width),
          }),
          canvas = host.querySelector("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const task = page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        });
        renderTasks.push(task);
        await task.promise;
      } catch {}
    }
  }
  root.addEventListener(
    "click",
    (e) => {
      const button = e.target.closest("[data-paper-reader]");
      if (button)
        open(
          button.dataset.paperReader,
          button.dataset.readerInitial || "figures",
        );
    },
    options,
  );
  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[data-reader-close]")) dialog.close();
      const t = e.target.closest("[data-reader-tab]");
      if (t) {
        pdfRenderEpoch++;
        tab = t.dataset.readerTab;
        for (const task of renderTasks) task.cancel();
        renderTasks = [];
        render();
      }
      const image = e.target.closest("[data-reader-image]");
      if (image) enlarge(Number(image.dataset.readerImage));
      if (e.target.closest("[data-reader-pdf-load]")) loadPdf();
      const shift = e.target.closest("[data-pdf-shift]");
      if (shift && pdfDoc) {
        pdfStart = Math.max(
          1,
          Math.min(pdfDoc.numPages, pdfStart + Number(shift.dataset.pdfShift)),
        );
        renderPdfPages();
      }
      if (e.target.closest("[data-pdf-go]") && pdfDoc) {
        const value = Number(dialog.querySelector("[data-pdf-goto]").value);
        if (Number.isInteger(value) && value >= 1 && value <= pdfDoc.numPages) {
          pdfStart = value;
          renderPdfPages();
        }
      }
      const page = e.target.closest("[data-pdf-enlarge]");
      if (page) enlarge(Number(page.dataset.pdfEnlarge), true);
      if (e.target.closest("[data-reader-discuss]")) {
        const id = paper.id;
        dialog.close();
        onDiscuss(id);
      }
    },
    options,
  );
  dialog.addEventListener(
    "error",
    (e) => {
      if (e.target instanceof HTMLImageElement) {
        e.target.hidden = true;
        const notice = e.target
          .closest("figure")
          ?.querySelector(".paper-image-error");
        if (notice) notice.hidden = false;
      }
    },
    { capture: true, signal: life.signal },
  );
  dialog.addEventListener(
    "close",
    () => {
      request?.abort();
      destroyPdf();
      if (zoom.open) zoom.close();
      lastFocus?.isConnected && lastFocus.focus({ preventScroll: true });
    },
    options,
  );
  zoom.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[data-zoom-close]")) zoom.close();
    },
    options,
  );
  return {
    open,
    destroy() {
      life.abort();
      request?.abort();
      destroyPdf();
      if (zoom.open) zoom.close();
      if (dialog.open) dialog.close();
      zoom.remove();
      dialog.remove();
    },
  };
}
