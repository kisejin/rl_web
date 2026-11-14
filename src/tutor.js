import {
  DEFAULT_TUTOR_MODEL,
  findTutorModel,
  tutorModels,
} from "./tutor-models.js";
import "./tutor.css";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import renderMathInElement from "katex/contrib/auto-render";
import { lessons } from "./content.js";
import { tutorTopics, tutorContext } from "./tutor-context.js";
import { uiIcon } from "./ui-icons.js";
const markdown = new Marked({ gfm: true, breaks: true });
let keepOpen = false;
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderTutorAnswer(node, source) {
  const math = [];
  const protectedText = source.replace(
    /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^\n$]+\$/g,
    (text) => {
      math.push(text);
      return `RLATLASMATHTOKEN${math.length - 1}END`;
    },
  );
  node.innerHTML = DOMPurify.sanitize(markdown.parse(protectedText), {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "blockquote",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "h2",
      "h3",
      "h4",
      "hr",
      "a",
    ],
    ALLOWED_ATTR: ["href", "title"],
  });
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const text of textNodes)
    text.textContent = text.textContent.replace(
      /RLATLASMATHTOKEN(\d+)END/g,
      (match, index) => math[+index] ?? match,
    );
  for (const a of node.querySelectorAll("a")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  renderMathInElement(node, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
    trust: false,
    strict: false,
    maxExpand: 1000,
  });
}
export function mountTutor({
  lessonId = "foundations",
  labId,
  sectionKey = "overview",
  withSectionButtons = false,
} = {}) {
  let selectedModel = DEFAULT_TUTOR_MODEL;
  try {
    const stored = localStorage.getItem("rl-atlas-tutor-model");
    if (findTutorModel(stored)) selectedModel = stored;
  } catch {}
  const events = new AbortController(),
    { signal } = events;
  let request = null,
    closed = false,
    busy = false,
    error = "",
    lastQuestion = "",
    messages = [],
    previousFocus = null;
  let context =
    tutorContext({ lessonId, labId, sectionKey }) ||
    tutorContext({ lessonId: "foundations" });
  const host = document.createElement("div");
  host.className = "tutor-root";
  host.innerHTML = `<button class="tutor-launch" aria-label="Open AI study tutor" aria-expanded="false" aria-controls="study-tutor">${uiIcon("chat")}<span>Ask AI</span></button><section id="study-tutor" class="tutor-panel" role="dialog" aria-labelledby="tutor-title" aria-modal="false" hidden><header class="tutor-header"><span class="tutor-avatar">${uiIcon("chat")}</span><div><h2 id="tutor-title">RL Atlas Tutor</h2><p>Your lesson companion</p></div><button class="tutor-icon-btn" data-tutor-clear aria-label="Clear this conversation" title="Clear conversation">${uiIcon("reset")}</button><button class="tutor-icon-btn" data-tutor-close aria-label="Close AI tutor">${uiIcon("close")}</button></header><div class="tutor-context"><label>Model<select id="tutor-model" aria-label="Tutor model">${tutorModels.map((model) => `<option value="${model.id}">${escapeHTML(model.name)}</option>`).join("")}</select></label><label>Lesson<select id="tutor-lesson" aria-label="Tutor lesson">${lessons.map((l) => `<option value="${l.id}">${escapeHTML(l.title)}</option>`).join("")}</select></label><label>Discussing<select id="tutor-section" aria-label="Tutor section"></select></label><a class="tutor-source" href="#" data-tutor-source>${uiIcon("book")}<span></span>${uiIcon("arrow-up-right")}</a></div><div class="tutor-messages" role="log" aria-label="Tutor conversation" aria-live="polite" aria-relevant="additions"></div><div class="tutor-error" role="alert" hidden><p></p><button data-tutor-retry>Try again</button></div><form class="tutor-form"><label class="tutor-sr-only" for="tutor-question">Your question about this lesson</label><textarea id="tutor-question" rows="2" maxlength="2000" placeholder="Ask about an idea, equation, or proof…" required></textarea><div class="tutor-compose-actions"><span data-tutor-count>0 / 2000</span><span class="tutor-key-hint">Enter to send · Shift+Enter for a new line</span><button class="tutor-send" type="submit" aria-label="Send question">${uiIcon("send")}<span>Send</span></button><button class="tutor-stop" type="button" data-tutor-stop hidden>${uiIcon("stop")} Stop</button></div><p class="tutor-disclaimer">AI can make mistakes. Check the lesson and every proof step. Your question and this lesson’s context are sent to the AI provider.</p></form></section>`;
  document.body.append(host);
  const $ = (selector) => host.querySelector(selector),
    panel = $(".tutor-panel"),
    input = $("#tutor-question"),
    log = $(".tutor-messages");
  $("#tutor-model").value = selectedModel;
  const threadKey = () =>
    `rl-atlas-tutor:${context.lessonId}:${context.labId || ""}:${context.sectionKey}`;
  function load() {
    messages = [];
    try {
      const value = JSON.parse(sessionStorage.getItem(threadKey()) || "[]");
      if (Array.isArray(value))
        messages = value
          .filter(
            (m) =>
              m &&
              ["user", "assistant"].includes(m.role) &&
              typeof m.content === "string",
          )
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, 14000),
            ...(m.role === "assistant" && findTutorModel(m.model)
              ? { model: m.model }
              : {}),
          }));
    } catch {}
    error = "";
    lastQuestion = "";
  }
  function save() {
    try {
      sessionStorage.setItem(threadKey(), JSON.stringify(messages.slice(-10)));
    } catch {}
  }
  function controls() {
    $(".tutor-send").hidden = busy;
    $(".tutor-stop").hidden = !busy;
    $("#tutor-model").disabled = busy;
    $("#tutor-lesson").disabled = busy;
    $("#tutor-section").disabled = busy;
    input.disabled = busy;
    $("[data-tutor-clear]").disabled = busy;
    $(".tutor-error").hidden = !error;
    $(".tutor-error p").textContent = error;
  }
  function appendMessage(message) {
    const bubble = document.createElement("article");
    bubble.className = "tutor-message tutor-" + message.role;
    const name = document.createElement("span");
    name.className = "tutor-speaker";
    name.textContent =
      message.role === "user"
        ? "You"
        : findTutorModel(message.model)
          ? `RL Atlas Tutor · ${findTutorModel(message.model).name}`
          : "RL Atlas Tutor";
    bubble.append(name);
    const content = document.createElement("div");
    content.className = "tutor-answer";
    if (message.role === "assistant")
      renderTutorAnswer(content, message.content);
    else content.textContent = message.content;
    bubble.append(content);
    if (message.role === "assistant") {
      const copy = document.createElement("button");
      copy.className = "tutor-copy";
      copy.type = "button";
      copy.setAttribute("aria-label", "Copy tutor answer");
      copy.innerHTML = uiIcon("copy") + "<span>Copy</span>";
      copy.addEventListener(
        "click",
        async () => {
          try {
            await navigator.clipboard.writeText(message.content);
            copy.querySelector("span").textContent = "Copied";
          } catch {
            copy.querySelector("span").textContent = "Select text to copy";
          }
        },
        { signal },
      );
      bubble.append(copy);
    }
    log.append(bubble);
  }
  function draw() {
    log.replaceChildren();
    if (!messages.length && !busy) {
      const empty = document.createElement("div");
      empty.className = "tutor-empty";
      empty.innerHTML = `<span class="tutor-empty-icon">${uiIcon("sparkles")}</span><h3>Let’s make this click.</h3><p>Ask a question about <strong>${escapeHTML(context.sectionTitle)}</strong>. We can build intuition, unpack an equation, or work through a proof.</p><div class="tutor-suggestions"></div>`;
      log.append(empty);
      const prompts =
        context.sectionKey === "lab"
          ? [
              "Give me a hint without the solution.",
              "Explain the input and output with an example.",
              "What edge cases should I consider?",
            ]
          : [
              "Explain this section with a simple example.",
              "Walk me through the math, step by step.",
              "Ask me a question to check my understanding.",
            ];
      for (const question of prompts) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = question;
        b.addEventListener(
          "click",
          () => {
            input.value = question;
            count();
            input.focus();
          },
          { signal },
        );
        empty.querySelector(".tutor-suggestions").append(b);
      }
    }
    for (const message of messages) appendMessage(message);
    if (busy) {
      appendMessage({ role: "user", content: lastQuestion });
      const thinking = document.createElement("div");
      thinking.className = "tutor-thinking";
      thinking.textContent = `${findTutorModel(selectedModel).name} is thinking about this section…`;
      thinking.setAttribute("role", "status");
      log.append(thinking);
    }
    controls();
    log.scrollTop = log.scrollHeight;
  }
  function count() {
    $("[data-tutor-count]").textContent = `${input.value.length} / 2000`;
  }
  function choose(next) {
    context = tutorContext(next) || context;
    load();
    input.value = "";
    count();
    $("#tutor-lesson").value = context.lessonId;
    $("#tutor-section").innerHTML = tutorTopics(context.lessonId, context.labId)
      .map((t) => `<option value="${t.key}">${escapeHTML(t.title)}</option>`)
      .join("");
    $("#tutor-section").value = context.sectionKey;
    const source = $("[data-tutor-source]");
    source.href = context.link;
    source.querySelector("span").textContent =
      context.labId && context.sectionKey === "lab"
        ? "Open Python lab"
        : "Open lesson";
    draw();
  }
  function open(section) {
    if (section && !busy) choose({ lessonId, labId, sectionKey: section });
    previousFocus = document.activeElement;
    keepOpen = true;
    panel.hidden = false;
    $(".tutor-launch").hidden = true;
    $(".tutor-launch").setAttribute("aria-expanded", "true");
    input.focus({ preventScroll: true });
  }
  function close() {
    keepOpen = false;
    panel.hidden = true;
    $(".tutor-launch").hidden = false;
    $(".tutor-launch").setAttribute("aria-expanded", "false");
    if (previousFocus?.isConnected)
      previousFocus.focus({ preventScroll: true });
    else $(".tutor-launch").focus({ preventScroll: true });
  }
  async function submit(question = input.value.trim()) {
    if (busy || !question.trim() || question.length > 2000) return;
    const requestModel = selectedModel;
    lastQuestion = question.trim();
    busy = true;
    error = "";
    input.value = "";
    count();
    draw();
    request = new AbortController();
    const timeout = setTimeout(() => request?.abort("timeout"), 55000);
    let history = [
      ...messages.slice(-10),
      { role: "user", content: lastQuestion },
    ];
    while (
      history.length > 1 &&
      new TextEncoder().encode(JSON.stringify(history)).length > 22000
    )
      history.splice(0, 2);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          model: requestModel,
          lessonId: context.lessonId,
          sectionKey: context.sectionKey,
          ...(context.labId ? { labId: context.labId } : {}),
          messages: history,
        }),
        signal: request.signal,
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The tutor returned an unreadable response. Please retry.",
        );
      }
      if (!response.ok)
        throw new Error(
          result.error || "The tutor is unavailable. Please retry.",
        );
      if (typeof result.reply !== "string" || !result.reply.trim())
        throw new Error("No answer was returned. Please retry.");
      if (closed) return;
      messages.push(
        { role: "user", content: lastQuestion },
        {
          role: "assistant",
          content: result.reply.slice(0, 14000),
          model: findTutorModel(result.model) ? result.model : requestModel,
        },
      );
      messages = messages.slice(-10);
      save();
      if (result.truncated)
        error =
          "The answer reached its length limit. Ask the tutor to continue.";
    } catch (e) {
      if (closed) return;
      error = request.signal.aborted
        ? request.signal.reason === "timeout"
          ? "The tutor took too long. Try a shorter question."
          : "Response stopped. You can edit your question and try again."
        : e.message === "Failed to fetch"
          ? "Could not connect. Check your connection and retry."
          : e.message || "The tutor is unavailable. Please retry.";
      input.value = lastQuestion;
      count();
    } finally {
      clearTimeout(timeout);
      if (!closed) {
        busy = false;
        request = null;
        draw();
        if (!panel.hidden) input.focus({ preventScroll: true });
      }
    }
  }
  $(".tutor-launch").addEventListener("click", () => open(), { signal });
  $("[data-tutor-close]").addEventListener("click", close, { signal });
  $(".tutor-form").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      submit();
    },
    { signal },
  );
  input.addEventListener("input", count, { signal });
  input.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    { signal },
  );
  $("[data-tutor-retry]").addEventListener(
    "click",
    () => submit(input.value.trim() || lastQuestion),
    { signal },
  );
  $("[data-tutor-stop]").addEventListener("click", () => request?.abort(), {
    signal,
  });
  $("[data-tutor-clear]").addEventListener(
    "click",
    () => {
      messages = [];
      error = "";
      lastQuestion = "";
      save();
      draw();
      input.focus();
    },
    { signal },
  );
  $("#tutor-model").addEventListener(
    "change",
    (e) => {
      if (busy || !findTutorModel(e.target.value)) return;
      selectedModel = e.target.value;
      try {
        localStorage.setItem("rl-atlas-tutor-model", selectedModel);
      } catch {}
      error = "";
      controls();
    },
    { signal },
  );
  $("#tutor-lesson").addEventListener(
    "change",
    (e) => choose({ lessonId: e.target.value, sectionKey: "overview" }),
    { signal },
  );
  $("#tutor-section").addEventListener(
    "change",
    (e) =>
      choose({
        lessonId: context.lessonId,
        labId: context.labId,
        sectionKey: e.target.value,
      }),
    { signal },
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key === "Escape" &&
        !panel.hidden &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        close();
      }
    },
    { signal },
  );
  const injected = [];
  function sectionButton(target, key, label = "Ask AI about this section") {
    if (!target) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tutor-section-button";
    b.innerHTML = uiIcon("chat") + "<span>" + label + "</span>";
    b.dataset.tutorTopic = key;
    b.addEventListener("click", () => open(key), { signal });
    target.append(b);
    injected.push(b);
  }
  if (withSectionButtons) {
    sectionButton(document.querySelector(".intuition-box"), "intuition");
    document
      .querySelectorAll(".prose-section")
      .forEach((section, i) => sectionButton(section, "section-" + i));
    sectionButton(
      document.querySelector(".equation-box"),
      "equation",
      "Ask AI about this equation",
    );
    document
      .querySelectorAll(".proof-section")
      .forEach((section, i) =>
        sectionButton(
          section,
          i === 0 ? "proof" : "extra-proof",
          "Discuss this proof with AI",
        ),
      );
    sectionButton(
      document.querySelector(".lesson-exercise"),
      "practice",
      "Ask for a proof hint",
    );
  }
  choose({ lessonId, labId, sectionKey });
  if (keepOpen) open();
  return () => {
    closed = true;
    request?.abort();
    events.abort();
    host.remove();
    injected.forEach((button) => button.remove());
  };
}
