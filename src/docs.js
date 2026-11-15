import { atlasTopics } from "./atlas-content.js";
import { uiIcon } from "./ui-icons.js";
const $ = (s) => document.querySelector(s);
const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let theme = "light",
  hasThemePreference = false;
try {
  const storedTheme = localStorage.getItem("rl-atlas-doc-theme");
  hasThemePreference = ["light", "dark", "auto"].includes(storedTheme);
  theme = hasThemePreference ? storedTheme : "light";
} catch {}
if (!["light", "dark", "auto"].includes(theme)) theme = "light";
const media = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  if (!hasThemePreference)
    theme = document.body.dataset.docsPage === "lab" ? "dark" : "light";
  const resolved =
    theme === "auto" ? (media.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.docTheme = resolved;
  document.documentElement.style.colorScheme = resolved;
  const button = $("button[data-doc-theme]");
  if (button) {
    button.setAttribute("aria-label", `Color theme: ${theme}. Switch theme`);
    button.title = `Color theme: ${theme}`;
    button.innerHTML = `${uiIcon(theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor")}<span class="doc-theme-word">${theme[0].toUpperCase() + theme.slice(1)}</span>`;
  }
}
applyTheme();
media.addEventListener("change", applyTheme);
const searchIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const tocIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></svg>';
export function prepareDocsShell({
  page,
  selectedLesson,
  selectedAtlas,
  selectedLab,
  lessons,
  labs,
}) {
  const sidebar = $(".sidebar");
  sidebar.querySelector(".brand small").textContent = "DOCUMENTATION";
  sidebar.querySelector(".course-label").textContent =
    "Reinforcement learning, from first principles.";
  sidebar.querySelector(".side-heading").innerHTML =
    "LEARNING GUIDES <span>09</span>";
  const search = document.createElement("button");
  search.className = "doc-search-launch";
  search.dataset.docSearch = "";
  search.innerHTML = `${searchIcon}<span>Search documentation</span><kbd>Ctrl K</kbd>`;
  search.setAttribute("aria-label", "Search documentation");
  sidebar.querySelector(".side-home").before(search);
  const quick = document.createElement("nav");
  quick.className = "doc-quick-nav";
  quick.setAttribute("aria-label", "Documentation");
  quick.innerHTML = `<a href="#atlas" class="${["atlas", "atlas-topic"].includes(page) ? "active" : ""}">RL & Deep RL atlas <span>${atlasTopics.length}</span></a><a href="#curriculum" class="${page === "curriculum" ? "active" : ""}">Learning path</a><a href="#labs" class="${["labs", "lab"].includes(page) ? "active" : ""}">Code labs <span>${labs.length}</span></a><a href="#research" class="${page === "research" ? "active" : ""}">Research feed <span>Daily</span></a><a href="#notebook" class="${page === "notebook" ? "active" : ""}">My notebook</a>`;
  sidebar.querySelector(".side-home").after(quick);
  const group = document.createElement("div");
  group.className = "nav-section";
  group.textContent = "FOUNDATIONS";
  sidebar.querySelector(".lesson-nav").prepend(group);
  sidebar.querySelectorAll(".nav-section").forEach((el) => {
    el.textContent = el.textContent
      .replace("ALGORITHMS & OPTIMIZATION", "ALGORITHMS")
      .replace("REWARD DESIGN", "REWARD DESIGN");
  });
  if (page === "atlas" || page === "atlas-topic") {
    const nav = sidebar.querySelector(".lesson-nav");
    const label = document.createElement("div");
    label.className = "atlas-sidebar-label";
    label.textContent = "Visual RL & Deep RL atlas";
    nav.append(label);
    for (const topic of atlasTopics) {
      const a = document.createElement("a");
      a.className =
        "lesson-link" +
        (selectedAtlas === topic.id && page === "atlas-topic" ? " active" : "");
      a.href = "#atlas/" + topic.id;
      a.textContent = topic.title;
      nav.append(a);
    }
  }
  const title =
    page === "atlas-topic"
      ? atlasTopics.find((t) => t.id === selectedAtlas)?.title
      : page === "lesson"
        ? lessons.find((l) => l.id === selectedLesson).title
        : page === "lab"
          ? labs.find((l) => l.id === selectedLab).title
          : {
              home: "Introduction",
              curriculum: "Learning path",
              atlas: "RL & Deep RL atlas",
              labs: "Code labs",
              notebook: "My notebook",
              research: "Daily research feed",
            }[page];
  $(".breadcrumb").innerHTML =
    `<span class="doc-crumb-home">Docs</span><span>/</span><span>${page === "lab" ? "Code labs" : "Reinforcement Learning"}</span><span>/</span><strong>${esc(title)}</strong>`;
  $(".top-right").innerHTML =
    `<button class="doc-header-search" data-doc-search aria-label="Open documentation search">${searchIcon}</button><button class="doc-theme-button" data-doc-theme></button><button class="doc-toc-toggle" data-doc-toc aria-label="Toggle table of contents" aria-expanded="false">${tocIcon}</button>`;
  const content = $("#main-content"),
    layout = document.createElement("div");
  layout.className = "docs-layout";
  layout.dataset.page = page;
  content.before(layout);
  layout.append(content);
  const toc = document.createElement("aside");
  toc.className = "doc-toc";
  toc.setAttribute("aria-label", "On this page");
  toc.innerHTML =
    '<div class="doc-toc-heading">On this page<button class="doc-toc-close" aria-label="Close table of contents">×</button></div><nav></nav><a class="doc-back-top" href="#" data-doc-top>Back to top ↑</a>';
  layout.append(toc);
  const backdrop = document.createElement("button");
  backdrop.className = "doc-toc-backdrop";
  backdrop.setAttribute("aria-label", "Close table of contents");
  document.querySelector(".app-shell").append(backdrop);
  if (page === "home") {
    $(".hero-copy").innerHTML =
      `<div class="doc-page-tag">RL ATLAS DOCUMENTATION</div><h1>Reinforcement Learning</h1><p class="doc-intro">Understand the ideas. Prove the mathematics. Build the algorithms.</p><p>Learn reinforcement learning from first principles, one concept at a time. Work through interactive explanations, original Manim animations, mathematical proofs, and code you implement yourself.</p><div class="doc-admonition"><strong>Start here</strong><p>New to reinforcement learning? Begin with <a href="#lesson/foundations">Thinking in Reinforcement Learning</a>, then follow the nine-chapter learning path. Continue with the <a href="#atlas">visual RL & Deep RL atlas</a> for ${atlasTopics.length} topics, derivations and interactive animations. No RL library is required for the labs.</p></div><div class="hero-actions"><a class="btn primary" href="#lesson/foundations">Read the first chapter ${uiIcon("arrow-right")}</a><a class="text-btn" href="#curriculum">Browse the learning path ${uiIcon("arrow-right")}</a></div><h2 class="doc-environment-heading">Your first environment</h2><p>Try the Gridworld below. Change the discount factor, inspect state values, and watch the agent follow its policy.</p>`;
    $(".learning-strip .strip-intro").innerHTML =
      "<h2>How to use this course</h2><p>Combine intuition, mathematics, and implementation.</p>";
    const heading = $(".journey-section .section-heading");
    heading.querySelector(".eyebrow")?.remove();
    heading.querySelector("h2").innerHTML = "Explore the foundations";
  }
  if (page === "curriculum") {
    const more = document.createElement("div");
    more.className = "doc-admonition";
    more.innerHTML = `<strong>Continue beyond the core course</strong><p><a href="#atlas">Open the RL & Deep RL atlas</a> for DQN, PPO, SAC, offline RL, reward learning and ${atlasTopics.length} interactive mathematical explanations.</p>`;
    content.prepend(more);
  }
  // Use anchors within the current SPA route, so TOC clicks never navigate home.
  const headings = [...content.querySelectorAll("h2,h3")].filter(
    (h) =>
      !h.closest(".sim-title,.lab-banner,.aside-card,[data-atlas-proof-step]"),
  );
  if (!headings.length && content.querySelector("h1"))
    headings.push(content.querySelector("h1"));
  const route = location.hash.split("::")[0] || "#home";
  headings.forEach((heading, i) => {
    heading.id = `section-${i}-${heading.textContent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "")
      .slice(0, 65)}`;
    const a = document.createElement("a");
    a.href = route + "::" + heading.id;
    a.dataset.docTarget = heading.id;
    a.textContent = heading.closest(".lesson-exercise")
      ? "Write your proof"
      : heading.textContent.replace(/^\d+\.\s*/, "");
    a.className =
      heading.tagName === "H3" && page !== "lab" ? "doc-toc-sub" : "";
    toc.querySelector("nav").append(a);
  });
  document.body.dataset.docsPage = page;
  const dialog = document.createElement("dialog");
  dialog.id = "doc-search-dialog";
  dialog.setAttribute("aria-labelledby", "doc-search-title");
  dialog.innerHTML = `<div class="doc-search-top"><h2 id="doc-search-title">Search documentation</h2><button data-doc-search-close aria-label="Close search">Esc</button></div><label class="doc-search-input">${searchIcon}<input type="search" placeholder="Search concepts, lessons, or code labs…" aria-label="Search concepts, lessons, or code labs" autocomplete="off"></label><div class="doc-search-results" aria-live="polite"></div><div class="doc-search-help">Search across ${lessons.length} learning guides, ${atlasTopics.length} atlas topics and ${labs.length} code labs.</div>`;
  document.querySelector(".app-shell").append(dialog);
  applyTheme();
  return { headings, route, dialog, toc, backdrop };
}
export function mountDocs(context, { lessons, labs }) {
  const { headings, route, dialog, toc, backdrop } = context,
    abort = new AbortController(),
    options = { signal: abort.signal };
  let scheduled = 0;
  const closeToc = () => {
    toc.classList.remove("open");
    backdrop.classList.remove("open");
    $("[data-doc-toc]").setAttribute("aria-expanded", "false");
  };
  $("[data-doc-toc]").addEventListener(
    "click",
    () => {
      const open = !toc.classList.contains("open");
      toc.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      $("[data-doc-toc]").setAttribute("aria-expanded", String(open));
    },
    options,
  );
  toc
    .querySelector(".doc-toc-close")
    .addEventListener("click", closeToc, options);
  backdrop.addEventListener("click", closeToc, options);
  const activate = () => {
    scheduled = 0;
    let current = headings[0]?.id;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= 130) current = h.id;
    }
    toc.querySelectorAll("[data-doc-target]").forEach((a) => {
      const active = a.dataset.docTarget === current;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) scheduled = requestAnimationFrame(activate);
    },
    { ...options, passive: true },
  );
  activate();
  toc.querySelectorAll("[data-doc-target]").forEach((a) =>
    a.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        const target = document.getElementById(a.dataset.docTarget);
        history.replaceState(null, "", route + "::" + target.id);
        target.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
        closeToc();
      },
      options,
    ),
  );
  toc.querySelector("[data-doc-top]").addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      history.replaceState(null, "", route);
      window.scrollTo({ top: 0, behavior: "instant" });
      closeToc();
    },
    options,
  );
  $("button[data-doc-theme]").addEventListener(
    "click",
    () => {
      hasThemePreference = true;
      theme = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";
      try {
        localStorage.setItem("rl-atlas-doc-theme", theme);
      } catch {}
      applyTheme();
    },
    options,
  );
  const index = [
    {
      title: "Daily RL research feed",
      kind: "Research",
      href: "#research",
      text: "Daily research papers RL reinforcement learning RLVR verifiable rewards on-policy self-distillation rubric as reward new methods summaries",
    },
    ...lessons.map((l) => ({
      title: l.title,
      kind: "Learning guide",
      href: "#lesson/" + l.id,
      text: l.title + " " + l.desc + " " + l.sections.flat().join(" "),
    })),
    ...atlasTopics.map((t) => ({
      title: t.title,
      kind: "Deep RL atlas · " + t.stage,
      href: "#atlas/" + t.id,
      text:
        t.title +
        " " +
        t.summary +
        " " +
        t.equations.map((e) => e.name + " " + e.explain).join(" "),
    })),
    ...labs.map((l) => ({
      title: l.title,
      kind: "Code lab · " + l.level,
      href: "/lab.html#" + l.id,
      text: l.title + " " + l.topic + " " + l.desc,
    })),
  ];
  const results = () => {
    const query = dialog.querySelector("input").value.trim().toLowerCase(),
      terms = query.split(/\s+/).filter(Boolean);
    const matches = index
      .filter((item) =>
        terms.every((term) => item.text.toLowerCase().includes(term)),
      )
      .map((item) => ({
        item,
        score:
          (item.title.toLowerCase() === query
            ? 1000
            : item.title.toLowerCase().includes(query)
              ? 500
              : 0) +
          terms.reduce(
            (score, term) =>
              score + (item.title.toLowerCase().includes(term) ? 10 : 0),
            0,
          ),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 10);
    dialog.querySelector(".doc-search-results").innerHTML = matches.length
      ? matches
          .map(
            (item) =>
              `<a href="${item.href}"><span>${esc(item.kind)}</span><strong>${esc(item.title)}</strong><span class="doc-search-arrow">${uiIcon("arrow-up-right")}</span></a>`,
          )
          .join("")
      : '<div class="doc-search-empty">No results found. Try “Bellman”, “reward”, or “policy”.</div>';
    dialog
      .querySelectorAll(".doc-search-results a")
      .forEach((a) =>
        a.addEventListener("click", () => dialog.close(), { once: true }),
      );
  };
  const openSearch = () => {
    closeToc();
    if (!dialog.open) dialog.showModal();
    results();
    dialog.querySelector("input").focus();
  };
  document
    .querySelectorAll("[data-doc-search]")
    .forEach((button) => button.addEventListener("click", openSearch, options));
  dialog
    .querySelector("[data-doc-search-close]")
    .addEventListener("click", () => dialog.close(), options);
  dialog.querySelector("input").addEventListener("input", results, options);
  dialog.querySelector("input").addEventListener(
    "keydown",
    (e) => {
      const first = dialog.querySelector(".doc-search-results a");
      if (first && ["ArrowDown", "Enter"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "Enter") first.click();
        else first.focus();
      }
    },
    options,
  );
  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          dialog.close();
      }
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") {
        if (dialog.open) {
          e.preventDefault();
          dialog.close();
        }
        closeToc();
      }
    },
    options,
  );
  return () => {
    abort.abort();
    cancelAnimationFrame(scheduled);
    if (dialog.open) dialog.close();
  };
}
