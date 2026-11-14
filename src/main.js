import { atlasTopics } from "./atlas-content.js";
import { atlasOverview, atlasTopicView, mountAtlas } from "./atlas.js";
let cleanAtlas = () => {};
import { mountTutor } from "./tutor.js";
let cleanTutor = () => {};
import { loadProgress } from "./progress.js";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/playfair-display/500-italic.css";
import "./ui-primitives.css";
import "./style.css";
import "./docs.css";
import { prepareDocsShell, mountDocs } from "./docs.js";
let cleanDocs = () => {};
import { mathText } from "./math-text.js";
import "./visuals.css";
import {
  visualLesson,
  mountVisuals,
  mountProofWalkthroughs,
} from "./visuals.js";
let cleanVisuals = () => {};
let cleanProofs = () => {};
import "katex/dist/katex.min.css";
import "./docs-polish.css";
import katex from "katex";
import {
  createIcons,
  Waypoints,
  Check,
  Compass,
  ArrowUpRight,
  NotebookPen,
  Menu,
  Map,
  SquareCode,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Code2,
  Infinity,
  Play,
  Pause,
  RotateCcw,
  MoveUpRight,
  Info,
  ScanEye,
  Maximize,
  Clock3,
  FlaskConical,
  Sprout,
  Dices,
  Network,
  Sparkles,
  GitBranch,
  Layers,
  Route,
  TrendingUp,
  Gem,
  ListChecks,
  MousePointer2,
  Sigma,
  Terminal,
  ArrowLeft,
  Lightbulb,
  ChevronDown,
  Bookmark,
  CheckCheck,
  SlidersHorizontal,
  Search,
  FileText,
  LoaderCircle,
  CircleCheck,
  CircleX,
  X,
  Download,
  Bot,
  Flag,
  TriangleAlert,
  PencilLine,
} from "lucide";
const icons = {
  Waypoints,
  Check,
  Compass,
  ArrowUpRight,
  NotebookPen,
  Menu,
  Map,
  SquareCode,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Code2,
  Infinity,
  Play,
  Pause,
  RotateCcw,
  MoveUpRight,
  Info,
  ScanEye,
  Maximize,
  Clock3,
  FlaskConical,
  Sprout,
  Dices,
  Network,
  Sparkles,
  GitBranch,
  Layers,
  Route,
  TrendingUp,
  Gem,
  ListChecks,
  MousePointer2,
  Sigma,
  Terminal,
  ArrowLeft,
  Lightbulb,
  ChevronDown,
  Bookmark,
  CheckCheck,
  SlidersHorizontal,
  Search,
  FileText,
  LoaderCircle,
  CircleCheck,
  CircleX,
  X,
  Download,
  Bot,
  Flag,
  TriangleAlert,
  PencilLine,
};
import { lessons, labs } from "./content.js";
import {
  GOAL,
  TRAP,
  START,
  WALLS,
  move,
  solveGrid,
  rubricScore,
} from "./engine.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name, cls = "") =>
  `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const math = (tex, block = true) =>
  katex.renderToString(tex, { throwOnError: false, displayMode: block });
const progress = loadProgress();
function persist() {
  try {
    localStorage.setItem("rl-atlas-v1", JSON.stringify(progress));
  } catch {
    toast(
      "Your browser does not allow saving. Progress will be kept for this session only.",
    );
  }
}
let page = "home",
  selectedLesson = "foundations",
  selectedAtlas = "expectation",
  selectedLab = "return",
  filter = "all",
  search = "",
  drawer = false,
  running = false;
let sim = {
  gamma: 0.9,
  cost: -0.1,
  agent: START,
  steps: 0,
  score: 0,
  values: false,
  timer: null,
  finished: false,
};
function toast(msg) {
  let t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 3500);
}
function badges(l) {
  return `<span class="badge ${l.level.toLowerCase()}">${l.level}</span>${l.hybrid ? '<span class="badge hybrid">Math + Code</span>' : ""}`;
}
function render() {
  cleanTutor();
  cleanDocs();
  cleanVisuals();
  cleanProofs();
  cleanAtlas();
  clearInterval(sim.timer);
  sim.timer = null;
  const percent = Math.round((progress.read.length / lessons.length) * 100);
  $("#app").innerHTML =
    `<div class="app-shell"><button class="drawer-backdrop ${drawer ? "open" : ""}" data-action="menu" aria-label="Close menu"></button><aside class="sidebar ${drawer ? "open" : ""}"><a class="brand" href="#home" aria-label="RL Atlas home"><span class="brand-mark">${icon("waypoints")}</span><span>RL<span class="brand-light"> Atlas</span><small>LEARN. PROVE. IMPLEMENT.</small></span></a><div class="course-label">UNDERSTAND IT. MAKE IT YOURS.</div><a href="#home" class="side-home ${page === "home" ? "active" : ""}">${icon("compass")}Course overview</a><div class="side-heading">YOUR LEARNING JOURNEY <span>09</span></div><nav class="lesson-nav" aria-label="Chapters">${lessons.map((l, i) => `${i === 3 ? '<div class="nav-section">ALGORITHMS & OPTIMIZATION</div>' : i === 7 ? '<div class="nav-section">REWARD DESIGN</div>' : ""}<a href="#lesson/${l.id}" class="lesson-link ${page === "lesson" && selectedLesson === l.id ? "active" : ""}"><span class="lesson-num ${progress.read.includes(l.id) ? "done" : ""}">${progress.read.includes(l.id) ? icon("check") : l.n}</span><span>${l.short}</span>${l.id === "rubric" ? '<span class="tiny-dot"></span>' : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="progress-caption"><span>Learning progress</span><b>${percent}%</b></div><div class="progress-track"><span style="width:${percent}%"></span></div><small>${progress.read.length}/9 chapters complete</small><a href="#notebook" class="note-link">${icon("notebook-pen")} My notebook ${icon("arrow-up-right")}</a></div></aside><div class="main-shell"><header class="topbar"><button class="icon-btn mobile-menu" aria-label="Open menu" aria-expanded="${drawer}" data-action="menu">${icon("menu")}</button><div class="breadcrumb">Reinforcement Learning <span>/</span> <strong>${{ home: "Explore", curriculum: "Learning path", atlas: "RL & Deep RL atlas", "atlas-topic": "Deep RL topic", lesson: "Lesson", labs: "Code lab", lab: "Code lab", notebook: "Notebook" }[page]}</strong></div><div class="top-right"><span class="offline-dot"></span><span class="local-label">Progress saved on this device</span><span class="top-divider"></span><button class="avatar" data-action="notebook" aria-label="Open your notebook">ME</button></div></header><div class="page-wrap"><nav class="top-tabs" aria-label="Main navigation"><a href="#home" class="${page === "home" ? "active" : ""}">${icon("compass")}Explore</a><a href="#curriculum" class="${page === "curriculum" || page === "lesson" ? "active" : ""}">${icon("map")}Learning path</a><a href="#labs" class="${page === "labs" || page === "lab" ? "active" : ""}">${icon("square-code")}Code lab<span class="tab-count">${labs.length}</span></a><a href="#notebook" class="${page === "notebook" ? "active" : ""}">${icon("notebook-pen")}Notebook</a><span class="tab-aside">FROM INTUITION TO IMPLEMENTATION ${icon("arrow-down-right")}</span></nav><main id="main-content">${page === "home" ? home() : page === "atlas" ? atlasOverview() : page === "atlas-topic" ? atlasTopicView(selectedAtlas) : page === "curriculum" ? curriculum() : page === "lesson" ? lessonView() : page === "labs" ? labsView() : notebook()}</main><footer><a href="#home">RL Atlas</a><span>Deep understanding. One small step at a time.</span><span>For curious minds who want to understand why ${icon("sprout")}</span></footer></div></div></div><div id="toast" role="status" aria-live="polite"></div>`;
  const docsContext = prepareDocsShell({
    page,
    selectedLesson,
    selectedAtlas,
    selectedLab,
    lessons,
    labs,
  });
  bind();
  cleanDocs = mountDocs(docsContext, { lessons, labs });
  cleanVisuals = mountVisuals();
  cleanProofs = mountProofWalkthroughs();
  cleanAtlas = mountAtlas();
  createIcons({ icons });
  cleanTutor = mountTutor({
    lessonId:
      page === "atlas-topic"
        ? "atlas-" + selectedAtlas
        : page === "lesson"
          ? selectedLesson
          : "foundations",
    withSectionButtons: page === "lesson" || page === "atlas-topic",
  });
  if (page === "home") drawGrid();
  if (page === "lesson" && selectedLesson === "rubric") updateRubric();
}
function home() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> A DIFFERENT WAY TO LEARN RL</div><h1>Learn by experience.<br>Understand it <span class="serif-em">deeply.</span></h1><p>From an agent’s very first steps to<br class="desktop-break"> rubric-based rewards. Explore reinforcement learning<br class="desktop-break"> through intuition, mathematical proofs, and code you write.</p><div class="hero-actions"><a class="btn primary" href="#lesson/${progress.read.length ? lessons.find((l) => !progress.read.includes(l.id))?.id || "rubric" : "foundations"}">${progress.read.length ? "Continue learning" : "Start your journey"} ${icon("arrow-up-right")}</a><a class="text-btn" href="#curriculum">View the learning path ${icon("arrow-right")}</a></div><div class="hero-meta"><span>${icon("book-open")}9 in-depth chapters</span><span>${icon("code-2")}${labs.length} from-scratch challenges</span><span>${icon("infinity")}Learn at your own pace</span></div></div><div class="sim-card"><div class="sim-top"><span><span class="live-dot"></span> AGENT’S LITTLE WORLD</span><span class="sim-tag">LIVE PLAYGROUND</span></div><div class="sim-title"><h2>A small world. A big idea.</h2><p>Which path will the agent take to reach the goal?</p></div><div class="sim-body"><div class="grid-scene"><div class="axis-label y-label">STATE SPACE</div><div id="grid" class="gridworld" aria-label="5 by 5 Gridworld environment"></div><div class="grid-key"><span><i class="key-dot agent-key"></i> Agent</span><span><i class="key-dot goal-key"></i> Goal +10</span><span><i class="key-dot trap-key"></i> Trap −5</span></div></div><div class="sim-settings"><label for="gamma">Discount <span>γ = <b id="gamma-number">${sim.gamma.toFixed(2)}</b></span></label><input id="gamma" type="range" min="0" max="0.99" step="0.01" value="${sim.gamma}"><div class="range-captions"><span>Present</span><span>Future</span></div><div class="sim-stat"><span>Steps</span><strong id="step-count">${sim.steps.toString().padStart(2, "0")}</strong></div><div class="sim-stat"><span>Total reward</span><strong id="reward-count">${sim.score.toFixed(1)}</strong></div><button class="values-toggle ${sim.values ? "on" : ""}" data-action="values">${icon("scan-eye")} ${sim.values ? "Hide" : "Show"} state value</button><div class="agent-thought" id="sim-thought">“The shortest path…<br>or a safer route?”</div></div></div><div class="sim-controls"><button class="btn small sim-run" data-action="simulate">${icon("play")} Run agent</button><button class="icon-btn reset" data-action="reset-sim" aria-label="Reset simulation">${icon("rotate-ccw")}</button><span>Change γ and see what happens ${icon("move-up-right")}</span></div><div class="sim-note">${icon("info")}Optimal policy from value iteration · Deterministic environment</div></div></section><section class="learning-strip"><div class="strip-intro"><span class="mini-kicker">HOW YOU WILL LEARN</span><strong>Go beyond reading. Explore.</strong></div><div>${icon("mouse-pointer-2")}<span><b>Build your intuition</b><small>Experiment, observe, ask questions</small></span></div><div>${icon("sigma")}<span><b>Work through the proof</b><small>Understand why the math works</small></span></div><div>${icon("terminal")}<span><b>Implement it yourself</b><small>From first principles. Every step.</small></span></div></section><section class="journey-section"><div class="section-heading"><div><div class="eyebrow muted">THE LEARNING PATH</div><h2>A new perspective at every step<span class="orange-period">.</span></h2><p>A thoughtful path from “What is RL?” to designing your own rewards.</p></div><a href="#curriculum" class="text-btn">Explore the full path ${icon("arrow-up-right")}</a></div><div class="chapter-cards">${lessons
    .slice(0, 3)
    .map((l) => chapterCard(l))
    .join(
      "",
    )}</div></section><section class="lab-banner"><span class="banner-icon">${icon("flask-conical")}</span><div><span class="mini-kicker">LEARN BY BUILDING</span><h3>Understand an algorithm? Build it yourself.</h3><p>${labs.length} code labs · Easy → Hard · Practical test cases · Math + Code</p></div><a href="#labs" class="btn outline">Enter the lab ${icon("arrow-right")}</a><span class="banner-doodle">{ }</span></section>`;
}
function chapterCard(l) {
  return `<a href="#lesson/${l.id}" class="chapter-card ${l.color}"><div class="chapter-top"><span class="chapter-icon">${icon(l.icon)}</span><span class="chapter-counter">CHAPTER ${l.n}</span>${progress.read.includes(l.id) ? '<span class="read-check">✓</span>' : ""}</div><span class="chapter-tag">${l.tag}</span><h3>${l.title}</h3><p>${l.desc}</p><div class="chapter-footer"><span>${icon("clock-3")} ${l.time} min <i>·</i> ${l.level}</span><span class="round-arrow">${icon("arrow-up-right")}</span></div></a>`;
}
function curriculum() {
  return `<div class="page-heading"><div class="eyebrow">YOUR LEARNING PATH</div><h1>From foundations to <span class="serif-em">understanding.</span></h1><p>Nine connected chapters. Each brings intuition, mathematics, and a challenge to put it into practice.</p></div><div class="path-summary"><span>${icon("book-open")}9 chapters</span><span>${icon("clock-3")}About 5 hours of theory</span><span>${icon("code-2")}${labs.length} code labs</span><span>${icon("check-check")}${progress.read.length} chapters complete</span></div><div class="chapter-cards curriculum-cards">${lessons.map(chapterCard).join("")}</div>`;
}
function lessonView() {
  const l = lessons.find((l) => l.id === selectedLesson);
  const next = lessons[lessons.indexOf(l) + 1];
  return `<div class="lesson-layout"><article class="lesson-content"><a href="#curriculum" class="back-link">${icon("arrow-left")}Learning path</a><div class="eyebrow">CHAPTER ${l.n} <span> / </span> ${l.tag}</div><h1>${l.title}</h1><div class="lesson-meta">${badges(l)}<span>${icon("clock-3")}${l.time} min</span><span>${icon("sigma")}${l.extraProof ? "2 proofs" : "1 proof"}</span></div><p class="lesson-lead">${l.desc}</p>${visualLesson(l.id)}<div class="intuition-box"><div class="box-label">${icon("lightbulb")} START WITH INTUITION</div><p>${l.intuition}</p></div>${l.sections.map((s, i) => `<section class="prose-section"><h2><span>${i + 1}.</span> ${s[0]}</h2><p>${s[1]}</p></section>`).join("")}<div class="equation-box">${math(l.eq)}<span>THE CORE EQUATION</span></div>${l.id === "rubric" ? rubricPlayground() : ""}<section class="proof-section"><div class="section-title">${icon("sigma")}<h2>${l.proofTitle}</h2></div><div class="assumption"><b>Assumptions.</b> ${l.assume}</div><details class="proof-details"><summary>Try the proof first, then reveal each step ${icon("chevron-down")}</summary><div class="proof-steps">${l.proof.map((p, i) => `<div class="proof-step"><span>${i + 1}</span><div><p>${p[0]}</p>${math(p[1])}</div></div>`).join("")}</div></details><div class="takeaway">${icon("bookmark")}<p>${l.takeaway}</p></div></section>${l.extraProof ? `${visualLesson("kl")}<section class="proof-section"><div class="section-title">${icon("sigma")}<h2>${l.extraProof.title}</h2></div><div class="assumption"><b>Assumptions.</b> ${l.extraProof.assume}</div><details class="proof-details"><summary>See the gradient derivation and capstone connection ${icon("chevron-down")}</summary><div class="proof-steps">${l.extraProof.steps.map((p, i) => `<div class="proof-step"><span>${i + 1}</span><div><p>${p[0]}</p>${math(p[1])}</div></div>`).join("")}</div></details></section>` : ""}${lessonExercise(l)}<section class="quiz-section"><span class="mini-kicker">PAUSE AND REFLECT</span><h2>Check your understanding</h2><p>${l.question}</p><div class="quiz-options">${l.answers.map((a, i) => `<button class="quiz-option ${progress.quiz[l.id] === i ? (i === l.correct ? "correct" : "incorrect") : ""}" data-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${a}</button>`).join("")}</div><div class="quiz-feedback" role="status">${progress.quiz[l.id] !== undefined ? (progress.quiz[l.id] === l.correct ? "✓ Correct. Connect your answer to the proof above." : "Not quite. Review the assumptions and try again.") : ""}</div></section><div class="lesson-next"><button class="btn primary" data-action="complete-lesson">${icon(progress.read.includes(l.id) ? "check" : "check-check")}${progress.read.includes(l.id) ? "Chapter completed" : "Complete chapter"}</button>${next ? `<a href="#lesson/${next.id}" class="text-btn">Next chapter ${icon("arrow-right")}</a>` : '<a href="#labs" class="text-btn">Try a code lab →</a>'}</div></article><aside class="lesson-aside"><div class="aside-card"><span class="mini-kicker">TURN KNOWLEDGE INTO CODE</span>${icon("square-code", "aside-large-icon")}<h3>${labs.find((x) => x.id === l.lab).title}</h3><p>Implement it. Run the tests. Understand every line.</p><a href="/lab.html#${l.lab}" class="btn primary small">Open code lab ${icon("arrow-up-right")}</a></div><div class="aside-note"><label for="lesson-note">${icon("notebook-pen")}Your notes</label><textarea id="lesson-note" placeholder="A new insight, a question worth asking…">${esc(progress.notes[l.id] || "")}</textarea><small>Automatically saved on this device.</small></div></aside></div>`;
}
function lessonExercise(l) {
  return `<section class="lesson-exercise"><div class="box-label">${icon("pencil-line")} YOUR TURN TO PROVE IT</div><h3>${l.proofTitle}</h3><label for="lesson-proof">State your assumptions, derivation, and conclusion (at least 80 characters).</label><textarea id="lesson-proof" placeholder="Start from the definition. Give a reason for each step…">${esc(progress.lessonProofs[l.id] || "")}</textarea><label class="lesson-review"><input id="lesson-reviewed" type="checkbox" ${progress.lessonReviewed[l.id] ? "checked" : ""}>I checked my reasoning against every step of the solution, including the assumptions.</label><small>Proofs are self-reviewed. To complete a chapter, write your proof, confirm this review, and answer the quiz correctly.</small></section>`;
}
function rubricPlayground() {
  return `<section class="rubric-playground"><div class="box-label">${icon("sliders-horizontal")} REWARD SANDBOX</div><h3>What score does an answer deserve?</h3><p>Adjust the scores. Fixed weights: correctness 50%, reasoning 30%, clarity 20%.</p>${["Correctness", "Valid reasoning", "Clear presentation"].map((x, i) => `<label>${x}<span id="rubric-label-${i}">${[1, 0.5, 0.8][i].toFixed(1)}</span><input data-rubric="${i}" type="range" min="0" max="1" step="0.1" value="${[1, 0.5, 0.8][i]}"></label>`).join("")}<label class="gate-control"><input type="checkbox" id="rubric-gate" checked>Pass the required criterion (hard gate)</label><div class="rubric-result">Rubric reward <strong id="rubric-result">0.810</strong><small>The aggregate score does not guarantee quality.</small></div></section>`;
}
function labsView() {
  const visible = labs.filter(
    (l) =>
      (filter === "all" ||
        (filter === "hybrid" && l.hybrid) ||
        l.level === filter) &&
      `${l.title} ${l.topic}`.toLowerCase().includes(search.toLowerCase()),
  );
  return `<div class="page-heading"><div class="eyebrow">THE IMPLEMENTATION LAB</div><h1>It is time to <span class="serif-em">build it yourself.</span></h1><p>No RL libraries. Every algorithm is yours to write, understand, and test.</p></div><div class="lab-info">${icon("terminal")}<p><b>Run Python right in your browser.</b> Start with an empty function and check it with tests. Math + Code challenges also include a self-reviewed proof.</p><span>${progress.solved.length}/${labs.length} solved</span></div><div class="lab-toolbar"><div class="filter-tabs" role="group" aria-label="Filter challenges">${[
    ["all", "All"],
    ["Easy", "Easy"],
    ["Medium", "Medium"],
    ["Hard", "Hard"],
    ["hybrid", "Math + Code"],
  ]
    .map(
      ([v, n]) =>
        `<button data-filter="${v}" class="${filter === v ? "active" : ""}">${n}</button>`,
    )
    .join(
      "",
    )}</div><label class="search-box">${icon("search")}<input id="lab-search" placeholder="Search challenges…" value="${esc(search)}" aria-label="Search challenges"></label></div><div class="lab-table"><div class="lab-table-head"><span>CHALLENGE</span><span>TOPIC</span><span>DIFFICULTY</span><span>TIME</span><span></span></div>${visible.length ? visible.map((l) => `<a class="lab-row" href="/lab.html#${l.id}"><span class="lab-row-title"><span class="lab-number ${progress.solved.includes(l.id) ? "solved" : ""}">${progress.solved.includes(l.id) ? icon("check") : l.number}</span><span><b>${l.title}</b>${l.hybrid ? "<small>Proof + Implementation</small>" : "<small>Implement an algorithm from scratch</small>"}</span></span><span class="lab-topic">${l.topic}</span><span>${badges({ ...l, hybrid: false })}</span><span class="lab-time">${l.minutes} min</span>${icon("arrow-up-right")}</a>`).join("") : '<div class="empty-state">No challenges found. Try another search.</div>'}</div><div class="callout">${icon("info")}Public tests support learning and debugging. This is a personal practice lab, not a proctored exam system.</div>`;
}
function notebook() {
  const entries = lessons.filter((l) => progress.notes[l.id]);
  return `<div class="page-heading"><div class="eyebrow">YOUR FIELD NOTES</div><h1>Keep the things <span class="serif-em">you understand.</span></h1><p>Your notes, proofs, and milestones along the way. Your data stays in this browser.</p></div><div class="notebook-stats"><div><strong>${progress.read.length}<span>/9</span></strong><p>Chapters completed</p></div><div><strong>${progress.solved.length}<span>/${labs.length}</span></strong><p>Challenges solved</p></div><div><strong>${entries.length}</strong><p>Notes saved</p></div><button class="btn outline" data-action="export">${icon("download")}Export notes</button></div><div class="section-heading"><h2>Your ideas</h2></div>${entries.length ? entries.map((l) => `<article class="note-card"><a href="#lesson/${l.id}"><span class="mini-kicker">CHAPTER ${l.n}</span><h3>${l.title} ${icon("arrow-up-right")}</h3></a><p>${esc(progress.notes[l.id])}</p></article>`).join("") : `<div class="empty-notebook">${icon("notebook-pen")}<h2>A blank page. A world to discover.</h2><p>Capture an insight beside any lesson.<br>You will find it here.</p><a class="btn primary" href="#lesson/foundations">Open the first lesson ${icon("arrow-right")}</a></div>`}${
    labs.some((l) => progress.proofs[l.id])
      ? `<div class="section-heading"><h2>Proof drafts</h2></div>${labs
          .filter((l) => progress.proofs[l.id])
          .map(
            (l) =>
              `<article class="note-card"><a href="/lab.html#${l.id}"><span class="mini-kicker">LAB ${l.number} · SELF-REVIEWED</span><h3>${l.title} ${icon("arrow-up-right")}</h3></a><p>${esc(progress.proofs[l.id])}</p></article>`,
          )
          .join("")}`
      : ""
  }`;
}
function drawGrid() {
  const { values, policy } = solveGrid(sim.gamma, sim.cost);
  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 25 }, (_, s) => {
    const wall = WALLS.includes(s),
      agent = sim.agent === s;
    return `<div class="grid-cell ${wall ? "wall" : ""} ${s === GOAL ? "goal" : ""} ${s === TRAP ? "trap" : ""} ${agent ? "has-agent" : ""}" style="${!wall && s !== GOAL && s !== TRAP ? `--cell-shade:${Math.max(0, values[s] / 10) * 0.14}` : ""}">${agent ? `<span class="grid-agent">${icon("bot")}</span>` : s === GOAL ? `${icon("flag")}<b>+10</b>` : s === TRAP ? `${icon("triangle-alert")}<b>−5</b>` : wall ? "" : sim.values ? `<span class="cell-value">${values[s].toFixed(1)}</span>` : `<span class="cell-arrow">${["↑", "→", "↓", "←"][policy[s]]}</span>`}</div>`;
  }).join("");
  createIcons({ icons });
}
function resetSim() {
  clearInterval(sim.timer);
  sim.timer = null;
  sim.agent = START;
  sim.steps = 0;
  sim.score = 0;
  sim.finished = false;
  updateSim();
}
function updateSim() {
  drawGrid();
  if ($("#step-count")) {
    $("#step-count").textContent = String(sim.steps).padStart(2, "0");
    $("#reward-count").textContent = sim.score.toFixed(1);
    $("#sim-thought").innerHTML =
      sim.agent === GOAL
        ? "Goal reached!<br>Experience → learning."
        : sim.agent === TRAP
          ? "Caught in a trap!<br>Try another policy."
          : sim.steps >= 30
            ? "Step limit reached.<br>Try increasing γ."
            : "“The shortest path…<br>or a safer route?”";
    const btn = $('[data-action="simulate"]');
    btn.innerHTML =
      icon(sim.timer ? "pause" : "play") + (sim.timer ? "Pause" : "Run agent");
    createIcons({ icons });
  }
}
function simulate() {
  if (sim.timer) {
    clearInterval(sim.timer);
    sim.timer = null;
    updateSim();
    return;
  }
  if (sim.finished) resetSim();
  sim.timer = setInterval(() => {
    const { policy } = solveGrid(sim.gamma, sim.cost);
    sim.agent = move(sim.agent, policy[sim.agent]);
    sim.steps++;
    sim.score += sim.agent === GOAL ? 10 : sim.agent === TRAP ? -5 : sim.cost;
    if (sim.agent === GOAL || sim.agent === TRAP || sim.steps >= 30) {
      clearInterval(sim.timer);
      sim.timer = null;
      sim.finished = true;
    }
    updateSim();
  }, 420);
  updateSim();
}
function updateRubric() {
  const scores = [...document.querySelectorAll("[data-rubric]")].map((x) =>
    Number(x.value),
  );
  scores.forEach(
    (s, i) => ($(`#rubric-label-${i}`).textContent = s.toFixed(1)),
  );
  $("#rubric-result").textContent = rubricScore(
    scores,
    [0.5, 0.3, 0.2],
    $("#rubric-gate").checked,
  ).toFixed(3);
}
function bind() {
  document.querySelectorAll(".sidebar a").forEach((el) =>
    el.addEventListener("click", () => {
      drawer = false;
      $(".sidebar").classList.remove("open");
      $(".drawer-backdrop").classList.remove("open");
      $(".mobile-menu").setAttribute("aria-expanded", "false");
    }),
  );
  document.querySelectorAll("[data-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const a = el.dataset.action;
      if (a === "menu") {
        drawer = !drawer;
        $(".sidebar").classList.toggle("open", drawer);
        $(".drawer-backdrop").classList.toggle("open", drawer);
        $(".mobile-menu").setAttribute("aria-expanded", String(drawer));
      }
      if (a === "notebook") location.hash = "notebook";
      if (a === "simulate") simulate();
      if (a === "reset-sim") resetSim();
      if (a === "values") {
        sim.values = !sim.values;
        el.classList.toggle("on", sim.values);
        el.innerHTML =
          icon("scan-eye") + ` ${sim.values ? "Hide" : "Show"} state value`;
        drawGrid();
      }
      if (a === "complete-lesson") {
        const lesson = lessons.find((l) => l.id === selectedLesson);
        if (
          !progress.read.includes(selectedLesson) &&
          ((progress.lessonProofs[selectedLesson] || "").trim().length < 80 ||
            !progress.lessonReviewed[selectedLesson] ||
            progress.quiz[selectedLesson] !== lesson.correct)
        ) {
          toast(
            "Write a proof (≥80 characters), review the solution, and answer the quiz correctly before completing this chapter.",
          );
          return;
        }
        if (!progress.read.includes(selectedLesson)) {
          progress.read.push(selectedLesson);
          persist();
          render();
          toast("Progress saved. Every small step counts.");
        }
      }
      if (a === "export") exportNotes();
    }),
  );
  $("#gamma")?.addEventListener("input", (e) => {
    sim.gamma = Number(e.target.value);
    $("#gamma-number").textContent = sim.gamma.toFixed(2);
    resetSim();
  });
  document.querySelectorAll("[data-answer]").forEach((el) =>
    el.addEventListener("click", () => {
      progress.quiz[selectedLesson] = Number(el.dataset.answer);
      persist();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }),
  );
  $("#lesson-proof")?.addEventListener("input", (e) => {
    progress.lessonProofs[selectedLesson] = e.target.value;
    progress.lessonReviewed[selectedLesson] = false;
    $("#lesson-reviewed").checked = false;
    persist();
  });
  $("#lesson-reviewed")?.addEventListener("change", (e) => {
    progress.lessonReviewed[selectedLesson] = e.target.checked;
    persist();
  });
  $("#lesson-note")?.addEventListener("input", (e) => {
    progress.notes[selectedLesson] = e.target.value;
    persist();
  });
  document
    .querySelectorAll("[data-rubric]")
    .forEach((el) => el.addEventListener("input", updateRubric));
  $("#rubric-gate")?.addEventListener("change", updateRubric);
  document.querySelectorAll("[data-filter]").forEach((el) =>
    el.addEventListener("click", () => {
      filter = el.dataset.filter;
      render();
    }),
  );
  $("#lab-search")?.addEventListener("input", (e) => {
    search = e.target.value;
    const caret = e.target.selectionStart;
    render();
    $("#lab-search").focus();
    $("#lab-search").setSelectionRange(caret, caret);
  });
}
function exportNotes() {
  const theoryProofs = lessons
    .filter((l) => progress.lessonProofs[l.id])
    .map((l) => `## ${l.title}\n\n${progress.lessonProofs[l.id]}\n`)
    .join("\n");
  const text = `# RL Atlas — Learning notebook\n\n${lessons
    .filter((l) => progress.notes[l.id])
    .map((l) => `## ${l.n}. ${l.title}\n\n${progress.notes[l.id]}\n`)
    .join(
      "\n",
    )}\n# Theory proofs (self-reviewed)\n\n${theoryProofs}\n# Lab proofs (self-reviewed)\n\n${labs
    .filter((l) => progress.proofs[l.id])
    .map((l) => `## ${l.title}\n\n${progress.proofs[l.id]}\n`)
    .join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "rl-atlas-notebook.md";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Notebook exported as Markdown.");
}
function route() {
  const [routePath, sectionId] = location.hash.slice(1).split("::");
  const [p, id] = routePath.split("/");
  if (p === "lab" && labs.some((l) => l.id === id)) {
    location.replace("/lab.html#" + id);
    return;
  }
  page =
    p === "atlas"
      ? id && atlasTopics.some((t) => t.id === id)
        ? "atlas-topic"
        : "atlas"
      : ["home", "curriculum", "labs", "notebook"].includes(p)
        ? p
        : p === "lesson" && lessons.some((l) => l.id === id)
          ? "lesson"
          : p === "lab" && labs.some((l) => l.id === id)
            ? "lab"
            : "home";
  if (page === "atlas-topic") selectedAtlas = id;
  if (page === "lesson") selectedLesson = id;
  if (page === "lab") selectedLab = id;
  drawer = false;
  render();
  if (sectionId)
    requestAnimationFrame(() =>
      document.getElementById(sectionId)?.scrollIntoView(),
    );
  else window.scrollTo(0, 0);
  document.title = `${page === "atlas-topic" ? atlasTopics.find((t) => t.id === selectedAtlas).title : page === "lesson" ? lessons.find((l) => l.id === selectedLesson).title : page === "lab" ? labs.find((l) => l.id === selectedLab).title : { home: "Introduction", curriculum: "Learning path", atlas: "RL & Deep RL atlas", labs: "Code lab", notebook: "Notebook" }[page]} — RL Atlas`;
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer) $(".drawer-backdrop").click();
});
window.addEventListener("hashchange", route);
route();
