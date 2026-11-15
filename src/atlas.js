import { atlasTopics } from "./atlas-content.js";
import { reviewed } from "./atlas-pages.js";
import { mountAtlasVisuals } from "./atlas-visuals.js";
import { mountAtlasFilms } from "./atlas-films.js";
import "./atlas.css";
export { atlasOverview, atlasTopicView, atlasStages } from "./atlas-pages.js";
export function mountAtlas(root = document) {
  const events = new AbortController(),
    options = { signal: events.signal },
    cleanVisuals = mountAtlasVisuals(root),
    cleanFilms = mountAtlasFilms(root);
  const page = root.querySelector(".atlas-page");
  if (!page)
    return () => {
      cleanVisuals();
      cleanFilms();
      events.abort();
    };
  const search = page.querySelector("[data-atlas-search]"),
    stage = page.querySelector("[data-atlas-stage]");
  if (search) {
    const filter = () => {
      const query = search.value
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean),
        matches = atlasTopics.filter(
          (t) =>
            (stage.value === "all" || stage.value === t.stage) &&
            query.every((q) =>
              (
                t.title +
                " " +
                t.summary +
                " " +
                t.equations.map((e) => e.name + " " + e.explain).join(" ")
              )
                .toLowerCase()
                .split(/[^a-z0-9-]+/)
                .some((word) =>
                  q.length <= 4
                    ? word.split("-").includes(q)
                    : word.includes(q),
                ),
            ),
        );
      page.querySelector("[data-atlas-results]").textContent =
        matches.length + " topics";
      const visible = new Set(matches.map((t) => t.id));
      page
        .querySelectorAll("[data-atlas-card]")
        .forEach(
          (card) => (card.hidden = !visible.has(card.dataset.atlasCard)),
        );
      page.querySelectorAll(".atlas-track").forEach((track) => {
        track.hidden = !track.querySelector("[data-atlas-card]:not([hidden])");
        const heading = track.querySelector("h2");
        const toc = document.querySelector(
          '.doc-toc [data-doc-target="' + heading.id + '"]',
        );
        if (toc) toc.hidden = track.hidden;
      });
      let empty = page.querySelector("[data-atlas-empty]");
      if (!empty) {
        empty = document.createElement("p");
        empty.dataset.atlasEmpty = "";
        empty.textContent =
          "No matching topic. Try “policy”, “value”, “entropy” or choose another track.";
        page.querySelector("[data-atlas-groups]").after(empty);
      }
      empty.hidden = matches.length > 0;
    };
    search.addEventListener("input", filter, options);
    stage.addEventListener("change", filter, options);
  }
  const topic = atlasTopics.find((t) => t.id === page.dataset.atlasTopic);
  if (topic) {
    const steps = [...page.querySelectorAll("[data-atlas-proof-step]")],
      next = page.querySelector("[data-atlas-reveal]"),
      all = page.querySelector("[data-atlas-reveal-all]");
    let visible = 1;
    const show = () => {
      steps.forEach((s, i) => (s.hidden = i >= visible));
      page.querySelector("[data-atlas-proof-count]").textContent =
        `${visible} / ${steps.length} steps`;
      next.disabled = all.disabled = visible === steps.length;
    };
    next.addEventListener(
      "click",
      () => {
        visible = Math.min(visible + 1, steps.length);
        show();
      },
      options,
    );
    all.addEventListener(
      "click",
      () => {
        visible = steps.length;
        show();
      },
      options,
    );
    page.querySelector("[data-atlas-check]").addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        const chosen = Number(
            new FormData(e.currentTarget).get("atlas-answer"),
          ),
          feedback = page.querySelector("[data-atlas-feedback]");
        feedback.textContent =
          (chosen === topic.check.correct ? "Correct. " : "Try again. ") +
          topic.check.explanation;
        feedback.dataset.correct = String(chosen === topic.check.correct);
      },
      options,
    );
    page.querySelector("[data-atlas-reviewed]").addEventListener(
      "click",
      (e) => {
        const ids = reviewed();
        if (!ids.includes(topic.id)) ids.push(topic.id);
        try {
          localStorage.setItem("rl-atlas-topic-reviews", JSON.stringify(ids));
          e.currentTarget.textContent = "Reviewed ✓";
        } catch {
          page.querySelector("[data-atlas-feedback]").textContent =
            "Your browser could not save the self-review.";
        }
      },
      options,
    );
  }
  return () => {
    events.abort();
    cleanVisuals();
    cleanFilms();
  };
}
