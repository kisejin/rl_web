import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import manifest from "../src/film-manifest.json" with { type: "json" };
import { visualChapters } from "../src/visuals.js";

test("every visual module has a real Manim film, poster, captions and render metadata", () => {
  assert.equal(manifest.renderer, "Manim Community");
  assert.equal(manifest.version, "0.22.1");
  assert.equal(manifest.films.length, 10);
  assert.deepEqual(
    manifest.films.map((f) => f.id).sort(),
    Object.keys(visualChapters).sort(),
  );
  for (const film of manifest.films) {
    const base = new URL(
      `../public/animations/manim/${film.id}`,
      import.meta.url,
    );
    const video = readFileSync(base.pathname + ".mp4");
    assert.equal(video.toString("ascii", 4, 8), "ftyp");
    assert.ok(video.length > 10000);
    const poster = readFileSync(base.pathname + ".jpg");
    assert.equal(poster[0], 0xff);
    assert.equal(poster[1], 0xd8);
    const captions = readFileSync(base.pathname + ".vtt", "utf8");
    assert.ok(captions.startsWith("WEBVTT"));
    assert.equal((captions.match(/ --> /g) || []).length, film.chapters.length);
    assert.ok(film.duration >= 16);
    assert.ok(film.chapters.length >= 4);
    assert.equal(film.chapters[0].time, 0);
    for (let i = 0; i < film.chapters.length; i++) {
      const cue = film.chapters[i],
        end = film.chapters[i + 1]?.time ?? film.duration;
      assert.ok(end - cue.time >= 3.95, `${film.id}: caption too brief`);
      assert.ok(cue.text.trim());
    }
    assert.deepEqual(
      JSON.parse(readFileSync(base.pathname + ".json", "utf8")),
      film,
    );
  }
});
