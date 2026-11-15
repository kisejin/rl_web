import { test, expect } from "@playwright/test";
const now = new Date().toISOString();
const paper = (id, title, topics, kind = "ai") => ({
  id,
  title,
  abstract:
    "The authors study reinforcement learning with verifiable rewards. This is original source abstract text, not independently reviewed evidence.",
  authors: ["Ada Learner"],
  publishedAt: now,
  updatedAt: now,
  firstSeenAt: now,
  topics,
  sources: ["arxiv", "huggingface"],
  summary: {
    kind,
    overview: "The authors propose a verifiable training method.",
    method: "A rubric aggregates rewards.",
    limitations: "Full-paper reproducibility was not reviewed.",
  },
});
const feed = {
  version: 1,
  updatedAt: now,
  lastAttemptAt: now,
  status: "ok",
  storage: "live",
  summaryStatus: "ai-and-extractive",
  sourceStatuses: [{ id: "arxiv-targeted", ok: true, count: 2 }],
  papers: [
    paper("2611.12345", "A New RLVR Method", ["rl", "rlvr"]),
    paper(
      "2611.23456",
      "On-policy Self-Distillation",
      ["self-distillation"],
      "extractive",
    ),
    paper("2611.34567", "Rubric Reward Design", ["rubric"]),
  ],
};
test("research navigation, topic/search/source filters and saved reading lists work across reloads", async ({
  page,
}) => {
  await page.route("**/api/research", (route) => route.fulfill({ json: feed }));
  await page.goto("/");
  await page
    .getByRole("link", { name: "Research feed Daily", exact: true })
    .click();
  await expect(page).toHaveURL(/#research/);
  await expect(page).toHaveTitle(/Research feed/);
  await expect(page.locator(".research-card")).toHaveCount(3);
  await page.getByRole("button", { name: "RLVR", exact: true }).click();
  await expect(page.locator(".research-card")).toHaveCount(1);
  await page.getByRole("button", { name: "All research", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search research papers" })
    .fill("rubric reward");
  await expect(page.locator(".research-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Save paper: Rubric Reward Design",
      exact: true,
    })
    .click();
  await page
    .getByRole("searchbox", { name: "Search research papers" })
    .fill("");
  await page.getByLabel("Saved papers", { exact: true }).check();
  await expect(page.locator(".research-card")).toHaveCount(1);
  await page.reload();
  await page.getByLabel("Saved papers", { exact: true }).check();
  await expect(page.locator(".research-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Unsave paper: Rubric Reward Design",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByLabel("Research source", { exact: true })
    .selectOption("huggingface");
  await expect(page.locator(".research-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Unsave paper: Rubric Reward Design",
      exact: true,
    })
    .click();
  await expect(page.locator(".research-empty")).toBeVisible();
});
test("research cards distinguish AI summaries from excerpts, escape source text and expose canonical paper links", async ({
  page,
}) => {
  const malicious = structuredClone(feed);
  malicious.papers[0].title = "<img src=x onerror=alert(1)> RLVR";
  malicious.papers[0].summary.overview =
    "<script>window.bad=1</script> claimed finding";
  await page.route("**/api/research", (route) =>
    route.fulfill({ json: malicious }),
  );
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(3);
  await expect(page.locator(".research-digest-label").first()).toHaveText(
    "AI abstract summary",
  );
  await expect(page.locator(".research-digest-label").nth(1)).toHaveText(
    "Abstract excerpt",
  );
  expect(await page.evaluate(() => window.bad)).toBeUndefined();
  await expect(
    page.locator(".research-card img,.research-card script"),
  ).toHaveCount(0);
  const first = page.locator(".research-card").first();
  await expect(
    first.getByRole("link", { name: "Read on arXiv ↗" }),
  ).toHaveAttribute("href", "https://arxiv.org/abs/2611.12345");
  await first.locator("summary").click();
  await expect(first.locator(".research-abstract p")).toContainText(
    "original source abstract",
  );
  await page
    .getByLabel("Research publication window", { exact: true })
    .selectOption("7");
  await expect(page.locator(".research-card")).toHaveCount(3);
});
test("a failing live API shows a dated bundled collection; stale or partial data is explicit and reload retains cards on failure", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/research", (route) => {
    calls++;
    return route.fulfill(
      calls === 1
        ? { status: 503, json: { error: "Unavailable" } }
        : { json: { ...feed, status: "partial" } },
    );
  });
  await page.route("**/research-feed.json", (route) =>
    route.fulfill({ json: feed }),
  );
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(3);
  await expect(page.locator("[data-research-notice]")).toContainText(
    "bundled collection",
  );
  await page
    .getByRole("button", { name: "Reload collection", exact: true })
    .click();
  await expect(page.locator("[data-research-notice]")).toContainText(
    "Some sources were unavailable",
  );
  await page.route("**/api/research", (route) => route.abort());
  await page
    .getByRole("button", { name: "Reload collection", exact: true })
    .click();
  await expect(page.locator("[data-research-notice]")).toContainText(
    "Could not reload",
  );
  await expect(page.locator(".research-card")).toHaveCount(3);
});
test("research fits a narrow screen in light and dark themes and cleans up fetches on route changes", async ({
  page,
}) => {
  await page.route("**/api/research", (route) => route.fulfill({ json: feed }));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(3);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  await page.getByRole("button", { name: /Color theme:/ }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  await page.screenshot({
    path: "/tmp/rl-research-mobile.png",
    fullPage: true,
  });
  await page.goto("/#atlas/ppo");
  await expect(page.locator("h1")).toContainText("PPO");
  await page.waitForTimeout(100);
  await expect(page.locator(".research-page")).toHaveCount(0);
});

test("a large collected archive loads incrementally and resets pagination when filtering", async ({
  page,
}) => {
  const many = {
    ...feed,
    papers: Array.from({ length: 30 }, (_, i) =>
      paper("2611." + String(i).padStart(5, "0"), "RL paper " + i, ["rl"]),
    ),
  };
  await page.route("**/api/research", (route) => route.fulfill({ json: many }));
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(12);
  await page
    .getByRole("button", { name: "Load 12 more papers", exact: true })
    .click();
  await expect(page.locator(".research-card")).toHaveCount(24);
  await page
    .getByRole("button", { name: "Load 12 more papers", exact: true })
    .click();
  await expect(page.locator(".research-card")).toHaveCount(30);
  await expect(page.locator("[data-research-more]")).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "Search research papers" })
    .fill("paper");
  await expect(page.locator(".research-card")).toHaveCount(12);
});
