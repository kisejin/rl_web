import { mountTutor } from "./tutor.js";
import { labLessonId } from "./tutor-context.js";
let cleanTutor = () => {};
import { uiIcon } from "./ui-icons.js";
import "./ui-primitives.css";
import "./lab-base.css";
import "./lab-workspace.css";
import "katex/dist/katex.min.css";
import "./lab-polish.css";
import { labs, lessons, starter } from "./content.js";
import { renderLab } from "./lab-layout.js";
import { mountLabWorkspace } from "./lab-workspace.js";
import { runCode } from "./runner.js";
import { loadProgress } from "./progress.js";
import { escapeText as esc } from "./math-text.js";
import {
  createIcons,
  FileText,
  BookOpen,
  Clock3,
  ListChecks,
  Play,
  CheckCheck,
  Maximize,
  Search,
  Code2,
  RotateCcw,
  Terminal,
  Lightbulb,
  Sigma,
  ChevronDown,
  Check,
  X,
  LoaderCircle,
} from "lucide";
const icons = {
  FileText,
  BookOpen,
  Clock3,
  ListChecks,
  Play,
  CheckCheck,
  Maximize,
  Search,
  Code2,
  RotateCcw,
  Terminal,
  Lightbulb,
  Sigma,
  ChevronDown,
  Check,
  X,
  LoaderCircle,
};
const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const progress = loadProgress();
let page = "lab",
  selectedLab = "return",
  labWorkspace = null,
  running = false;
