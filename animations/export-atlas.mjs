// Keep Manim snapshots numerically identical to the live, interactive models.
import { writeFile } from "node:fs/promises";
import { atlasTopics } from "../src/atlas-content.js";
import { atlasSceneConfigs, atlasSceneModel } from "../src/atlas-scenes.js";
const data = atlasTopics.map(t => {
  const c = atlasSceneConfigs[t.scene];
  return {id: t.id, title: t.title, scene: t.scene,
    parameter: {label: c.label, value: c.value},
    frames: Array.from({length: 5}, (_, i) => atlasSceneModel(t.scene, i, c.value))};
});
await writeFile(new URL("atlas-film-data.json", import.meta.url), JSON.stringify(data, null, 2) + "\n");
console.log(`Exported ${data.length} numerical Manim storyboards`);
