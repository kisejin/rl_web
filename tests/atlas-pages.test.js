import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { atlasTopics } from "../src/atlas-content.js";
import { atlasOverview, atlasTopicView } from "../src/atlas-pages.js";
import { atlasSceneConfigs, atlasSceneModel } from "../src/atlas-scenes.js";
import manifest from "../src/atlas-film-manifest.json" with { type: "json" };

const data = JSON.parse(readFileSync(new URL("../animations/atlas-film-data.json",import.meta.url)));
test("independent atlas articles connect prerequisites, adjacent lessons and Python labs with canonical URLs", () => {
  const map = load(atlasOverview());
  assert.equal(map('[data-atlas-card]').length, atlasTopics.length);
  for (let i = 0; i < atlasTopics.length; i++) {
    const topic = atlasTopics[i];
    const $ = load(atlasTopicView(topic.id));
    assert.equal($('h1').text(), topic.title);
    assert.equal($('[data-atlas-film]').attr('data-atlas-film'), topic.id);
    assert.equal($('.atlas-formula').length, topic.equations.length);
    assert.equal($('.atlas-back').attr('href'), '/atlas/');
    for (const id of topic.prerequisites)
      assert.ok($(`.atlas-prerequisites a[href="/atlas/${id}/"]`).length);
    if(i) assert.ok($(`.atlas-topic-pagination a[href="/atlas/${atlasTopics[i-1].id}/"]`).length);
    assert.ok($('[data-atlas-lab][href^="/lab.html#"]').length);
    assert.equal($('a[href^="#atlas"]').length, 0);
  }
});
test("every atlas topic has an actual Manim film with readable captions and a reproducible mathematical storyboard", () => {
  assert.equal(manifest.renderer,'Manim Community');
  assert.deepEqual(manifest.films.map(t=>t.id),atlasTopics.map(t=>t.id));
  for(const film of manifest.films) {
    const t = atlasTopics.find(t=>t.id===film.id);
    const c = atlasSceneConfigs[t.scene];
    const exported = data.find(d=>d.id===film.id);
    assert.deepEqual(exported.frames,JSON.parse(JSON.stringify(Array.from({length:5},(_,i)=>atlasSceneModel(t.scene,i,c.value)))));
    const base = new URL(`../public/animations/atlas-manim/${film.id}`,import.meta.url).pathname;
    assert.equal(readFileSync(base+'.mp4').toString('ascii',4,8),'ftyp');
    assert.deepEqual([...readFileSync(base+'.jpg').slice(0,2)],[255,216]);
    assert.ok(readFileSync(base+'.vtt','utf8').startsWith('WEBVTT'));
    assert.deepEqual(JSON.parse(readFileSync(base+'.json','utf8')),film);
    assert.equal(film.chapters.length,5);
    assert.ok(film.duration>=19.8);
    for(let i=0;i<5;i++) assert.ok((film.chapters[i+1]?.time??film.duration)-film.chapters[i].time>=3.95);
  }
});
