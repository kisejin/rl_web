import { paneExpandIcon } from "./lab-layout.js";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import {
  syntaxHighlighting,
  HighlightStyle,
  indentUnit,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { indentWithTab, undo, redo } from "@codemirror/commands";
import { runCode } from "./runner.js";
import { escapeText as esc } from "./math-text.js";

export function mountLabWorkspace({
  lab,
  progress,
  onCodeChange,
  onRun,
  onSubmit,
  toast,
}) {
  const root = document.querySelector(".lc-page");
  if (!root) return null;
  const $ = (s) => root.querySelector(s),
    abort = new AbortController(),
    opts = { signal: abort.signal };
  let customBusy = false,
    closed = false,
    activeCase = 0;
  let layout = { problem: 36, code: 60, font: 15 };
  try {
    Object.assign(
      layout,
      JSON.parse(localStorage.getItem("rl-atlas-lab-layout") || "{}"),
    );
  } catch {}
  // Adopt the wider editor when the previous default was saved; keep custom splits.
  if (layout.problem === 44) layout.problem = 36;
  layout.problem = Math.max(30, Math.min(70, Number(layout.problem) || 36));
  layout.code = Math.max(35, Math.min(80, Number(layout.code) || 60));
  layout.font = Math.max(13, Math.min(22, Number(layout.font) || 15));
  const store = () => {
    try {
      localStorage.setItem("rl-atlas-lab-layout", JSON.stringify(layout));
    } catch {}
  };
  const applyLayout = () => {
    root.style.setProperty("--lc-problem-width", layout.problem + "%");
    root.style.setProperty("--lc-code-height", layout.code + "%");
    root.style.setProperty("--lc-editor-font", layout.font + "px");
    $(".lc-splitter-x").setAttribute(
      "aria-valuenow",
      String(Math.round(layout.problem)),
    );
    $(".lc-splitter-y").setAttribute(
      "aria-valuenow",
      String(Math.round(layout.code)),
    );
  };
  applyLayout();
  const source = $("#code-editor").value,
    host = $("#lc-editor-host");
  host.replaceChildren();
  const view = new EditorView({
    doc: source,
    parent: host,
    extensions: [
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRun();
            return true;
          },
        },
        {
          key: "Mod-Shift-Enter",
          run: () => {
            onSubmit();
            return true;
          },
        },
        indentWithTab,
      ]),
      syntaxHighlighting(
        HighlightStyle.define([
          { tag: tags.keyword, color: "var(--lc-syntax-keyword)" },
          { tag: tags.string, color: "var(--lc-syntax-string)" },
          { tag: tags.number, color: "var(--lc-syntax-number)" },
          { tag: tags.comment, color: "var(--lc-muted)" },
          {
            tag: tags.function(tags.variableName),
            color: "var(--lc-syntax-function)",
          },
        ]),
      ),
      basicSetup,
      python(),
      indentUnit.of("    "),
      EditorView.contentAttributes.of({
        id: "code-editor",
        "aria-label": "Your Python code",
        "aria-multiline": "true",
        spellcheck: "false",
      }),
      EditorView.theme({
        "&": { height: "100%", fontSize: "var(--lc-editor-font)" },
        ".cm-scroller": {
          fontFamily: '"SFMono-Regular",Consolas,"Liberation Mono",monospace',
          lineHeight: "1.7",
        },
        ".cm-content": { padding: "12px 0" },
        ".cm-line": { padding: "0 8px" },
        ".cm-gutters": {
          backgroundColor: "var(--lc-panel)",
          color: "var(--lc-muted)",
          border: "none",
        },
        ".cm-activeLine": { backgroundColor: "var(--lc-line-active)" },
        ".cm-activeLineGutter": { backgroundColor: "transparent" },
        ".cm-cursor": { borderLeftColor: "var(--lc-text)" },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
          backgroundColor: "var(--lc-selection)",
        },
      }),
      EditorView.updateListener.of((update) => {
        const pos = update.state.selection.main.head,
          line = update.state.doc.lineAt(pos);
        $("[data-lc-cursor]").textContent =
          `Ln ${line.number}, Col ${pos - line.from + 1}`;
        if (update.docChanged) {
          onCodeChange();
          const state = $(".lc-save-state");
          state.classList.remove("saved");
          requestAnimationFrame(() => state?.classList.add("saved"));
        }
      }),
    ],
  });
  Object.defineProperty(view.contentDOM, "value", {
    get: () => view.state.doc.toString(),
    set: (value) =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      }),
  });
  const consoleToggle = $("[data-lc-toggle-console]");
  const setConsoleCollapsed = (collapsed) => {
    root.classList.toggle("lc-console-collapsed", collapsed);
    consoleToggle.setAttribute("aria-expanded", String(!collapsed));
    consoleToggle.setAttribute(
      "aria-label",
      collapsed ? "Expand test console" : "Collapse test console",
    );
    consoleToggle.title = collapsed
      ? "Expand test console"
      : "Collapse test console";
    $(".lc-splitter-y").tabIndex = collapsed ? -1 : 0;
    view.requestMeasure();
  };
  setConsoleCollapsed(true);
  consoleToggle.addEventListener(
    "click",
    () => {
      if (focusedPane === "tests") focusPane();
      setConsoleCollapsed(!root.classList.contains("lc-console-collapsed"));
    },
    opts,
  );
  const focusLabels = {
    description: "description",
    code: "editor",
    tests: "tests",
  };
  let focusedPane = "";
  const focusPane = (panel = "") => {
    if (panel === "tests") setConsoleCollapsed(false);
    focusedPane = panel;
    root.dataset.focusedPane = panel;
    root.classList.toggle("lc-editor-maximized", panel === "code");
    root.querySelectorAll("[data-lc-expand]").forEach((button) => {
      const selected = button.dataset.lcExpand === panel;
      const label = selected
        ? "Restore " + focusLabels[panel] + " layout"
        : "Maximize " + focusLabels[button.dataset.lcExpand];
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(selected));
      button.innerHTML = paneExpandIcon(selected);
    });
    view.requestMeasure();
  };
  const setMobile = (panel) => {
    if (panel === "tests") setConsoleCollapsed(false);
    if (focusedPane) focusPane();
    $(".lc-workspace").dataset.mobilePanel = panel;
    root
      .querySelectorAll("[data-lc-mobile]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.lcMobile === panel)),
      );
    if (panel === "code") view.requestMeasure();
  };
  const consoleTab = (tab) => {
    setConsoleCollapsed(false);
    root
      .querySelectorAll("[data-lc-console]")
      .forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.lcConsole === tab)),
      );
    $("#lc-testcases").hidden = tab !== "cases";
    $("#test-results").hidden = tab !== "results";
  };
  const leftTab = (tab) => {
    root.querySelectorAll("[data-lc-left]").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.lcLeft === tab));
      b.tabIndex = b.dataset.lcLeft === tab ? 0 : -1;
    });
    for (const name of ["description", "editorial", "submissions"])
      $("#lc-" + name).hidden = name !== tab;
  };
  root
    .querySelectorAll("[data-lc-mobile]")
    .forEach((b) =>
      b.addEventListener("click", () => setMobile(b.dataset.lcMobile), opts),
    );
  root
    .querySelectorAll("[data-lc-left]")
    .forEach((b) =>
      b.addEventListener("click", () => leftTab(b.dataset.lcLeft), opts),
    );
  root
    .querySelectorAll("[data-lc-console]")
    .forEach((b) =>
      b.addEventListener("click", () => consoleTab(b.dataset.lcConsole), opts),
    );
  root.querySelectorAll("[role=tablist]").forEach((list) =>
    list.addEventListener(
      "keydown",
      (e) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        const tabs = [...list.querySelectorAll("[role=tab]")],
          index = tabs.indexOf(document.activeElement);
        if (index < 0) return;
        e.preventDefault();
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        tabs[next].click();
        tabs[next].focus();
      },
      opts,
    ),
  );
  root.querySelectorAll("[data-lc-font]").forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        layout.font = Math.max(
          13,
          Math.min(22, layout.font + Number(b.dataset.lcFont)),
        );
        applyLayout();
        store();
        view.requestMeasure();
      },
      opts,
    ),
  );
  $("[data-lc-undo]").addEventListener(
    "click",
    () => {
      undo(view);
      view.focus();
    },
    opts,
  );
  $("[data-lc-redo]").addEventListener(
    "click",
    () => {
      redo(view);
      view.focus();
    },
    opts,
  );
  root.querySelectorAll("[data-lc-expand]").forEach((button) => {
    button.addEventListener(
      "click",
      () =>
        focusPane(
          focusedPane === button.dataset.lcExpand
            ? ""
            : button.dataset.lcExpand,
        ),
      opts,
    );
  });
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        focusedPane &&
        !root.querySelector("dialog[open]")
      ) {
        const button = $(`[data-lc-expand="${focusedPane}"]`);
        focusPane();
        button.focus();
      }
    },
    opts,
  );
  const fullscreenButton = $("[data-lc-fullscreen]");
  const updateFullscreen = () => {
    const active = !!document.fullscreenElement;
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.title = active ? "Exit full screen" : "Full screen";
    fullscreenButton.querySelector("span").textContent = active
      ? "Exit full screen"
      : "Full screen";
    view.requestMeasure();
  };
  document.addEventListener("fullscreenchange", updateFullscreen, opts);
  updateFullscreen();
  fullscreenButton.addEventListener(
    "click",
    async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen)
          await document.documentElement.requestFullscreen();
        else
          toast(
            "The lab already fills this page. Use your browser’s full-screen controls to hide browser bars.",
          );
      } catch {
        toast(
          "The lab already fills this page. Use your browser’s full-screen controls to hide browser bars.",
        );
      }
    },
    opts,
  );
  const resize = (selector, axis) => {
    const divider = $(selector);
    let dragging = false;
    const change = (e) => {
      if (!dragging) return;
      const rect = $(
        axis === "x" ? ".lc-workspace" : ".lc-right-pane",
      ).getBoundingClientRect();
      if (axis === "x")
        layout.problem = Math.max(
          30,
          Math.min(70, ((e.clientX - rect.left) / rect.width) * 100),
        );
      else
        layout.code = Math.max(
          35,
          Math.min(80, ((e.clientY - rect.top) / rect.height) * 100),
        );
      applyLayout();
      view.requestMeasure();
    };
    divider.addEventListener(
      "pointerdown",
      (e) => {
        dragging = true;
        divider.setPointerCapture(e.pointerId);
        root.classList.add("lc-resizing");
      },
      opts,
    );
    divider.addEventListener("pointermove", change, opts);
    divider.addEventListener(
      "pointerup",
      () => {
        dragging = false;
        root.classList.remove("lc-resizing");
        store();
      },
      opts,
    );
    divider.addEventListener(
      "pointercancel",
      () => {
        dragging = false;
        root.classList.remove("lc-resizing");
      },
      opts,
    );
    divider.addEventListener(
      "keydown",
      (e) => {
        const keys =
          axis === "x" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const key = axis === "x" ? "problem" : "code";
        layout[key] = Math.max(
          axis === "x" ? 30 : 35,
          Math.min(
            axis === "x" ? 70 : 80,
            layout[key] + (e.key === keys[0] ? -2 : 2),
          ),
        );
        applyLayout();
        store();
        view.requestMeasure();
      },
      opts,
    );
  };
  resize(".lc-splitter-x", "x");
  resize(".lc-splitter-y", "y");
  const dialog = $("#lc-problem-dialog");
  $("[data-lc-list]").addEventListener(
    "click",
    () => {
      dialog.showModal();
      $("#lc-list-search").focus();
    },
    opts,
  );
  root.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && dialog.open) {
        e.preventDefault();
        dialog.close();
      }
    },
    opts,
  );
  $("[data-lc-list-close]").addEventListener(
    "click",
    () => dialog.close(),
    opts,
  );
  $("#lc-list-search").addEventListener(
    "input",
    (e) => {
      const query = e.target.value.toLowerCase();
      root
        .querySelectorAll("[data-lc-search-text]")
        .forEach((a) => (a.hidden = !a.dataset.lcSearchText.includes(query)));
    },
    opts,
  );
  root
    .querySelectorAll(".lc-problem-links a")
    .forEach((a) => a.addEventListener("click", () => dialog.close(), opts));
  root.querySelectorAll("[data-lc-case]").forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        activeCase = +b.dataset.lcCase;
        const c = lab.tests[activeCase];
        $("#lc-case-args").value = JSON.stringify(c.args, null, 2);
        $("#lc-case-expected").value = c.throws
          ? "raise ValueError"
          : JSON.stringify(c.expected, null, 2);
        $("#lc-custom-result").replaceChildren();
        root
          .querySelectorAll("[data-lc-case]")
          .forEach((x) => x.classList.toggle("active", x === b));
      },
      opts,
    ),
  );
  $("[data-lc-run-case]").addEventListener(
    "click",
    async () => {
      if (customBusy || $("#run-code").disabled) return;
      let args,
        expected,
        throws = false;
      try {
        args = JSON.parse($("#lc-case-args").value);
        if (!Array.isArray(args))
          throw new Error("Arguments must be a JSON array.");
        const raw = $("#lc-case-expected").value.trim();
        if (raw === "raise ValueError") throws = true;
        else expected = JSON.parse(raw);
      } catch (error) {
        $("#lc-custom-result").innerHTML =
          `<p class="lc-custom-error">${esc(error.message)} Use valid JSON, or “raise ValueError” for the expected output.</p>`;
        return;
      }
      customBusy = true;
      const button = $("[data-lc-run-case]");
      button.disabled = true;
      button.textContent = "Running…";
      $("#run-code").disabled = true;
      $("#submit-code").disabled = true;
      const result = await runCode(view.state.doc.toString(), {
        ...lab,
        tests: [{ args, expected, throws }],
      });
      customBusy = false;
      if (closed) return;
      button.disabled = false;
      button.textContent = "Run selected case";
      $("#run-code").disabled = false;
      $("#submit-code").disabled = false;
      const item = result.results?.[0];
      $("#lc-custom-result").innerHTML = result.error
        ? `<p class="lc-custom-error">${esc(result.error)}</p>`
        : `<div class="lc-custom-outcome ${item.pass ? "passed" : "failed"}"><strong>${item.pass ? "Case passed" : "Case failed"}</strong><p>Expected: <code>${esc(item.expected)}</code></p><p>Actual: <code>${esc(item.actual)}</code></p><small>Custom runs do not update completion or submissions.</small></div>`;
    },
    opts,
  );
  const refreshSubmissions = () => {
    const attempts = progress.submissions?.[lab.id] || [];
    $("[data-lc-submission-count]").textContent = attempts.length;
    $("#lc-submissions").innerHTML =
      `<div class="lc-submissions-heading"><h2>Submissions</h2><p>Checked attempts saved on this device. Tests are public; mathematical proofs are self-reviewed.</p></div>${attempts.length ? attempts.map((a, i) => `<details class="lc-submission"><summary><span class="lc-verdict ${a.status === "Accepted" ? "accepted" : "rejected"}">${esc(a.status)}</span><span>${a.passed}/${a.total} passed</span><time>${esc(new Date(a.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }))}</time></summary><div><p>Python · ${a.elapsed} ms wall time including worker startup</p>${a.proofRequired ? `<p>${a.proofReviewed ? "Proof self-reviewed" : "Proof review required"}</p>` : ""}<pre>${esc(a.code)}</pre><button data-lc-load-submission="${i}">Load this code</button></div></details>`).join("") : '<div class="lc-no-submissions"><span>↥</span><h3>No submissions yet</h3><p>Use Run to check your code, then Submit to save a checked attempt here.</p></div>'}`;
    $("#lc-submissions")
      .querySelectorAll("[data-lc-load-submission]")
      .forEach((b) =>
        b.addEventListener("click", () => {
          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: attempts[+b.dataset.lcLoadSubmission].code,
            },
          });
          setMobile("code");
          view.focus();
          toast("Submission code loaded into the editor.");
        }),
      );
  };
  refreshSubmissions();
  root.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[data-lc-proof-jump]")) {
        leftTab("description");
        setMobile("description");
        $("#proof-input")?.focus();
      }
    },
    opts,
  );
  const themeButton = document.querySelector(".topbar button[data-doc-theme]");
  if (themeButton) $("#lc-theme-host").append(themeButton);
  return {
    source: () => view.state.doc.toString(),
    setSource: (value) =>
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      }),
    isBusy: () => customBusy,
    showResults: () => {
      consoleTab("results");
      setMobile("tests");
    },
    showEditorial: () => {
      leftTab("editorial");
      setMobile("description");
    },
    showSubmissions: () => {
      refreshSubmissions();
      leftTab("submissions");
      setMobile("description");
    },
    refreshSubmissions,
    cleanup: () => {
      closed = true;
      abort.abort();
      if (dialog.open) dialog.close();
      view.destroy();
    },
  };
}
