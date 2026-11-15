import { labs } from "./content.js";
import katex from "katex";
import { atlasTopics } from "./atlas-content.js";
import { atlasSources, requestedAtlasSources } from "./atlas-sources.js";
import { atlasVisual } from "./atlas-visuals.js";
import { atlasFilmPlayer } from "./atlas-films.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const math = (tex) =>
  katex.renderToString(tex, { displayMode: true, throwOnError: false });
export const atlasStages = [
  "Foundations",
  "Value-based RL",
  "Policy optimization",
  "Continuous control",
  "Frontiers & reward learning",
  "Evaluation",
];
export function reviewed() {
  try {
    return JSON.parse(
      localStorage.getItem("rl-atlas-topic-reviews") || "[]",
    ).filter((id) => atlasTopics.some((t) => t.id === id));
  } catch {
    return [];
  }
}
function sourceLink(id) {
  const s = atlasSources[id];
  return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.kind)}</span><strong>${esc(s.name)}</strong><span aria-hidden="true">↗</span></a>`;
}
function cards(list) {
  const done = reviewed();
  return list
    .map(
      (t) =>
        `<a class="atlas-topic-card" data-atlas-card="${t.id}" href="/atlas/${t.id}/"><span>${esc(t.stage)} ${done.includes(t.id) ? "· reviewed" : ""}</span><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p><div>${t.equations.length} key formulas · derivation · animation <b aria-hidden="true">→</b></div></a>`,
    )
    .join("");
}
export function atlasOverview() {
  return `<article class="atlas-page"><header class="atlas-page-header"><div class="doc-page-tag">A VISUAL MAP OF REINFORCEMENT LEARNING</div><h1>From first principles to Deep RL</h1><p class="atlas-lead">Read the mathematics. Follow the derivation. Change a parameter and watch what the equation does.</p><div class="atlas-stats"><span><b>${atlasTopics.length}</b> connected topics</span><span><b>${atlasTopics.reduce((n, t) => n + t.equations.length + t.derivation.steps.length, 0)}</b> formula & derivation displays</span><span><b>${atlasTopics.length}</b> Manim films + interactive models</span></div><p class="atlas-review-summary">${reviewed().length} / ${atlasTopics.length} topics self-reviewed on this device</p></header><section class="atlas-orientation"><h2>How to use this atlas</h2><p>Start with probability, returns and MDPs. Then follow the value-based or policy-optimization track. Each topic includes assumptions, symbols, equations, a short derivation, an illustrative numerical model, a misconception and a knowledge check. Each of the 35 topics links to a matching Python lab. There are 36 labs from Easy to Hard, including 33 combined proof-and-code challenges and three coding warm-ups.</p><p>Notation: <strong>rₜ</strong> is the reward after action aₜ, <strong>γ</strong> is the discount, and a bootstrap mask is zero at a true task terminal. Algorithm conventions are stated where they differ.</p><a href="/#lesson/foundations">New to RL? Begin with the core course →</a></section><div class="atlas-filter"><label>Find a concept<input type="search" data-atlas-search aria-label="Search atlas topics" placeholder="PPO, Bellman, offline RL, KL, GRPO…"></label><label>Learning track<select data-atlas-stage aria-label="Filter atlas track"><option value="all">All tracks</option>${atlasStages.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label></div><p data-atlas-results aria-live="polite">${atlasTopics.length} topics</p><div data-atlas-groups>${atlasStages.map((stage) => `<section class="atlas-track"><h2>${esc(stage)}</h2><div class="atlas-topic-grid">${cards(atlasTopics.filter((t) => t.stage === stage))}</div></section>`).join("")}</div><section class="atlas-sources"><h2>Courses, implementations and lecture playlist</h2><p>Original explanations and derivations informed by the linked resources. Course links support the foundations and standard algorithms; extension papers are cited on the relevant advanced topics. The playlist is linked for further study, not presented as a reviewed transcript.</p><div class="atlas-source-grid">${requestedAtlasSources.map(sourceLink).join("")}</div><p>Some implementation details evolve over time. Read the linked implementation documentation for environment/API versions, preprocessing and benchmark protocols.</p></section></article>`;
}
export function atlasTopicView(id) {
  const topic = atlasTopics.find((t) => t.id === id);
  if (!topic) return atlasOverview();
  const index = atlasTopics.indexOf(topic);
  const relatedLabs = labs.filter((l) => l.atlasTopic === id);
  return `<article class="atlas-page atlas-topic" data-atlas-topic="${topic.id}"><a class="atlas-back" href="/atlas/">← All RL & Deep RL topics</a><header class="atlas-page-header"><div class="doc-page-tag">${esc(topic.stage)} · TOPIC ${String(index + 1).padStart(2, "0")}</div><h1>${esc(topic.title)}</h1><p class="atlas-lead">${esc(topic.summary)}</p><div class="atlas-prerequisites"><span>Builds on</span>${topic.prerequisites.length ? topic.prerequisites.map((id) => `<a href="/atlas/${id}/">${esc(atlasTopics.find((t) => t.id === id)?.title || id)}</a>`).join("") : "basic arithmetic and functions"}</div></header><section class="atlas-assumptions" data-atlas-discuss="overview"><h2>Assumptions and notation</h2><ul>${topic.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul><dl>${topic.symbols.map(([s, d]) => `<div><dt>${esc(s)}</dt><dd>${esc(d)}</dd></div>`).join("")}</dl></section>${atlasFilmPlayer(topic.id)}${atlasVisual(topic)}<section class="atlas-formulas" data-atlas-discuss="equations"><h2>The equations, with their meaning</h2>${topic.equations.map((e, i) => `<div class="atlas-formula"><div class="atlas-formula-heading"><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(e.name)}</h3></div><div class="atlas-math">${math(e.tex)}</div><p>${esc(e.explain)}</p></div>`).join("")}</section><section class="atlas-proof" data-atlas-discuss="proof"><h2>Derivation: ${esc(topic.derivation.claim)}</h2><p>Under the assumptions stated above, justify each transition rather than memorizing the final expression.</p><ol>${topic.derivation.steps.map((step, i) => `<li data-atlas-proof-step ${i ? "hidden" : ""}><h3>Step ${i + 1}</h3><p>${esc(step.text)}</p><div class="atlas-math">${math(step.tex)}</div></li>`).join("")}</ol><div class="atlas-proof-controls"><button data-atlas-reveal type="button">Reveal next derivation step</button><button data-atlas-reveal-all type="button">Show full derivation</button><output data-atlas-proof-count>1 / ${topic.derivation.steps.length} steps</output></div></section><section class="atlas-example"><h2>A worked numerical example</h2><p>${esc(topic.example)}</p></section><aside class="atlas-pitfall"><h2>A mistake worth avoiding</h2><p>${esc(topic.pitfall)}</p></aside><section class="atlas-practice" data-atlas-discuss="practice"><h2>Check your understanding</h2><form data-atlas-check><fieldset><legend>${esc(topic.check.question)}</legend>${topic.check.options.map((option, i) => `<label><input type="radio" name="atlas-answer" value="${i}" required> <span>${esc(option)}</span></label>`).join("")}</fieldset><button type="submit">Check reasoning</button><p data-atlas-feedback role="status"></p></form><h3>Derive, then implement</h3><p>${esc(topic.practice)}</p><div class="atlas-related-labs"><h3>Implement this topic in Python</h3>${relatedLabs.map((lab) => `<a href="/lab.html#${lab.id}" data-atlas-lab><strong>${esc(lab.title)}</strong><span>${lab.level} · ${lab.hybrid ? "Proof + Python" : "Python warm-up"} · ${lab.tests.length} public cases →</span></a>`).join("")}</div><a href="/#labs">Browse all ${labs.length} Python labs →</a><div class="atlas-review"><button type="button" data-atlas-reviewed>${reviewed().includes(id) ? "Reviewed ✓" : "Mark as self-reviewed"}</button><p>This records your own review. It does not verify a proof or complete a coding lab.</p></div></section><section class="atlas-sources"><h2>Read further and inspect implementations</h2><div class="atlas-source-grid">${topic.sources.map(sourceLink).join("")}</div></section><nav class="atlas-topic-pagination" aria-label="Atlas topic navigation">${index ? `<a href="/atlas/${atlasTopics[index - 1].id}/">← ${esc(atlasTopics[index - 1].title)}</a>` : "<span></span>"}${index + 1 < atlasTopics.length ? `<a href="/atlas/${atlasTopics[index + 1].id}/">${esc(atlasTopics[index + 1].title)} →</a>` : '<a href="/atlas/">Return to the map →</a>'}</nav></article>`;
}
