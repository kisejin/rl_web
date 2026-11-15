import manifest from "./atlas-film-manifest.json" with { type: "json" };
import { mountFilm } from "./films.js";
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
export function atlasFilmPlayer(id) {
  const film = manifest.films.find(f => f.id === id);
  if (!film) return "";
  const path = `/animations/atlas-manim/${id}`;
  return `<section class="atlas-film" data-atlas-film="${id}" aria-label="Manim visual explanation"><div class="atlas-film-heading"><span class="doc-page-tag">MANIM · A VISUAL EXPLANATION</span><h2 id="atlas-film-heading">Watch the mathematics unfold</h2><p>Follow this fixed numerical example, then experiment with the interactive model below.</p></div><div class="film-panel" data-film-panel>
  <video class="manim-film" controls playsinline preload="none" poster="${path}.jpg" aria-label="Manim animation: ${esc(film.title)}"><source src="${path}.mp4" type="video/mp4"><track kind="captions" src="${path}.vtt" srclang="en" label="English" default>Your browser does not support video. <a href="${path}.mp4">Open the film</a>.</video>
  <div class="film-utilities"><span class="film-engine">Rendered with <a href="https://www.manim.community/" target="_blank" rel="noopener">Manim Community</a></span><label>Speed <select data-film-speed aria-label="Animation playback speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><button type="button" data-film-replay aria-label="Replay Manim animation">↺ Replay</button><span>${stamp(film.duration)}</span></div>
  <p class="film-intro">Original mathematical animation, inspired by the visual teaching approach of 3Blue1Brown. English captions and a transcript are available. This film illustrates a model; it is not a training run.</p>
  <p class="film-error" role="status" hidden>Could not load this film. <a href="${path}.mp4">Open the video directly</a> or use the interactive model below.</p>
  <details class="film-transcript"><summary>Read the animation transcript</summary><ol>${film.chapters.map(c => `<li><button type="button" data-film-seek="${c.time}" aria-label="Jump to ${stamp(c.time)}">${stamp(c.time)}</button><p>${esc(c.text)}</p></li>`).join("")}</ol></details></div></section>`;
}
export function mountAtlasFilms(root = document) {
  const controller = new AbortController();
  const cleanups = [...root.querySelectorAll("[data-atlas-film]")].map(el => {
    const article = el.closest(".atlas-topic");
    const video = el.querySelector("video");
    article.querySelector("[data-atlas-play]")?.addEventListener("click", (event) => {
      // Capture the intent before the live model changes its button label.
      // A programmatic pause from video.play must not pause the video itself.
      if (event.currentTarget.getAttribute("aria-label") === "Play atlas animation") video.pause();
    }, {signal: controller.signal, capture: true});
    return mountFilm(el, () => {
      const play = article.querySelector('[aria-label="Pause atlas animation"]');
      if (play) play.click();
    });
  });
  return () => { controller.abort(); cleanups.forEach(clean => clean()); };
}
