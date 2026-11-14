import { uiIcon } from "./ui-icons.js";
import manifest from "./film-manifest.json" with { type: "json" };
const escapeHtml = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const films = Object.fromEntries(
  manifest.films.map((film) => [film.id, film]),
);
export const filmEngine = {
  name: manifest.renderer,
  version: manifest.version,
};
const stamp = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export function filmPlayer(id) {
  const film = films[id];
  if (!film) return "";
  const root = `/animations/manim/${id}`;
  return `<div class="film-panel" id="${id}-film" role="tabpanel" aria-labelledby="${id}-film-tab" data-film-panel>
 <video class="manim-film" controls playsinline preload="none" poster="${root}.jpg" aria-label="Manim animation: ${escapeHtml(film.title)}">
 <source src="${root}.mp4" type="video/mp4"><track kind="captions" src="${root}.vtt" srclang="en" label="English" default>
 Your browser does not support embedded video. <a href="${root}.mp4">Open the animation</a>.</video>
 <div class="film-utilities"><span class="film-engine"><span></span>Rendered with <a href="https://www.manim.community/" target="_blank" rel="noopener">Manim Community</a></span>
 <label>Speed <select data-film-speed aria-label="Animation playback speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label>
 <button type="button" data-film-replay>${uiIcon("reset")} Replay</button><span class="film-duration">${stamp(film.duration)}</span></div>
 <p class="film-intro">Follow the visual argument, then switch to <b>Explore parameters</b> to test the idea yourself. English captions are available in the player.</p>
 <div class="film-error" role="status" hidden>Could not load this film. <a href="${root}.mp4">Open the video directly</a> or switch to Explore parameters.</div>
 <details class="film-transcript"><summary>Read the animation transcript</summary><ol>${film.chapters.map((c) => `<li><button type="button" data-film-seek="${c.time}" aria-label="Jump to ${stamp(c.time)}">${stamp(c.time)}</button><p>${escapeHtml(c.text)}</p></li>`).join("")}</ol></details>
 </div>`;
}
export function mountFilm(el, stopExplore) {
  const abort = new AbortController(),
    opts = { signal: abort.signal },
    video = el.querySelector("video");
  if (!video) return () => {};
  const tabs = [...el.querySelectorAll("[data-film-tab]")];
  const select = (mode, focus = false) => {
    if (mode === "film") stopExplore();
    else video.pause();
    el.querySelector("[data-film-panel]").hidden = mode !== "film";
    el.querySelector("[data-film-explore]").hidden = mode !== "explore";
    tabs.forEach((tab) => {
      const selected = tab.dataset.filmTab === mode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => select(tab.dataset.filmTab), opts);
    tab.addEventListener(
      "keydown",
      (e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          select(
            e.key === "Home"
              ? "film"
              : e.key === "End"
                ? "explore"
                : tab.dataset.filmTab === "film"
                  ? "explore"
                  : "film",
            true,
          );
        }
      },
      opts,
    );
  });
  el.querySelector("[data-film-speed]").addEventListener(
    "change",
    (e) => (video.playbackRate = +e.target.value),
    opts,
  );
  const play = () =>
    video.play().catch(() => {
      el.querySelector(".film-error").hidden = false;
    });
  el.querySelector("[data-film-replay]").addEventListener(
    "click",
    () => {
      video.currentTime = 0;
      play();
    },
    opts,
  );
  el.querySelectorAll("[data-film-seek]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        video.currentTime = +button.dataset.filmSeek;
        play();
      },
      opts,
    ),
  );
  video.addEventListener(
    "error",
    () => (el.querySelector(".film-error").hidden = false),
    opts,
  );
  video.addEventListener("play", stopExplore, opts);
  return () => {
    video.pause();
    abort.abort();
  };
}