function persist() {
  try {
    localStorage.setItem("rl-atlas-v1", JSON.stringify(progress));
  } catch {
    toast("Saving is unavailable. Work will remain in this session only.");
  }
}
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 3500);
}
function proofReady(l) {
  return (
    !l.hybrid ||
    ((progress.proofs[l.id] || "").trim().length >= 80 &&
      l.checks.every((_, i) => progress.checks[l.id]?.[i]))
  );
}
let latestCodePass = {};
async function executeCode(mode = "run") {
  if (running || labWorkspace?.isBusy()) return;
  const l = labs.find((l) => l.id === selectedLab),
    code = $("#code-editor").value,
    activeWorkspace = labWorkspace;
  const runButton = $("#run-code"),
    submitButton = $("#submit-code"),
    started = performance.now();
  running = true;
  runButton.disabled = true;
  submitButton.disabled = true;
  const active = mode === "submit" ? submitButton : runButton;
  active.innerHTML =
    icon("loader-circle") +
    `<span>${mode === "submit" ? "Submitting…" : "Running…"}</span>`;
  labWorkspace?.showResults();
  $("#test-results").innerHTML =
    '<div class="test-empty">Loading Python and running your code…<small>CPython in a worker · 3-second execution limit after runtime loads</small></div>';
  let result;
  try {
    result = await runCode(code, l);
  } catch (error) {
    result = { error: error.message };
  }
  if (
    page !== "lab" ||
    selectedLab !== l.id ||
    labWorkspace !== activeWorkspace
  )
    return;
  running = false;
  runButton.disabled = false;
  submitButton.disabled = false;
  runButton.innerHTML = icon("play") + "<span>Run</span>";
  submitButton.innerHTML = icon("check-check") + "<span>Submit</span>";
  const elapsed = Math.round(performance.now() - started),
    passed = result.results?.filter((r) => r.pass).length || 0,
    all = !!result.results?.length && result.results.every((r) => r.pass);
  latestCodePass[l.id] = all ? code : null;
  if (!all && progress.solved.includes(l.id)) {
    progress.solved = progress.solved.filter((id) => id !== l.id);
    persist();
    $(".lab-solved").textContent = "";
  }
  const status = all
    ? proofReady(l)
      ? "Accepted"
      : "Proof required"
    : result.error?.includes("Exceeded 3 seconds")
      ? "Time Limit Exceeded"
      : result.error || result.results?.some((r) => r.error && !r.pass)
        ? "Runtime Error"
        : "Wrong Answer";
  if (result.error) {
    $("#test-results").innerHTML =
      `<div class="test-error"><strong>${status}</strong><pre>${esc(result.error)}</pre></div>`;
  } else {
    $("#test-results").innerHTML =
      `<div class="test-summary ${all ? "passed" : "failed"}"><strong>${mode === "submit" ? status : all ? "All tests passed" : "Tests failed"}</strong><span>${passed}/${l.tests.length} tests passed</span></div><div class="lc-result-meta"><span>Python</span><span>${elapsed} ms wall time (worker)</span></div>${result.results.map((r, i) => `<details class="test-case ${r.pass ? "pass" : "fail"}" ${i === (all ? 0 : result.results.findIndex((x) => !x.pass)) ? "open" : ""}><summary>${icon(r.pass ? "check" : "x")}Case ${i + 1}<span>${r.pass ? "Passed" : "Failed"}</span>${icon("chevron-down")}</summary><div><label>Arguments</label><pre>${esc(JSON.stringify(l.tests[i].args, null, 2))}</pre><label>Expected</label><pre>${esc(r.expected)}</pre><label>Your output</label><pre class="${r.pass ? "lc-output-pass" : "lc-output-fail"}">${esc(r.actual)}</pre></div></details>`).join("")}${all && l.hybrid && !proofReady(l) ? '<div class="proof-reminder">Code passed. Complete your proof and self-review to finish this challenge. <button data-lc-proof-jump>Complete proof →</button></div>' : ""}`;
    if (all) markSolved(l);
  }
  if (result.stdout)
    $("#test-results").insertAdjacentHTML(
      "beforeend",
      `<details class="lc-stdout" open><summary>Stdout / stderr</summary><pre>${esc(result.stdout)}</pre></details>`,
    );
  if (mode === "submit") {
    progress.submissions[l.id] ||= [];
    progress.submissions[l.id].unshift({
      time: Date.now(),
      status,
      passed,
      total: l.tests.length,
      elapsed,
      code,
      language: "python",
      proofRequired: !!l.hybrid,
      proofReviewed: proofReady(l),
      proof: l.hybrid ? progress.proofs[l.id] || "" : "",
    });
    progress.submissions[l.id] = progress.submissions[l.id].slice(0, 20);
    persist();
    labWorkspace?.showSubmissions();
  }
  createIcons({ icons });
}
function markSolved(l) {
  if (
    latestCodePass[l.id] === (progress.code[l.id] || starter(l)) &&
    proofReady(l) &&
    !progress.solved.includes(l.id)
  ) {
    progress.solved.push(l.id);
    persist();
    $(".lab-solved")?.replaceChildren(
      document.createTextNode(
        l.hybrid ? "✓ Code passed · Proof self-reviewed" : "✓ Solved",
      ),
    );
    toast(
      l.hybrid
        ? "Complete: tests passed and proof self-reviewed."
        : "Well done! You implemented the algorithm yourself.",
    );
  }
}
function saveEditor() {
  progress.code[selectedLab] = $("#code-editor").value;
  latestCodePass[selectedLab] = null;
  if (progress.solved.includes(selectedLab)) {
    progress.solved = progress.solved.filter((id) => id !== selectedLab);
    $(".lab-solved").textContent = "";
  }
  persist();
}
function updateProof() {
  const l = labs.find((l) => l.id === selectedLab);
  persist();
  $("#proof-status").textContent = proofReady(l)
    ? "✓ Proof written and self-reviewed."
    : "Write your proof and confirm all rubric items to complete this combined challenge.";
  if (!proofReady(l) && progress.solved.includes(l.id)) {
    progress.solved = progress.solved.filter((id) => id !== l.id);
    $(".lab-solved").textContent = "";
    persist();
  }
  markSolved(l);
}

