import { test, expect } from "@playwright/test";
const now = new Date().toISOString();
const first = {
  id: "2611.12345",
  title: "Verified RL with $A_t$",
  abstract: String.raw`The authors optimize $J(\theta)$ with \(0<x<1\). $$L=\mathbb E[r_t A_t].$$ \begin{align}a&=b\\c&=d\end{align}`,
  authors: ["A. Author"],
  publishedAt: now,
  firstSeenAt: now,
  topics: ["rl", "rlvr"],
  sources: ["arxiv"],
  summary: {
    kind: "ai",
    model: "gemini-3.8-flash",
    overview: String.raw`Use \(\pi_\theta\) and $A_t$.`,
    method: String.raw`\[L=\sum_i w_i r_i\]`,
    limitations: "Abstract evidence only.",
  },
};
const second = {
  ...first,
  id: "2611.23456",
  title: "Another policy paper",
  abstract: "A different reinforcement learning abstract.",
};
const feed = {
  version: 1,
  status: "ok",
  storage: "live",
  updatedAt: now,
  lastAttemptAt: now,
  sourceStatuses: [],
  summaryStatus: "ai-and-extractive",
  papers: [first, second],
};
test("research source and AI-summary mathematics render with all standard delimiters and contained display blocks", async ({
  page,
}) => {
  await page.route("**/api/research", (route) => route.fulfill({ json: feed }));
  await page.goto("/#research");
  const card = page.locator('[data-research-paper="2611.12345"]');
  await expect(card.locator(".katex")).toHaveCount(8);
  await expect(card.locator(".katex-error")).toHaveCount(0);
  await card.getByText("Read the original abstract", { exact: true }).click();
  await expect(card.locator(".research-abstract .katex")).toHaveCount(4);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
});
test("paper discussion uses canonical paper IDs, section-specific context, all chatbot models and separate saved threads", async ({
  page,
}) => {
  const requests = [];
  await page.route("**/api/research", (route) => route.fulfill({ json: feed }));
  await page.route("**/api/tutor", (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    return route.fulfill({
      json: {
        reply: String.raw`For ${body.paperId}, the teaching identity is \begin{align}J&=\mathbb E[R]\\A&=Q-V\end{align}`,
        model: body.model,
      },
    });
  });
  await page.goto("/#research");
  await page
    .locator('[data-research-paper="2611.12345"] [data-research-discuss]')
    .click();
  await expect(page.locator("#tutor-lesson")).toHaveValue("research");
  await expect(page.locator("#tutor-paper")).toHaveValue(first.id);
  await expect(page.locator("[data-tutor-source]")).toHaveAttribute(
    "href",
    "https://arxiv.org/abs/" + first.id,
  );
  await expect(page.locator("#tutor-model option")).toHaveCount(13);
  await page.locator("#tutor-section").selectOption("equations");
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain the mathematical notation.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(first.id);
  await expect(page.locator(".tutor-assistant .katex-display")).toHaveCount(1);
  expect(requests[0].paperId).toBe(first.id);
  expect(requests[0].lessonId).toBe("research");
  expect(requests[0].sectionKey).toBe("equations");
  expect(requests[0].paper).toBeUndefined();
  expect(requests[0].abstract).toBeUndefined();
  await page.locator("#tutor-paper").selectOption(second.id);
  await expect(page.locator(".tutor-assistant")).toHaveCount(0);
  await page.locator("#tutor-paper").selectOption(first.id);
  await page.locator("#tutor-section").selectOption("equations");
  await expect(page.locator(".tutor-assistant")).toContainText(first.id);
  await page.reload();
  await page
    .locator('[data-research-paper="2611.12345"] [data-research-discuss]')
    .click();
  await page.locator("#tutor-section").selectOption("equations");
  await expect(page.locator(".tutor-assistant")).toContainText(first.id);
});
test("research-library chat starts in research scope and mobile paper conversations stay usable", async ({
  page,
}) => {
  await page.route("**/api/research", (route) => route.fulfill({ json: feed }));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator("#tutor-lesson")).toHaveValue("research");
  await expect(page.locator("#tutor-paper")).toHaveValue("");
  await expect(page.locator("[data-tutor-source]")).toHaveAttribute(
    "href",
    "/#research",
  );
  await page.locator("#tutor-paper").selectOption(first.id);
  await expect(
    page.getByRole("textbox", { name: "Your question about this lesson" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send question" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  expect(
    await page.locator(".tutor-messages").evaluate((el) => el.clientHeight),
  ).toBeGreaterThanOrEqual(100);
  await page.screenshot({ path: "/tmp/rl-paper-chat-mobile.png" });
});
