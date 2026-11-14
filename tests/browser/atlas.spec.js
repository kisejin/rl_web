import { test, expect } from "@playwright/test";
import { atlasTopics } from "../../src/atlas-content.js";
test("atlas map filters topics, keeps stable table-of-contents headings and links all requested resources", async ({
  page,
}) => {
  await page.goto("/#atlas");
  await expect(
    page.getByRole("heading", { name: "From first principles to Deep RL" }),
  ).toBeVisible();
  await expect(page.locator("[data-atlas-card]")).toHaveCount(35);
  await expect(page.locator(".atlas-sources a")).toHaveCount(5);
  await page
    .getByRole("searchbox", { name: "Search atlas topics" })
    .fill("PPO clipping");
  await expect(page.locator("[data-atlas-card]:visible")).toHaveCount(1);
  await expect(page.locator('[data-atlas-card="ppo"]')).toBeVisible();
  await page.getByRole("searchbox", { name: "Search atlas topics" }).fill("");
  await page
    .getByRole("combobox", { name: "Filter atlas track" })
    .selectOption("Continuous control");
  await expect(page.locator("[data-atlas-card]:visible")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Filter atlas track" })
    .selectOption("all");
  await expect(page.locator("[data-atlas-card]:visible")).toHaveCount(35);
  const targets = await page
    .locator(".doc-toc [data-doc-target]")
    .evaluateAll((links) => links.map((a) => a.dataset.docTarget));
  expect(
    await page.evaluate(
      (ids) => ids.every((id) => document.getElementById(id)),
      targets,
    ),
  ).toBeTruthy();
  await page.locator('[data-atlas-card="ppo"]').click();
  await expect(page).toHaveTitle(/PPO clipping/);
  await expect(page.locator('[data-atlas-scene="ppo"]')).toBeVisible();
});
test("all 35 topic routes render original formulas, proof steps and numerical animations without exceptions", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const topic of atlasTopics) {
    await page.goto("/#atlas/" + topic.id);
    await expect(page.locator("h1")).toHaveText(topic.title);
    await expect(page.locator(".atlas-formula")).toHaveCount(
      topic.equations.length,
    );
    await expect(page.locator("[data-atlas-scene]")).toHaveCount(1);
    await expect(page.locator(".katex-error")).toHaveCount(0);
    await page.getByRole("button", { name: "Next atlas frame" }).click();
    await expect(page.locator("[data-atlas-frame]")).toHaveText("2 / 5");
    await page.getByLabel("Atlas animation frame", { exact: true }).fill("4");
    await expect(
      page.getByRole("button", { name: "Next atlas frame" }),
    ).toBeDisabled();
    await expect(page.locator(".katex-error")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test("PPO parameter signs, proof reveal, knowledge checks and separate self-review persist", async ({
  page,
}) => {
  await page.goto("/#atlas/ppo");
  const label = "Advantage A (change its sign)";
  await page.getByRole("slider", { name: label, exact: true }).fill("-1");
  await page.getByLabel("Atlas animation frame", { exact: true }).fill("0");
  await expect(page.locator(".atlas-scene-metrics")).toContainText("-0.8");
  await expect(page.locator("[data-atlas-proof-step]:visible")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Reveal next derivation step" })
    .click();
  await expect(page.locator("[data-atlas-proof-step]:visible")).toHaveCount(2);
  await page.getByRole("button", { name: "Show full derivation" }).click();
  await expect(page.locator("[data-atlas-proof-step]:visible")).toHaveCount(3);
  await page
    .getByRole("radio", { name: "r above 1 + epsilon", exact: true })
    .check();
  await page.getByRole("button", { name: "Check reasoning" }).click();
  await expect(page.locator("[data-atlas-feedback]")).toContainText("Correct.");
  await page.getByRole("button", { name: "Mark as self-reviewed" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Reviewed ✓" })).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("rl-atlas-v1") || "{}").read || [],
    ),
  ).toEqual([]);
  await page.goto("/#atlas");
  await expect(page.locator(".atlas-review-summary")).toContainText("1 / 35");
});
test("animation pause, scrub, reduced-motion and navigation teardown do not reset or leak playback", async ({
  page,
}) => {
  await page.goto("/#atlas/bellman");
  await page.getByRole("button", { name: "Play atlas animation" }).click();
  await expect(page.locator("[data-atlas-frame]")).not.toHaveText("1 / 5");
  await page.getByRole("button", { name: "Pause atlas animation" }).click();
  const frame = await page.locator("[data-atlas-frame]").textContent();
  await page.waitForTimeout(700);
  await expect(page.locator("[data-atlas-frame]")).toHaveText(frame);
  await page.getByRole("button", { name: "Reset atlas animation" }).click();
  await expect(page.locator("[data-atlas-frame]")).toHaveText("1 / 5");
  await page.getByRole("button", { name: "Play atlas animation" }).click();
  await page.goto("/#atlas/sac");
  await page.waitForTimeout(300);
  await expect(page.locator("[data-atlas-frame]")).toHaveText("1 / 5");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Play atlas animation" }).click();
  await expect(page.locator("[data-atlas-frame]")).toHaveText("2 / 5");
  await page.waitForTimeout(300);
  await expect(page.locator("[data-atlas-frame]")).toHaveText("2 / 5");
});
test("advanced section-aware tutor and documentation search use the new authored curriculum", async ({
  page,
}) => {
  let request;
  await page.route("**/api/tutor", async (route) => {
    request = route.request().postDataJSON();
    await route.fulfill({
      json: {
        reply: "PPO clips a sampled objective, not every KL divergence.",
        model: "qwen3.8-flash",
      },
    });
  });
  await page.goto("/#atlas/ppo");
  await page.locator('[data-atlas-discuss="proof"] [data-tutor-topic]').click();
  await expect(page.locator("#tutor-lesson")).toHaveValue("atlas-ppo");
  await expect(page.locator("#tutor-section")).toHaveValue("proof");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain the negative advantage branch.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText("PPO clips");
  expect(request.lessonId).toBe("atlas-ppo");
  expect(request.sectionKey).toBe("proof");
  await page.getByRole("button", { name: "Close AI tutor" }).click();
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  await page.locator("#doc-search-dialog input").fill("Implicit Q-learning");
  await page.locator(".doc-search-results a").first().click();
  await expect(page).toHaveURL(/#atlas\/offline-iql/);
});
test("mobile mathematical content scrolls within its containers and keeps navigation and controls usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#atlas/rubric-grpo");
  await expect(page.locator("h1")).toContainText("GRPO");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  await expect(
    page.getByRole("button", { name: "Next atlas frame" }),
  ).toBeVisible();
  const svg = await page
    .locator(".atlas-svg-wrap")
    .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
  expect(svg.scroll).toBeGreaterThan(svg.width);
  await page.locator(".atlas-svg-wrap").evaluate((el) => (el.scrollLeft = 100));
  expect(
    await page.locator(".atlas-svg-wrap").evaluate((el) => el.scrollLeft),
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Show full derivation" }).click();
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await page.screenshot({ path: "/tmp/rl-atlas-mobile.png", fullPage: true });
});
