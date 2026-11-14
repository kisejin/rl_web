import katex from "katex";
import { uiIcon } from "./ui-icons.js";
import {
  atlasSceneConfigs,
  atlasSceneModel,
  sceneColors,
} from "./atlas-scenes.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (x) =>
  Math.abs(x) > 0 && Math.abs(x) < 0.001
    ? x.toExponential(2)
    : Number(x.toFixed(3)).toString();
export function atlasVisual(topic) {
  const c = atlasSceneConfigs[topic.scene];
  return `<section class="atlas-theater" data-atlas-scene="${topic.scene}" aria-label="${esc(topic.title)} animation"><div class="atlas-scene-heading"><span>MATHEMATICS IN MOTION</span><h2>Build the picture, then read the equation</h2><p>Original interactive vector animation · illustrative numerical model</p></div><div class="atlas-svg-wrap"><svg viewBox="0 0 720 345" role="img" aria-label="${esc(topic.title)} numerical diagram"></svg></div><p class="atlas-mobile-note">Scroll the diagram and long equations horizontally on a narrow screen.</p><div class="atlas-legend"></div><div class="atlas-scene-metrics"></div><div class="atlas-scene-equation"></div><p class="atlas-scene-caption" aria-live="polite"></p><p class="atlas-scene-note"></p><div class="atlas-transport"><button type="button" data-atlas-play aria-label="Play atlas animation">${uiIcon("play")} Play</button><button type="button" data-atlas-prev aria-label="Previous atlas frame">${uiIcon("arrow-left")}</button><button type="button" data-atlas-next aria-label="Next atlas frame">${uiIcon("arrow-right")}</button><button type="button" data-atlas-reset aria-label="Reset atlas animation">${uiIcon("reset")} Reset</button></div><div class="atlas-sliders"><label>${esc(c.label)}<output data-atlas-value></output><input type="range" data-atlas-parameter aria-label="${esc(c.label)}" min="${c.min}" max="${c.max}" step="${topic.scene === "evaluation" ? 1 : topic.scene === "trpo" ? 0.005 : 0.01}" value="${c.value}"></label><label>Concept timeline<output data-atlas-frame></output><input type="range" data-atlas-timeline aria-label="Atlas animation frame" min="0" max="4" step="1" value="0"></label></div><p class="atlas-motion-note">Use Play, step buttons, arrow keys on sliders, or drag the timeline. Change the parameter to test the mathematics.</p></section>`;
}
function network(m) {
  const n = m.network;
  if (n.kind === "fork")
    return `<path d="M185 168 Q340 50 505 85M185 168 Q340 285 505 245" fill="none" stroke="#617793" stroke-width="2"/><text x="310" y="76" fill="${sceneColors[1]}" font-size="15">p = ${fmt(n.p)}</text><text x="300" y="270" fill="${sceneColors[2]}" font-size="15">1 − p = ${fmt(1 - n.p)}</text>${[
      [155, 168, "State s", sceneColors[0]],
      [545, 85, "Reward 10", sceneColors[1]],
      [545, 245, "Reward 2", sceneColors[2]],
    ]
      .map(
        ([x, y, text, c]) =>
          `<circle cx="${x}" cy="${y}" r="42" fill="#152238" stroke="${c}" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="${c}" font-size="14">${text}</text>`,
      )
      .join(
        "",
      )}<text x="155" y="235" text-anchor="middle" fill="#b4c2d7" font-size="13">fixed action a</text><circle cx="${185 + 310 * (m.frame / 4)}" cy="${168 - 83 * (m.frame / 4)}" r="5" fill="${sceneColors[1]}"/>`;
  return `<text x="360" y="55" text-anchor="middle" fill="#b4c2d7" font-size="15">One edge per synchronous sweep</text>${n.values
    .map((value, i) => {
      const x = 90 + i * 135;
      return `${i < 4 ? `<path d="M${x + 30} 170h75m-8-5 8 5-8 5" stroke="#617793" fill="none" stroke-width="2"/>` : ""}<circle cx="${x}" cy="170" r="32" stroke="${i === 4 ? sceneColors[2] : value ? sceneColors[1] : sceneColors[0]}" fill="#152238" stroke-width="2"/><text x="${x}" y="175" fill="#eff6ff" text-anchor="middle" font-size="14">${i === 4 ? "goal" : "s" + i}</text><text x="${x}" y="232" fill="${sceneColors[1]}" text-anchor="middle" font-size="18">V=${fmt(value)}</text>`;
    })
    .join(
      "",
    )}<text x="560" y="126" fill="${sceneColors[2]}" font-size="14">reward +10 →</text>`;
}
function diagram(m) {
  if (m.network) return network(m);
  const left = 68,
    right = 680,
    top = 28,
    bottom = 278;
  let xRange = m.x || [0, Math.max(1, m.bars.length)],
    yRange = m.y;
  if (!yRange) {
    const values = m.bars.map((b) => b.value),
      min = Math.min(0, ...values),
      max = Math.max(0.1, ...values);
    const pad = Math.max(0.12, (max - min) * 0.16);
    yRange = [min < 0 ? min - pad : 0, max + pad];
  }
  const X = (x) =>
      left + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (right - left),
    Y = (y) =>
      bottom - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (bottom - top),
    zero = Y(Math.max(yRange[0], Math.min(yRange[1], 0)));
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const value = yRange[0] + ((yRange[1] - yRange[0]) * i) / 4,
      y = Y(value);
    grid += `<path d="M${left} ${y}H${right}" stroke="#26384f"/><text x="${left - 10}" y="${y + 4}" text-anchor="end" fill="#a6b9d1" font-size="12">${fmt(value)}</text>`;
  }
  grid += `<path d="M${left} ${top}V${bottom}H${right}" fill="none" stroke="#657b95"/><path d="M${left} ${zero}H${right}" stroke="#657b95"/>`;
  if (m.bars.length) {
    const width = (right - left) / m.bars.length;
    grid += m.bars
      .map((b, i) => {
        const y = Y(b.value),
          h = Math.max(1, Math.abs(zero - y)),
          x = left + i * width + width * 0.18,
          opacity = Math.min(1, 0.2 + Math.max(0, m.frame - i * 0.45) * 0.8);
        return `<rect x="${x}" y="${Math.min(y, zero)}" width="${width * 0.64}" height="${h}" rx="3" fill="${b.color}" opacity="${opacity}"/><text x="${x + width * 0.32}" y="${b.value >= 0 ? y - 8 : y + 17}" fill="${b.color}" text-anchor="middle" font-size="14">${fmt(b.value)}</text><text x="${x + width * 0.32}" y="${bottom + 24}" fill="#d7e4f6" text-anchor="middle" font-size="12">${esc(b.name)}</text>`;
      })
      .join("");
  }
  for (const plot of m.plots)
    grid += `<path d="${plot.points.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(2)} ${Y(y).toFixed(2)}`).join(" ")}" stroke="${plot.color}" stroke-width="2.5" fill="none"/>`;
  if (m.plots.length)
    for (let i = 0; i <= 4; i++) {
      const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / 4;
      grid += `<text x="${X(x)}" y="${bottom + 22}" text-anchor="middle" fill="#a6b9d1" font-size="12">${fmt(x)}</text>`;
    }
  for (const point of m.points)
    grid += `<circle cx="${X(point.x)}" cy="${Y(point.y)}" r="6" fill="${point.color}" stroke="#0c1524" stroke-width="2"/>`;
  if (m.interval) {
    const a = m.interval,
      x = X(a.x),
      lo = Y(a.low),
      hi = Y(a.high);
    grid += `<path d="M${x} ${lo}V${hi}M${x - 7} ${lo}h14M${x - 7} ${hi}h14" stroke="${sceneColors[2]}" stroke-width="3"/>`;
  }
  grid += `<text x="${(left + right) / 2}" y="337" text-anchor="middle" fill="#d7e4f6" font-size="13">${esc(m.xLabel)}</text><text x="14" y="18" fill="#d7e4f6" font-size="12">${esc(m.yLabel)}</text>`;
  return grid;
}
export function mountAtlasVisuals(root = document) {
  const disposers = [];
  for (const host of root.querySelectorAll("[data-atlas-scene]")) {
    const id = host.dataset.atlasScene,
      c = atlasSceneConfigs[id],
      parameter = host.querySelector("[data-atlas-parameter]"),
      timeline = host.querySelector("[data-atlas-timeline]"),
      play = host.querySelector("[data-atlas-play]");
    let frame = 0,
      raf = 0,
      last = 0,
      playing = false,
      disposed = false;
    const events = new AbortController(),
      options = { signal: events.signal };
    function draw() {
      const m = atlasSceneModel(id, frame, Number(parameter.value));
      host.querySelector("svg").innerHTML = diagram(m);
      host.querySelector("[data-atlas-value]").textContent = fmt(m.parameter);
      host.querySelector("[data-atlas-frame]").textContent =
        `${Math.floor(frame) + 1} / 5`;
      timeline.value = String(Math.floor(frame));
      host.querySelector(".atlas-scene-caption").textContent = m.caption;
      host.querySelector(".atlas-scene-note").textContent = m.note;
      host.querySelector(".atlas-scene-metrics").innerHTML = m.metrics
        .map(
          (v) =>
            `<div><span>${esc(v.name)}</span><strong>${esc(fmt(v.value))}</strong></div>`,
        )
        .join("");
      host.querySelector(".atlas-scene-equation").innerHTML =
        katex.renderToString(m.tex, { displayMode: true, throwOnError: false });
      host.querySelector(".atlas-legend").innerHTML = m.plots
        .map(
          (p) =>
            `<span><i style="background:${p.color}"></i>${esc(p.name)}</span>`,
        )
        .join("");
      host.querySelector("[data-atlas-prev]").disabled = frame <= 0;
      host.querySelector("[data-atlas-next]").disabled = frame >= 4;
    }
    function pause() {
      playing = false;
      cancelAnimationFrame(raf);
      raf = 0;
      play.setAttribute("aria-label", "Play atlas animation");
      play.innerHTML = uiIcon("play") + " Play";
    }
    function tick(now) {
      if (!playing || disposed) return;
      if (last) frame = Math.min(4, frame + (now - last) / 1450);
      last = now;
      draw();
      if (frame >= 4) pause();
      else raf = requestAnimationFrame(tick);
    }
    play.addEventListener(
      "click",
      () => {
        if (playing) {
          pause();
          return;
        }
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
          frame = frame >= 4 ? 0 : Math.min(4, Math.floor(frame) + 1);
          draw();
          return;
        }
        if (frame >= 4) frame = 0;
        playing = true;
        last = 0;
        play.setAttribute("aria-label", "Pause atlas animation");
        play.innerHTML = uiIcon("pause") + " Pause";
        raf = requestAnimationFrame(tick);
      },
      options,
    );
    host.querySelector("[data-atlas-prev]").addEventListener(
      "click",
      () => {
        pause();
        frame = Math.max(0, Math.ceil(frame) - 1);
        draw();
      },
      options,
    );
    host.querySelector("[data-atlas-next]").addEventListener(
      "click",
      () => {
        pause();
        frame = Math.min(4, Math.floor(frame) + 1);
        draw();
      },
      options,
    );
    host.querySelector("[data-atlas-reset]").addEventListener(
      "click",
      () => {
        pause();
        frame = 0;
        parameter.value = String(c.value);
        draw();
      },
      options,
    );
    parameter.addEventListener("input", draw, options);
    timeline.addEventListener(
      "input",
      () => {
        pause();
        frame = Number(timeline.value);
        draw();
      },
      options,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) pause();
      },
      options,
    );
    draw();
    disposers.push(() => {
      disposed = true;
      pause();
      events.abort();
    });
  }
  return () => disposers.forEach((dispose) => dispose());
}
