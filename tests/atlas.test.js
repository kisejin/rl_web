import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { atlasTopics } from "../src/atlas-content.js";
import { atlasSources } from "../src/atlas-sources.js";
import { atlasSceneConfigs, atlasSceneModel } from "../src/atlas-scenes.js";
import { tutorContext, tutorLessonCatalog } from "../src/tutor-context.js";
import { searchCourse } from "../server/tutor-mcp.js";
const close = (x, y, tol = 1e-8) =>
  assert.ok(Math.abs(x - y) < tol, `${x} != ${y}`);
test("35 sourced topics have original derivations, checks and valid mathematics at every scene endpoint", () => {
  assert.equal(atlasTopics.length, 35);
  assert.equal(new Set(atlasTopics.map((t) => t.id)).size, atlasTopics.length);
  const visit = (id, path = []) => {
    assert.ok(!path.includes(id), "cyclic prerequisite");
    const topic = atlasTopics.find((t) => t.id === id);
    assert.ok(topic, "unknown prerequisite");
    for (const p of topic.prerequisites) visit(p, [...path, id]);
  };
  for (const topic of atlasTopics) {
    visit(topic.id);
    assert.ok(topic.equations.length >= 4);
    assert.ok(topic.derivation.steps.length >= 3);
    assert.ok(topic.assumptions.length && topic.pitfall && topic.example);
    assert.ok(topic.check.options[topic.check.correct]);
    for (const source of topic.sources) assert.ok(atlasSources[source]);
    for (const item of [...topic.equations, ...topic.derivation.steps])
      assert.doesNotThrow(
        () => katex.renderToString(item.tex, { throwOnError: true }),
        topic.id,
      );
    const config = atlasSceneConfigs[topic.scene];
    assert.ok(config);
    for (const p of [config.min, config.value, config.max])
      for (const frame of [0, 1, 2, 2.5, 3, 4]) {
        const model = atlasSceneModel(topic.scene, frame, p);
        const finite = (x) => {
          if (typeof x === "number") assert.ok(Number.isFinite(x), topic.id);
          else if (Array.isArray(x)) x.forEach(finite);
          else if (x && typeof x === "object") Object.values(x).forEach(finite);
        };
        finite(model);
        assert.doesNotThrow(
          () => katex.renderToString(model.tex, { throwOnError: true }),
          topic.id + " scene",
        );
      }
  }
});
test("Bellman gaps, dynamic-programming propagation, GAE and gradient stability use the actual equations", () => {
  for (const g of [0.2, 0.75, 0.95])
    for (let k = 1; k <= 4; k++)
      close(
        atlasSceneModel("bellman", k, g).metrics[0].value,
        g * atlasSceneModel("bellman", k - 1, g).metrics[0].value,
      );
  close(atlasSceneModel("dp", 3, 0.5).network.values[0], 0);
  close(atlasSceneModel("dp", 4, 0.5).network.values[0], 1.25);
  close(atlasSceneModel("gae", 4, 0.5).metrics[1].value, 1.271125);
  const first = atlasSceneModel("approximation", 1, 1.5).metrics[1].value,
    second = atlasSceneModel("approximation", 2, 1.5).metrics[1].value;
  assert.ok(first > 2 && second < 2);
});
test("C51 preserves probability and unclipped expectation including integer-support edge cases", () => {
  for (const p of [0, 0.3, 1, 1.3, 2, 3.99, 4]) {
    const m = atlasSceneModel("c51", 4, p);
    close(
      m.bars.reduce((s, b) => s + b.value, 0),
      1,
    );
    close(
      m.bars.reduce((s, b, i) => s + i * b.value, 0),
      p,
    );
  }
});
test("PPO clipping switches sides with the advantage sign; entropy and KL optima are consistent", () => {
  const negLow = atlasSceneModel("ppo", 0, -1);
  close(negLow.metrics[2].value, -0.8);
  const posHigh = atlasSceneModel("ppo", 4, 1);
  close(posHigh.metrics[2].value, 1.2);
  for (const alpha of [0.05, 0.6, 2]) {
    const sac = atlasSceneModel("sac", 4, alpha);
    close(sac.metrics[0].value, sac.metrics[1].value);
    close(
      sac.bars.reduce((s, b) => s + b.value, 0),
      1,
    );
  }
  for (const beta of [0.1, 0.6, 2]) {
    const m = atlasSceneModel("rlhf", 4, beta);
    close(
      m.bars.reduce((s, b) => s + b.value, 0),
      1,
    );
    assert.ok(m.metrics[1].value >= 0);
    assert.ok(m.metrics[2].value >= 0.5 - 1e-8);
  }
});
test("importance correction, expectiles, shaping, group baselines and local trust budgets satisfy invariants", () => {
  for (const p of [0, 0.5, 1])
    close(atlasSceneModel("per", 4, p).metrics[0].value, 7 / 3);
  for (const tau of [0.1, 0.5, 0.8])
    close(atlasSceneModel("iql", 4, tau).metrics[1].value, 2 * tau);
  for (const gamma of [0.1, 0.5, 0.95])
    close(atlasSceneModel("shaping", 4, gamma).metrics[2].value, -3);
  close(atlasSceneModel("grpo", 0, 0).metrics[1].value, 0);
  for (const p of [0, 0.2, 0.5])
    for (const k of [0, 2, 4])
      close(atlasSceneModel("grpo", k, p).metrics[2].value, 0);
  for (const delta of [0.005, 0.08, 0.3])
    close(atlasSceneModel("trpo", 4, delta).metrics[0].value, delta);
});
test("advanced topics are available in section-aware tutoring and real MCP course search", () => {
  assert.equal(tutorLessonCatalog.length, 45);
  const context = tutorContext({ lessonId: "atlas-ppo", sectionKey: "proof" });
  assert.ok(context);
  assert.equal(context.link, "/atlas/ppo/");
  assert.match(JSON.stringify(context.material), /clipped/);
  assert.ok(context.material.references.length);
  assert.equal(tutorContext({ lessonId: "atlas-missing" }), null);
  assert.equal(tutorContext({ lessonId: "atlas-ppo", labId: "return" }), null);
  assert.ok(
    searchCourse("implicit expectile").some(
      (r) =>
        r.lessonId === "atlas-offline-iql" && r.url === "/atlas/offline-iql/",
    ),
  );
});
