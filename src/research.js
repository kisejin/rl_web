import { inferPrerequisites } from "./paper-prerequisites.js";
import { mountPaperReader, prerequisitesMarkup } from "./paper-reader.js";
import { researchMath } from "./research-math.js";
import { researchTopics, RESEARCH_SCHEDULE } from "./research-topics.js";
import { escapeText as esc } from "./math-text.js";
import "./research.css";
const date = (value) => {
  const time = Date.parse(value);
  return Number.isFinite(time)
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(time)
    : "Not yet checked";
};
const time = (value) => {
  const t = Date.parse(value);
  return Number.isFinite(t)
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(t) + " ICT"
    : "Not yet checked";
};
const validId = (id) => /^(?:\d{4}\.\d{4,5}|[a-z.-]+\/\d{7})$/.test(id);
export function researchView() {
  return `<article class="research-page"><header class="research-hero"><div class="doc-page-tag">RESEARCH, CONNECTED TO YOUR LEARNING</div><h1>The daily RL research desk</h1><p class="research-lead">Follow reinforcement learning, verifiable rewards, on-policy self-distillation and rubric-driven methods. Start with a short digest, then inspect the original paper.</p><div class="research-schedule"><span class="research-live-dot"></span>Scheduled daily · 09:00 Vietnam time</div><p class="research-updated" data-research-updated>Loading the latest saved collection…</p><div class="research-stats" data-research-stats></div></header><div class="research-notice" data-research-notice role="status" hidden></div><section aria-labelledby="research-papers-heading"><h2 id="research-papers-heading">Explore the papers</h2><div class="research-topics" role="group" aria-label="Filter research topic"><button type="button" data-research-topic="all" aria-pressed="true">All research</button>${researchTopics.map((t) => `<button type="button" data-research-topic="${t.id}" aria-pressed="false" title="${esc(t.description)}">${esc(t.label)}</button>`).join("")}</div><div class="research-controls"><label>Search papers<input type="search" data-research-search placeholder="Method, title, author, keyword…" aria-label="Search research papers"></label><label>Published within<select data-research-window aria-label="Research publication window"><option value="all">All collected papers</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label><label>Source<select data-research-source aria-label="Research source"><option value="all">All sources</option><option value="arxiv">arXiv discovery</option><option value="huggingface">Hugging Face Papers</option></select></label><label class="research-saved-only"><input type="checkbox" data-research-saved-only> Saved papers</label></div><div class="research-results-heading"><p data-research-count role="status">Loading papers…</p><button type="button" data-research-reload>Reload collection</button></div><div data-research-results aria-busy="true"><div class="research-loading">Collecting the latest saved papers…</div></div></section><section class="research-how"><h2>How this desk works</h2><div class="research-method-grid"><div><h3>Daily discovery</h3><p>${esc(RESEARCH_SCHEDULE)} Two arXiv queries cover general RL and targeted reward/distillation terms; Hugging Face Daily Papers and targeted keyword searches add community discovery. Recent source results are filtered by topic and merged by arXiv ID.</p></div><div><h3>Summaries with provenance</h3><p>“AI abstract summary” means an automated digest of the abstract, not a full-paper review. Other entries show an explicitly labeled abstract excerpt. Both use the same server-side AI provider as the study chatbot; you can discuss a collected paper directly with any supported chatbot model. Author claims are not independently verified; linked papers are preprints.</p></div><div><h3>A durable, bounded archive</h3><p>The collection retains up to 180 papers across refreshes. Recent feeds use a 60-day window; targeted keyword searches also include related background papers from the last year. “Published” is the source publication date; “First collected” is when this desk found it. This is a curated discovery feed, not exhaustive coverage of all RL research.</p></div><div><h3>Your reading list</h3><p>Save papers on this browser and filter them for later. Saved entries remain available here while they are in the collected archive. Reloading reads the stored collection; the server’s daily job handles crawling and summarization.</p></div></div><details><summary>Source health and last refresh</summary><div data-research-health>Loading source status…</div></details><a href="/atlas/">Connect a paper to the RL & Deep RL learning atlas →</a></section></article>`;
}
function savedIds() {
  try {
    const data = JSON.parse(
      localStorage.getItem("rl-atlas-saved-papers") || "[]",
    );
    return new Set(
      Array.isArray(data)
        ? data.filter((x) => typeof x === "string").slice(0, 500)
        : [],
    );
  } catch {
    return new Set();
  }
}
function topicLabel(id) {
  return researchTopics.find((t) => t.id === id)?.label || id;
}
function card(p, saved) {
  const href = "https://arxiv.org/abs/" + p.id,
    pdf = "https://arxiv.org/pdf/" + p.id,
    summary = p.summary || {};
  return `<article class="research-card" data-research-paper="${esc(p.id)}"><div class="research-card-meta"><span class="research-preprint">Preprint</span><time datetime="${esc(p.publishedAt)}">Published ${esc(date(p.publishedAt))}</time><button type="button" data-research-save="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved ? "Unsave" : "Save"} paper: ${esc(p.title)}">${saved ? "✓ Saved" : "＋ Save"}</button></div><h3><a href="${href}" target="_blank" rel="noopener noreferrer">${researchMath(p.title)}</a></h3><p class="research-authors">${esc((p.authors || []).slice(0, 5).join(", "))}${p.authors?.length > 5 ? " et al." : ""}</p><div class="research-tags">${p.topics.map((t) => `<span>${esc(topicLabel(t))}</span>`).join("")}</div><div class="research-digest"><span class="research-digest-label">${summary.kind === "ai" ? "AI abstract summary" : "Abstract excerpt"}</span><p>${researchMath(summary.overview || p.abstract.slice(0, 650))}</p>${summary.kind === "ai" ? `<dl><div><dt>Method</dt><dd>${researchMath(summary.method)}</dd></div><div><dt>Evidence & limits</dt><dd>${researchMath(summary.limitations)}</dd></div></dl>` : ""}</div><details class="research-abstract"><summary>Read the original abstract</summary><p>${researchMath(p.abstract)}</p></details><details class="research-prerequisites" data-paper-prerequisites="${esc(p.id)}"><summary>Math to know · ${inferPrerequisites(p).length} recommended topics</summary><div data-prerequisites-body></div><button type="button" data-paper-reader="${esc(p.id)}" data-reader-initial="math">Check the full-text reading guide →</button></details><footer><button type="button" class="research-gallery-button" data-paper-reader="${esc(p.id)}">Figures & tables</button><button type="button" class="research-discuss" data-research-discuss="${esc(p.id)}">Discuss this paper with AI</button><a href="${href}" target="_blank" rel="noopener noreferrer">Read on arXiv ↗</a><a href="${pdf}" target="_blank" rel="noopener noreferrer">PDF ↗</a>${p.sources.includes("huggingface") ? `<a href="https://huggingface.co/papers/${p.id}" target="_blank" rel="noopener noreferrer">HF discussion ↗</a>` : ""}<span>First collected ${esc(date(p.firstSeenAt || p.publishedAt))}</span></footer></article>`;
}
export function mountResearch(root = document) {
  const host = root.querySelector(".research-page");
  if (!host) return () => {};
  const events = new AbortController(),
    opts = { signal: events.signal };
  let request,
    feed,
    topic = "all",
    saved = savedIds(),
    visibleCount = 12;
  const reader = mountPaperReader(host, {
    papers: () => feed?.papers || [],
    onDiscuss: (paperId) =>
      document.dispatchEvent(
        new CustomEvent("rlatlas:discuss-paper", {
          detail: { paperId, sectionKey: "prerequisites" },
        }),
      ),
  });
  host.addEventListener(
    "toggle",
    (e) => {
      const details = e.target;
      if (
        !(details instanceof HTMLDetailsElement) ||
        !details.matches("[data-paper-prerequisites]") ||
        !details.open
      )
        return;
      const body = details.querySelector("[data-prerequisites-body]"),
        paper = feed?.papers.find(
          (p) => p.id === details.dataset.paperPrerequisites,
        );
      if (paper && !body.dataset.ready) {
        body.innerHTML = prerequisitesMarkup(inferPrerequisites(paper));
        body.dataset.ready = "true";
      }
    },
    { capture: true, signal: events.signal },
  );
  const $ = (s) => host.querySelector(s),
    notice = $("[data-research-notice]"),
    results = $("[data-research-results]"),
    reload = $("[data-research-reload]");
  function showNotice(text) {
    notice.hidden = !text;
    notice.textContent = text;
  }
  function render(reset = true) {
    if (!feed) return;
    if (reset !== false) visibleCount = 12;
    const query = $("[data-research-search]")
        .value.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
      window = $("[data-research-window]").value,
      source = $("[data-research-source]").value,
      onlySaved = $("[data-research-saved-only]").checked;
    const lower =
      window === "all" ? -Infinity : Date.now() - Number(window) * 86400000;
    const selected = feed.papers.filter(
      (p) =>
        (topic === "all" || p.topics.includes(topic)) &&
        Date.parse(p.publishedAt) >= lower &&
        (source === "all" || p.sources.includes(source)) &&
        (!onlySaved || saved.has(p.id)) &&
        query.every((word) =>
          (p.title + " " + p.abstract + " " + p.authors.join(" "))
            .toLowerCase()
            .includes(word),
        ),
    );
    $("[data-research-count]").textContent =
      `${Math.min(visibleCount, selected.length)} shown · ${selected.length} of ${feed.papers.length} collected papers${onlySaved ? " · saved on this browser" : ""}`;
    results.innerHTML = selected.length
      ? selected
          .slice(0, visibleCount)
          .map((p) => card(p, saved.has(p.id)))
          .join("") +
        (selected.length > visibleCount
          ? '<button type="button" class="research-more" data-research-more>Load 12 more papers</button>'
          : "")
      : '<div class="research-empty"><strong>No papers match these filters.</strong><p>Try another topic, a wider date range or fewer search terms. An empty topic does not imply that no research exists.</p></div>';
  }
  async function load() {
    request?.abort();
    request = new AbortController();
    const signal = AbortSignal.any([
      request.signal,
      events.signal,
      AbortSignal.timeout(20000),
    ]);
    reload.disabled = true;
    results.setAttribute("aria-busy", "true");
    try {
      let response = await fetch("/api/research", { signal });
      let fallback = false;
      if (!response.ok) {
        fallback = true;
        response = await fetch("/research-feed.json", { signal });
      }
      if (!response.ok) throw new Error("Unavailable");
      const value = await response.json();
      if (value?.version !== 1 || !Array.isArray(value.papers))
        throw new Error("Invalid collection");
      feed = {
        ...value,
        papers: value.papers.filter(
          (p) =>
            typeof p.id === "string" &&
            validId(p.id) &&
            typeof p.title === "string" &&
            typeof p.abstract === "string" &&
            Array.isArray(p.authors) &&
            Array.isArray(p.topics) &&
            Array.isArray(p.sources),
        ),
      };
      const age = Date.now() - Date.parse(feed.updatedAt || 0),
        stale = !feed.updatedAt || age > 36 * 3600000;
      showNotice(
        fallback || feed.storage === "bundled"
          ? "Showing the bundled collection. Live storage is temporarily unavailable or awaiting its first daily refresh. Dates below show when these papers were collected."
          : stale
            ? "The last successful collection is more than 36 hours old. Previously collected papers remain available."
            : feed.status === "partial"
              ? "Some sources were unavailable at the last refresh. Results from available sources and the saved archive are shown."
              : feed.status === "unavailable"
                ? "The last refresh could not reach discovery sources. The saved collection is retained."
                : "",
      );
      $("[data-research-updated]").textContent =
        "Last successful collection: " + time(feed.updatedAt);
      $("[data-research-stats]").innerHTML =
        `<span><strong>${feed.papers.length}</strong> collected papers</span><span><strong>${feed.papers.filter((p) => p.summary?.kind === "ai").length}</strong> AI abstract summaries</span><span><strong>4</strong> research tracks</span>`;
      $("[data-research-health]").innerHTML =
        `<p>Last attempt: ${esc(time(feed.lastAttemptAt))}. Summary mode: ${esc(feed.summaryStatus || "extractive-only")}.</p><ul>${(feed.sourceStatuses || []).map((s) => `<li>${esc(s.id)}: ${s.ok ? `available · ${Number(s.count) || 0} relevant results` : "unavailable; saved papers retained"}</li>`).join("")}</ul>`;
      render();
      document.dispatchEvent(
        new CustomEvent("rlatlas:research-feed", {
          detail: { papers: feed.papers },
        }),
      );
    } catch (error) {
      if (events.signal.aborted || request.signal.aborted) return;
      showNotice(
        "Could not reload the collection. Try again shortly; any papers already on this page are retained.",
      );
      if (!feed) {
        $("[data-research-count]").textContent = "Collection unavailable";
        results.innerHTML =
          '<div class="research-empty">The saved collection could not be loaded. Use Reload collection to retry.</div>';
      }
    } finally {
      if (!events.signal.aborted) {
        reload.disabled = false;
        results.setAttribute("aria-busy", "false");
      }
    }
  }
  host.addEventListener(
    "click",
    (e) => {
      const discuss = e.target.closest("[data-research-discuss]");
      if (discuss) {
        document.dispatchEvent(
          new CustomEvent("rlatlas:discuss-paper", {
            detail: { paperId: discuss.dataset.researchDiscuss },
          }),
        );
        return;
      }
      if (e.target.closest("[data-research-more]")) {
        visibleCount += 12;
        render(false);
        return;
      }
      const filter = e.target.closest("[data-research-topic]");
      if (filter) {
        topic = filter.dataset.researchTopic;
        host
          .querySelectorAll("[data-research-topic]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === filter)));
        render();
      }
      const button = e.target.closest("[data-research-save]");
      if (button) {
        const id = button.dataset.researchSave;
        saved.has(id) ? saved.delete(id) : saved.add(id);
        try {
          localStorage.setItem(
            "rl-atlas-saved-papers",
            JSON.stringify([...saved].slice(-500)),
          );
        } catch {
          showNotice(
            "Browser storage is unavailable. Saved selections last only while this page is open.",
          );
        }
        const pressed = saved.has(id);
        button.setAttribute("aria-pressed", String(pressed));
        button.textContent = pressed ? "✓ Saved" : "＋ Save";
        button.setAttribute(
          "aria-label",
          (pressed ? "Unsave" : "Save") +
            " paper: " +
            feed.papers.find((p) => p.id === id)?.title,
        );
        if ($("[data-research-saved-only]").checked) render();
      }
    },
    opts,
  );
  $("[data-research-search]").addEventListener("input", render, opts);
  for (const s of [
    "[data-research-window]",
    "[data-research-source]",
    "[data-research-saved-only]",
  ])
    $(s).addEventListener("change", render, opts);
  reload.addEventListener("click", load, opts);
  load();
  return () => {
    events.abort();
    request?.abort();
    reader.destroy();
  };
}
