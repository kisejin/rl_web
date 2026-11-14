import {
  tutorSkills,
  normalizeAgentState,
  normalizeAgentEvent,
} from "./tutor-agent.js";
import { prepareTutorFile } from "./tutor-files.js";
import { validateAttachments } from "./tutor-attachments.js";
import { uiIcon } from "./ui-icons.js";
import "./tutor-workspace.css";

export function mountTutorWorkspace(
  host,
  { signal, isBusy, onError, onInput },
) {
  const panel = host.querySelector(".tutor-panel"),
    form = host.querySelector(".tutor-form"),
    input = form.querySelector("textarea");
  let key = "",
    files = [],
    state = normalizeAgentState(),
    processing = false,
    frozen = false,
    sequence = 0;
  const bar = document.createElement("div");
  bar.className = "tutor-agent-bar";
  bar.innerHTML = `<div class="tutor-agent-selects"><label>Mode<select aria-label="Tutor mode"><option value="ask">Ask</option><option value="plan">Plan</option></select></label><label>Skill<select aria-label="Tutor skill"></select></label></div><div class="tutor-agent-shortcuts"><button type="button" data-workspace-plan>Plan & goal <span data-plan-count></span></button><button type="button" data-workspace-help>MCP & skills</button><label><input type="checkbox" data-web-search> Search papers</label></div>`;
  const mode = bar.querySelector('[aria-label="Tutor mode"]'),
    skill = bar.querySelector('[aria-label="Tutor skill"]');
  for (const item of tutorSkills) {
    const option = new Option(item.name, item.id);
    skill.append(option);
  }
  host.querySelector(".tutor-context").after(bar);
  const activity = document.createElement("details");
  activity.className = "tutor-agent-activity";
  activity.hidden = true;
  activity.innerHTML =
    '<summary aria-live="polite">Agent activity</summary><ol></ol><div class="tutor-agent-sources"></div>';
  bar.after(activity);
  const upload = document.createElement("div");
  upload.className = "tutor-upload";
  upload.innerHTML = `<div class="tutor-file-list" aria-label="Attached files"></div><div class="tutor-upload-actions"><button type="button" aria-label="Attach files">${uiIcon("paperclip")}<span>Attach</span></button><input type="file" aria-label="Choose attachments" hidden multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.py,.txt,.md,.json,.csv,.ipynb"><span data-upload-status>Images · PDF · code</span><button type="button" class="tutor-command-button" aria-label="Chat commands">/</button></div>`;
  form.prepend(upload);
  const picker = upload.querySelector("input[type=file]"),
    attach = upload.querySelector('[aria-label="Attach files"]');
  const expand = document.createElement("button");
  expand.type = "button";
  expand.className = "tutor-icon-btn";
  expand.setAttribute("aria-label", "Expand tutor");
  expand.title = "Expand tutor";
  expand.innerHTML = uiIcon("expand");
  host.querySelector("[data-tutor-clear]").before(expand);
  expand.addEventListener(
    "click",
    () => {
      const expanded = panel.classList.toggle("is-expanded");
      expand.setAttribute(
        "aria-label",
        expanded ? "Collapse tutor" : "Expand tutor",
      );
      expand.title = expanded ? "Collapse tutor" : "Expand tutor";
    },
    { signal },
  );

  const plan = document.createElement("dialog");
  plan.className = "tutor-workspace-dialog";
  plan.setAttribute("aria-label", "Learning plan and goal");
  plan.innerHTML = `<form method="dialog"><header><h2>Learning plan & goal</h2><button aria-label="Close learning plan">${uiIcon("close")}</button></header></form><label class="tutor-goal-label">Your learning goal<input maxlength="240" placeholder="e.g. Derive Bellman and implement value iteration" aria-label="Learning goal"></label><div class="tutor-goal-actions"><select aria-label="Goal status"><option value="active">Active</option><option value="paused">Paused</option><option value="done">Done</option></select><button type="button" data-save-goal>Save goal</button><button type="button" data-generate-plan>Ask for a plan</button></div><ol class="tutor-plan-steps"></ol><p class="tutor-plan-empty">No plan yet. Set a goal and ask the tutor to plan your next steps.</p><button type="button" data-clear-plan>Clear plan</button><p class="tutor-workspace-note">Plan progress is personal tracking. It does not mark lessons or labs solved.</p>`;
  const help = document.createElement("dialog");
  help.className = "tutor-workspace-dialog";
  help.setAttribute("aria-label", "MCP tools and skills");
  help.innerHTML = `<form method="dialog"><header><h2>MCP tools & skills</h2><button aria-label="Close tools and skills">${uiIcon("close")}</button></header></form><p>The built-in RL Atlas MCP server provides course search, lesson reading, trusted skills, attachment reading and plan/goal updates. Search papers enables Crossref publication metadata; it does not read full papers.</p><ul class="tutor-skill-list"></ul><h3>Commands</h3><div class="tutor-command-list"></div><p class="tutor-workspace-note">No shell or terminal execution. Use the Python lab to run code. Files stay attached to this section until removed; reattach after a page reload. PDFs need selectable text; use an image for scanned pages.</p>`;
  for (const item of tutorSkills.filter((s) => s.id !== "default")) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = item.name + ": ";
    li.append(strong, item.description);
    help.querySelector("ul").append(li);
  }
  for (const command of ["/plan ", "/goal ", "/search ", "/skill proof"]) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = command;
    b.addEventListener(
      "click",
      () => {
        help.close();
        onInput(command);
      },
      { signal },
    );
    help.querySelector(".tutor-command-list").append(b);
  }
  host.append(plan, help);
  bar
    .querySelector("[data-workspace-plan]")
    .addEventListener("click", () => plan.showModal(), { signal });
  bar
    .querySelector("[data-workspace-help]")
    .addEventListener("click", () => help.showModal(), { signal });
  upload
    .querySelector(".tutor-command-button")
    .addEventListener("click", () => help.showModal(), { signal });
  function save() {
    try {
      localStorage.setItem(
        "rl-atlas-agent:" + key,
        JSON.stringify({
          state,
          mode: mode.value,
          skill: skill.value,
          webSearch: bar.querySelector("[data-web-search]").checked,
        }),
      );
    } catch {}
  }
  function renderPlan() {
    plan.querySelector('[aria-label="Learning goal"]').value = state.goal;
    plan.querySelector('[aria-label="Goal status"]').value = state.status;
    const list = plan.querySelector("ol");
    list.replaceChildren();
    for (const [i, step] of state.steps.entries()) {
      const li = document.createElement("li"),
        label = document.createElement("label"),
        check = document.createElement("input");
      check.type = "checkbox";
      check.checked = step.status === "done";
      check.indeterminate = step.status === "in_progress";
      check.disabled = frozen;
      check.setAttribute("aria-label", "Complete plan step " + (i + 1));
      check.addEventListener(
        "change",
        () => {
          state.steps[i].status = check.checked ? "done" : "pending";
          save();
          renderPlan();
        },
        { signal },
      );
      const text = document.createElement("span");
      text.textContent = step.title;
      label.append(check, text);
      li.append(label);
      list.append(li);
    }
    plan.querySelector(".tutor-plan-empty").hidden = !!state.steps.length;
    plan.querySelector("[data-clear-plan]").hidden = !state.steps.length;
    const done = state.steps.filter((s) => s.status === "done").length;
    bar.querySelector("[data-plan-count]").textContent = state.steps.length
      ? `${done}/${state.steps.length}`
      : state.goal
        ? "•"
        : "";
  }
  plan.querySelector("[data-save-goal]").addEventListener(
    "click",
    () => {
      state.goal = plan
        .querySelector('[aria-label="Learning goal"]')
        .value.trim();
      state.status = plan.querySelector('[aria-label="Goal status"]').value;
      save();
      renderPlan();
      record({ type: "status", label: "Learning goal saved" });
    },
    { signal },
  );
  plan.querySelector("[data-clear-plan]").addEventListener(
    "click",
    () => {
      state.steps = [];
      save();
      renderPlan();
    },
    { signal },
  );
  plan.querySelector("[data-generate-plan]").addEventListener(
    "click",
    () => {
      state.goal = plan
        .querySelector('[aria-label="Learning goal"]')
        .value.trim();
      mode.value = "plan";
      save();
      renderPlan();
      plan.close();
      onInput(
        state.goal
          ? "Create a study plan for: " + state.goal
          : "Create a study plan for this lesson.",
      );
    },
    { signal },
  );
  for (const control of bar.querySelectorAll("select,input"))
    control.addEventListener("change", save, { signal });
  function renderFiles() {
    const list = upload.querySelector(".tutor-file-list");
    list.replaceChildren();
    for (const [index, file] of files.entries()) {
      const chip = document.createElement("span");
      chip.className = "tutor-file-chip";
      if (file.kind === "image") {
        const image = document.createElement("img");
        image.src = file.dataUrl;
        image.alt = "";
        chip.append(image);
      }
      const name = document.createElement("span");
      name.textContent = file.name + (file.partial ? " (excerpt)" : "");
      name.title = name.textContent;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.setAttribute("aria-label", "Remove " + file.name);
      remove.innerHTML = uiIcon("close");
      remove.disabled = frozen || processing;
      remove.addEventListener(
        "click",
        () => {
          files.splice(index, 1);
          renderFiles();
        },
        { signal },
      );
      chip.append(name, remove);
      list.append(chip);
    }
    input.required = !files.length;
    upload.querySelector("[data-upload-status]").textContent = processing
      ? "Reading files…"
      : files.some((f) => f.kind === "image")
        ? "Image support depends on model"
        : "Images · PDF · code";
    attach.disabled = frozen || processing;
    picker.disabled = frozen || processing;
    host.querySelector(".tutor-send").disabled = frozen || processing;
  }
  async function addFiles(values) {
    if (isBusy() || processing) return;
    const version = ++sequence,
      thread = key;
    processing = true;
    renderFiles();
    try {
      const incoming = Array.from(values);
      if (incoming.length + files.length > 3)
        throw new Error(
          "Attach up to three files. Remove one before adding another.",
        );
      const prepared = [];
      for (const file of incoming) prepared.push(await prepareTutorFile(file));
      if (version !== sequence || thread !== key) return;
      files = validateAttachments([...files, ...prepared]);
      onError("");
      renderFiles();
    } catch (e) {
      if (thread === key) onError(e.message || "Could not read that file.");
    } finally {
      if (version === sequence) {
        processing = false;
        renderFiles();
      }
      picker.value = "";
    }
  }
  attach.addEventListener("click", () => picker.click(), { signal });
  picker.addEventListener("change", () => addFiles(picker.files), { signal });
  form.addEventListener(
    "dragover",
    (e) => {
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        form.classList.add("is-file-drop");
      }
    },
    { signal },
  );
  form.addEventListener(
    "dragleave",
    () => form.classList.remove("is-file-drop"),
    { signal },
  );
  form.addEventListener(
    "drop",
    (e) => {
      e.preventDefault();
      form.classList.remove("is-file-drop");
      addFiles(e.dataTransfer.files);
    },
    { signal },
  );
  input.addEventListener(
    "paste",
    (e) => {
      const images = Array.from(e.clipboardData?.files || []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (images.length) {
        e.preventDefault();
        addFiles(images);
      }
    },
    { signal },
  );
  function record(raw) {
    const event = normalizeAgentEvent(raw);
    if (!event) return;
    if (event.type === "plan" || event.type === "goal") {
      state = event.state;
      save();
      renderPlan();
    }
    const label =
      event.type === "tool"
        ? `${event.name.replaceAll("_", " ")} · ${event.status}`
        : event.type === "plan"
          ? "Learning plan updated"
          : event.type === "goal"
            ? "Learning goal updated"
            : event.label;
    activity.hidden = false;
    if (label) {
      activity.querySelector("summary").textContent = label;
      const li = document.createElement("li");
      li.textContent = label;
      activity.querySelector("ol").append(li);
      while (activity.querySelectorAll("li").length > 14)
        activity.querySelector("li").remove();
    }
    if (event.type === "sources")
      for (const source of event.sources) {
        if (
          Array.from(activity.querySelectorAll("a")).some(
            (a) => a.getAttribute("href") === source.url,
          )
        )
          continue;
        const a = document.createElement("a");
        a.href = source.url;
        a.textContent = source.title;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        activity.querySelector(".tutor-agent-sources").append(a);
      }
  }
  return {
    load(nextKey) {
      key = nextKey;
      sequence++;
      processing = false;
      files = [];
      state = normalizeAgentState();
      mode.value = "ask";
      skill.value = "default";
      bar.querySelector("[data-web-search]").checked = false;
      try {
        const saved = JSON.parse(localStorage.getItem("rl-atlas-agent:" + key));
        if (saved) {
          state = normalizeAgentState(saved.state);
          mode.value = saved.mode === "plan" ? "plan" : "ask";
          skill.value = tutorSkills.some((s) => s.id === saved.skill)
            ? saved.skill
            : "default";
          bar.querySelector("[data-web-search]").checked = !!saved.webSearch;
        }
      } catch {}
      activity.hidden = true;
      activity.querySelector("ol").replaceChildren();
      activity.querySelector(".tutor-agent-sources").replaceChildren();
      renderFiles();
      renderPlan();
      if (plan.open) plan.close();
      if (help.open) help.close();
    },
    freeze(value) {
      frozen = value;
      for (const el of [
        ...bar.querySelectorAll("input,select"),
        ...plan.querySelectorAll("input,select,button[type=button]"),
      ])
        el.disabled = value;
      renderFiles();
      renderPlan();
    },
    begin() {
      activity.hidden = true;
      activity.querySelector("ol").replaceChildren();
      activity.querySelector(".tutor-agent-sources").replaceChildren();
    },
    record,
    question(value) {
      if (processing) return "";
      const q = value.trim();
      if (q.startsWith("/goal ")) {
        state.goal = q.slice(6).trim().slice(0, 240);
        state.status = "active";
        save();
        renderPlan();
        record({ type: "status", label: "Learning goal saved" });
        onInput("");
        return "";
      }
      if (q.startsWith("/skill ")) {
        const id = q.slice(7).trim();
        if (!tutorSkills.some((s) => s.id === id)) {
          onError("Choose default, intuition, proof, python or review.");
          return "";
        }
        skill.value = id;
        save();
        record({
          type: "status",
          label: "Skill selected: " + tutorSkills.find((s) => s.id === id).name,
        });
        onInput("");
        return "";
      }
      if (/^\/plan(?:\s|$)/.test(q)) {
        mode.value = "plan";
        save();
        return (
          q.slice(5).trim() ||
          (state.goal
            ? "Create a learning plan for: " + state.goal
            : "Create a learning plan for this lesson.")
        );
      }
      if (q.startsWith("/search "))
        return (
          "Use course_search to search the course for: " + q.slice(8).trim()
        );
      return (
        q || (files.length ? "Help me understand the attached files." : "")
      );
    },
    get agent() {
      return {
        mode: mode.value,
        skill: skill.value,
        webSearch: bar.querySelector("[data-web-search]").checked,
        state: normalizeAgentState(state),
      };
    },
    get attachments() {
      return files;
    },
    dispose() {
      sequence++;
      if (plan.open) plan.close();
      if (help.open) help.close();
    },
  };
}
