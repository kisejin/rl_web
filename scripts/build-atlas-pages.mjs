// Actual standalone HTML pages: readable and linkable before client hydration.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { atlasTopics } from "../src/atlas-content.js";
import { atlasOverview, atlasTopicView, atlasStages } from "../src/atlas-pages.js";
const template = await readFile("dist/index.html", "utf8");
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages = [{id: null, title: "RL & Deep RL atlas", summary: "35 individual visual lessons, from probability and Bellman equations to PPO, offline RL and rubric-based rewards."}, ...atlasTopics];
for (const topic of pages) {
  const route = "/atlas/" + (topic.id ? topic.id + "/" : "");
  const title = topic.title + " — RL Atlas";
  const nav = atlasStages.map(stage => `<div class="nav-section">${esc(stage)}</div>${atlasTopics.filter(t => t.stage === stage).map(t => `<a class="lesson-link${t.id === topic.id ? " active" : ""}" href="/atlas/${t.id}/" ${t.id === topic.id ? 'aria-current="page"' : ''}>${esc(t.title)}</a>`).join("")}`).join("");
  // Without JavaScript, the whole derivation and video controls remain usable.
  const body = `<div class="app-shell"><aside class="sidebar"><a class="brand" href="/#home">RL Atlas</a><a class="side-home" href="/atlas/">RL & Deep RL atlas</a><nav class="lesson-nav" aria-label="Atlas topics">${nav}</nav></aside><div class="main-shell"><header class="topbar"><div class="breadcrumb"><a href="/atlas/">Atlas</a> / ${esc(topic.title)}</div></header><div class="page-wrap"><main id="main-content">${topic.id ? atlasTopicView(topic.id) : atlasOverview()}</main></div></div></div><noscript><style>[data-atlas-proof-step][hidden]{display:list-item!important}.atlas-proof-controls,.atlas-review,.atlas-filter,[data-atlas-check] button,.atlas-transport,.atlas-sliders{display:none!important}</style><p>Enable JavaScript for the live parameter controls, quizzes, search and lesson chatbot. All equations, proofs and Manim films are available above.</p></noscript>`;
  const html = template.replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/s, `<meta name="description" content="${esc(topic.summary)}" />`)
    .replace("</head>", `<link rel="canonical" href="https://rlatlas.vercel.app${route}" /><meta property="og:title" content="${esc(title)}" /><meta property="og:description" content="${esc(topic.summary)}" /><meta property="og:url" content="https://rlatlas.vercel.app${route}" /></head>`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
  const dir = `dist${route}`;
  await mkdir(dir, {recursive: true});
  await writeFile(dir + "index.html", html);
}
await writeFile("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://rlatlas.vercel.app/</loc></url>${pages.map(t => `<url><loc>https://rlatlas.vercel.app/atlas/${t.id ? t.id + '/' : ''}</loc></url>`).join("")}</urlset>\n`);
console.log(`Generated ${pages.length} standalone atlas pages and sitemap.xml`);
