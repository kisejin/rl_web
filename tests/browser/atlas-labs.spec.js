import { test, expect } from "@playwright/test";
import { atlasTopics } from "../../src/atlas-content.js";
import { labs } from "../../src/content.js";
test("every atlas topic links to its matching lab and a rendered mathematical editorial", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const topic of atlasTopics) {
    await page.goto("/#atlas/" + topic.id);
    const lab = labs.find((l) => l.atlasTopic === topic.id);
    await expect(
      page.locator(`[data-atlas-lab][href="/lab.html#${lab.id}"]`),
    ).toBeVisible();
    await page.locator(`[data-atlas-lab][href="/lab.html#${lab.id}"]`).click();
    await expect(page.locator(".lab-page-title h1")).toHaveText(lab.title);
    await expect(page.locator(".lc-theory-bridge a")).toHaveAttribute(
      "href",
      "/atlas/" + topic.id + "/",
    );
    await page.getByRole("tab", { name: "Editorial", exact: true }).click();
    await expect(page.locator(".lc-proof-editorial li")).toHaveCount(
      lab.proofSteps.length,
    );
    await expect(page.locator(".lc-proof-editorial .katex-error")).toHaveCount(
      0,
    );
  }
  expect(errors).toEqual([]);
});
test("new PPO hybrid lab saves code and proof as separate completion requirements", async ({
  page,
}) => {
  const lab = labs.find((l) => l.id === "atlas-ppo");
  await page.goto("/lab.html#" + lab.id);
  await page.locator("#code-editor").fill(lab.solution);
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator(".test-summary")).toContainText("Proof required");
  await expect(page.locator(".lab-solved")).toBeEmpty();
  await page.getByRole("tab", { name: "Description", exact: true }).click();
  await page
    .locator("#proof-input")
    .fill(
      "For positive advantage, min picks the upper clipped branch only above the upper bound. For negative advantage the inequality reverses, making the lower branch flat. Use dr/dlog(r)=r and average over N.",
    );
  await page.locator(".proof-rubric summary").click();
  for (let i = 0; i < lab.checks.length; i++)
    await page.locator(`[data-proof-check="${i}"]`).check();
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator(".test-summary")).toContainText("Accepted");
  await page.reload();
  await expect(page.locator(".lab-solved")).toContainText("Solved");
  await page.locator("#proof-input").fill("too short");
  await expect(page.locator(".lab-solved")).toBeEmpty();
});
test("advanced lab tutor retains its own exercise and mobile editorial keeps formulas contained", async ({
  page,
}) => {
  let request;
  await page.route("**/api/tutor", async (route) => {
    request = route.request().postDataJSON();
    await route.fulfill({
      json: {
        reply: "Keep all mass when the projected C51 bin is an integer.",
        model: "qwen3.8-flash",
      },
    });
  });
  await page.goto("/lab.html#atlas-distributional");
  await page
    .getByRole("button", { name: "Open AI study tutor", exact: true })
    .click();
  await expect(page.locator("#tutor-lesson")).toHaveValue(
    "atlas-distributional",
  );
  await expect(page.locator("#tutor-section")).toHaveValue("lab");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Why is an exact atom an edge case?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText("C51");
  expect(request.labId).toBe("atlas-distributional");
  expect(request.sectionKey).toBe("lab");
  expect(request.lessonId).toBe("atlas-distributional");
  await page.getByRole("button", { name: "Close AI tutor" }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole("tab", { name: "Editorial", exact: true }).click();
  await expect(page.locator(".lc-proof-editorial")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await page.screenshot({ path: "/tmp/rl-proof-lab-mobile.png" });
});
