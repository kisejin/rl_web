import { test, expect } from "@playwright/test";
const answer =
  'Use the triangle inequality.\n\n\\[\\lVert T V-T W\\rVert_\\infty \\leq \\gamma\\lVert V-W\\rVert_\\infty\\]\n\n```python\nvalue = reward + gamma * next_value\n```\n\n<img src=x onerror="window.tutorXss=true"><script>window.tutorXss=true</script>';
test("section tutor sends only lesson context and renders safe Markdown, code and LaTeX", async ({
  page,
}) => {
  let request;
  await page.route("**/api/tutor", async (route) => {
    request = route.request().postDataJSON();
    expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({ json: { reply: answer, model: "test-model" } });
  });
  await page.goto("/#lesson/bellman");
  await page.locator('[data-tutor-topic="proof"]').click();
  await expect(page.locator("#tutor-section")).toHaveValue("proof");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Why is gamma less than one needed?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "triangle inequality",
  );
  expect(request.lessonId).toBe("bellman");
  expect(request.sectionKey).toBe("proof");
  expect(Object.keys(request).sort()).toEqual([
    "lessonId",
    "messages",
    "model",
    "sectionKey",
  ]);
  await expect(page.locator(".tutor-assistant .katex-display")).toHaveCount(1);
  await expect(page.locator(".tutor-assistant pre code")).toContainText(
    "gamma",
  );
  await expect(
    page.locator(".tutor-assistant img,.tutor-assistant script"),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.tutorXss)).toBeUndefined();
  expect(
    JSON.parse(
      (await page.evaluate(() => localStorage.getItem("rl-atlas-v1"))) || "{}",
    ).read || [],
  ).toEqual([]);
});
test("tutor preserves questions on failure and retries without duplicating history", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/tutor", (route) =>
    route.fulfill(
      ++calls === 1
        ? { status: 429, json: { error: "Please wait before retrying." } }
        : { json: { reply: "The discount weights future rewards." } },
    ),
  );
  await page.goto("/#lesson/foundations");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("Explain discounting.");
  await input.press("Enter");
  await expect(page.locator(".tutor-error")).toContainText("Please wait");
  await expect(input).toHaveValue("Explain discounting.");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "weights future rewards",
  );
  await expect(page.locator(".tutor-user")).toHaveCount(1);
});
test("tutor lets the learner stop a pending response and edit the question", async ({
  page,
}) => {
  await page.route("**/api/tutor", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      await route.fulfill({ json: { reply: "A delayed response." } });
    } catch {}
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("Help me with the proof.");
  await input.press("Enter");
  await expect(page.locator(".tutor-thinking")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Tutor model", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(input).toBeEnabled();
  await expect(
    page.getByRole("combobox", { name: "Tutor model", exact: true }),
  ).toBeEnabled();
  await expect(input).toHaveValue("Help me with the proof.");
  await expect(page.locator(".tutor-error")).toContainText("stopped");
  await expect(page.locator(".tutor-assistant")).toHaveCount(0);
});
test("section conversations survive reloads and remain separate, with a working clear action", async ({
  page,
}) => {
  await page.route("**/api/tutor", (route) =>
    route.fulfill({ json: { reply: "This is the overview conversation." } }),
  );
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain this lesson.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "overview conversation",
  );
  await page.getByLabel("Tutor section", { exact: true }).selectOption("proof");
  await expect(page.locator(".tutor-assistant")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "overview conversation",
  );
  await page.getByRole("button", { name: "Clear this conversation" }).click();
  await expect(page.locator(".tutor-assistant")).toHaveCount(0);
  await expect(page.locator(".tutor-empty")).toBeVisible();
});
test("mobile tutor fits a standalone Python lab and sends its lab context", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  let request;
  await page.route("**/api/tutor", (route) => {
    request = route.request().postDataJSON();
    return route.fulfill({
      json: { reply: "Validate every score before applying the gate." },
    });
  });
  await page.goto("/lab.html#rubric");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator("#tutor-section")).toHaveValue("lab");
  await expect(page.locator("#tutor-lesson")).toHaveValue("rubric");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Give me a hint.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "Validate every score",
  );
  expect(request.labId).toBe("rubric");
  const box = await page.locator("#study-tutor").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Close AI tutor" }).click();
  await expect(page.locator("#study-tutor")).not.toBeVisible();
  await page.locator('[data-lc-mobile="code"]').click();
  await expect(page.locator("#code-editor")).toBeVisible();
});
test("changing lessons updates the open tutor without mixing conversations", async ({
  page,
}) => {
  await page.goto("/#lesson/foundations");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator("#tutor-lesson")).toHaveValue("foundations");
  await page.evaluate(() => {
    location.hash = "lesson/bellman";
  });
  await expect(page.locator("#study-tutor")).toBeVisible();
  await expect(page.locator("#tutor-lesson")).toHaveValue("bellman");
  await expect(page.locator(".tutor-user")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator("#study-tutor")).not.toBeVisible();
});