let renderAbort;
const colorMedia = matchMedia("(prefers-color-scheme: dark)");
let theme = "dark";
try {
  const stored = localStorage.getItem("rl-atlas-doc-theme");
  if (["light", "dark", "auto"].includes(stored)) theme = stored;
} catch {}
function applyTheme() {
  const resolved =
    theme === "auto" ? (colorMedia.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.docTheme = resolved;
  document.documentElement.style.colorScheme = resolved;
  const button = $("button[data-doc-theme]");
  if (button) {
    button.setAttribute("aria-label", `Color theme: ${theme}. Switch theme`);
    button.title = `Color theme: ${theme}`;
    button.innerHTML = `${uiIcon(theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor")}`;
  }
}
colorMedia.addEventListener("change", applyTheme);
function mountSearch(signal) {
  $("#doc-search-dialog")?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "doc-search-dialog";
  dialog.setAttribute("aria-label", "Search documentation");
  dialog.innerHTML = `<div class="doc-search-top"><h2>Search documentation</h2><button aria-label="Close search">Esc</button></div><label class="doc-search-input"><input type="search" aria-label="Search concepts, lessons, or code labs" placeholder="Search concepts, lessons, or code labs…"></label><div class="doc-search-results"></div>`;
  document.body.append(dialog);
  const input = dialog.querySelector("input");
  const entries = [
    ...lessons.map((l) => ({
      title: l.title,
      kind: "Learning guide",
      href: "/#lesson/" + l.id,
    })),
    ...labs.map((l) => ({
      title: l.title,
      kind: "Python code lab",
      href: "/lab.html#" + l.id,
    })),
  ];
  function results() {
    const query = input.value.toLowerCase();
    const items = entries.filter((l) => l.title.toLowerCase().includes(query));
    dialog.querySelector(".doc-search-results").innerHTML = items.length
      ? items
          .map(
            (l) =>
              `<a href="${l.href}"><strong>${esc(l.title)}</strong><small>${l.kind}</small></a>`,
          )
          .join("")
      : '<p class="doc-search-empty">No results found.</p>';
  }
  const open = () => {
    results();
    dialog.showModal();
    input.focus();
  };
  $("[data-doc-search]").addEventListener("click", open, { signal });
  document.addEventListener(
    "keydown",
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!dialog.open) open();
      }
    },
    { signal },
  );
  dialog
    .querySelector("button")
    .addEventListener("click", () => dialog.close(), { signal });
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    },
    { signal },
  );
  dialog.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("a")) dialog.close();
    },
    { signal },
  );
  input.addEventListener("input", results, { signal });
  input.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") {
        const link = dialog.querySelector(".doc-search-results a");
        if (link) {
          dialog.close();
          link.click();
        }
      }
    },
    { signal },
  );
}
function render() {
  cleanTutor();
  labWorkspace?.cleanup();
  renderAbort?.abort();
  renderAbort = new AbortController();
  const { signal } = renderAbort;
  const id = decodeURIComponent(location.hash.slice(1)).replace(/^lab\//, "");
  selectedLab = labs.some((l) => l.id === id) ? id : "return";
  const lab = labs.find((l) => l.id === selectedLab);
  running = false;
  $("#main-content").innerHTML = renderLab(lab, labs, progress);
  document.title = `${lab.title} — Python Lab — RL Atlas`;
  for (const name of ["run-code", "submit-code", "reset-code"]) {
    $(`[data-action="${name}"]`).addEventListener(
      "click",
      () => {
        if (name === "reset-code") {
          labWorkspace.setSource(starter(lab));
          toast("Python starter restored.");
        } else executeCode(name === "submit-code" ? "submit" : "run");
      },
      { signal },
    );
  }
  $("#proof-input")?.addEventListener(
    "input",
    (e) => {
      progress.proofs[selectedLab] = e.target.value;
      updateProof();
    },
    { signal },
  );
  document.querySelectorAll("[data-proof-check]").forEach((input) =>
    input.addEventListener(
      "change",
      () => {
        progress.checks[selectedLab] ||= {};
        progress.checks[selectedLab][input.dataset.proofCheck] = input.checked;
        updateProof();
      },
      { signal },
    ),
  );
  labWorkspace = mountLabWorkspace({
    lab,
    progress,
    onCodeChange: saveEditor,
    onRun: () => executeCode(),
    onSubmit: () => executeCode("submit"),
    toast,
  });
  $("button[data-doc-theme]").addEventListener(
    "click",
    () => {
      theme = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";
      try {
        localStorage.setItem("rl-atlas-doc-theme", theme);
      } catch {}
      applyTheme();
    },
    { signal },
  );
  applyTheme();
  cleanTutor = mountTutor({
    lessonId: labLessonId(lab),
    labId: lab.id,
    sectionKey: "lab",
  });
  mountSearch(signal);
  createIcons({ icons });
  persist();
}
window.addEventListener("hashchange", render);
render();