test("a stalled tutor request times out with an editable question", async ({
  page,
}) => {
  await page.clock.install();
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/tutor", async (route) => {
    await pending;
    try {
      await route.fulfill({ json: { reply: "Too late." } });
    } catch {}
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("Explain this proof.");
  await input.press("Enter");
  await expect(page.locator(".tutor-thinking")).toBeVisible();
  await page.clock.fastForward(56000);
  await expect(page.locator(".tutor-error")).toContainText("too long");
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("Explain this proof.");
  release();
});

test("tutor offers all requested models, sends the selected ID and attributes each reply", async ({
  page,
}) => {
  const { tutorModels } = await import("../../src/tutor-models.js");
  const requests = [];
  await page.route("**/api/tutor", (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    expect(route.request().headers().authorization).toBeUndefined();
    return route.fulfill({
      json: { reply: "Answer using " + body.model, model: body.model },
    });
  });
  await page.goto("/#lesson/bellman");
  await page.locator('[data-tutor-topic="proof"]').click();
  const select = page.getByRole("combobox", {
    name: "Tutor model",
    exact: true,
  });
  await expect(select).toHaveValue("qwen3.8-flash");
  await expect(select.locator("option")).toHaveCount(13);
  expect(await select.locator("option").allTextContents()).toEqual(
    tutorModels.map((m) => m.name),
  );
  for (const model of tutorModels) {
    await select.selectOption(model.id);
    await page
      .getByRole("textbox", { name: "Your question about this lesson" })
      .fill("Explain this step.");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.locator(".tutor-assistant").last()).toContainText(
      "Answer using " + model.id,
    );
    await expect(
      page.locator(".tutor-assistant .tutor-speaker").last(),
    ).toContainText(model.name);
    expect(requests.at(-1).model).toBe(model.id);
    expect(requests.at(-1).lessonId).toBe("bellman");
    expect(requests.at(-1).sectionKey).toBe("proof");
  }
  expect(requests).toHaveLength(13);
});

test("model preference survives reload and lab navigation without relabeling earlier answers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  let lastRequest;
  await page.route("**/api/tutor", (route) => {
    lastRequest = route.request().postDataJSON();
    return route.fulfill({
      json: {
        reply: "A saved model-specific answer.",
        model: lastRequest.model,
      },
    });
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const select = page.getByRole("combobox", {
    name: "Tutor model",
    exact: true,
  });
  await select.selectOption("claude-haiku-5-5");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Help with this lesson.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant .tutor-speaker")).toContainText(
    "Claude Haiku 5.5",
  );
  await select.selectOption("qwen3.8-max");
  await expect(page.locator(".tutor-assistant .tutor-speaker")).toContainText(
    "Claude Haiku 5.5",
  );
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(select).toHaveValue("qwen3.8-max");
  await expect(page.locator(".tutor-assistant .tutor-speaker")).toContainText(
    "Claude Haiku 5.5",
  );
  const bounds = await page.locator("#study-tutor").boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.goto("/lab.html#rubric");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(select).toHaveValue("qwen3.8-max");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Give me a lab hint.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "saved model-specific",
  );
  expect(lastRequest.model).toBe("qwen3.8-max");
  expect(lastRequest.labId).toBe("rubric");
});
