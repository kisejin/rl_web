import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parsePaperHtml } from "../../server/paper-content.js";
import { inferPrerequisites } from "../../src/paper-prerequisites.js";
import { makePaperPdf } from "../fixtures/paper-pdf.mjs";
const now = new Date().toISOString();
const paper = {
  id: "2611.12345",
  title: "Policy gradients with rubric rewards",
  abstract:
    "Reinforcement learning uses policy optimization and a KL penalty with rubric rewards.",
  publishedAt: now,
  firstSeenAt: now,
  authors: ["A. Author"],
  topics: ["rl", "rubric"],
  sources: ["arxiv"],
  summary: { kind: "extractive", overview: "A study of policy learning." },
};
const feed = {
  version: 1,
  storage: "live",
  status: "ok",
  updatedAt: now,
  lastAttemptAt: now,
  sourceStatuses: [],
  papers: [paper],
};
const content = parsePaperHtml(
  readFileSync(
    new URL("../fixtures/paper-visuals.html", import.meta.url),
    "utf8",
  ),
  paper,
  "https://arxiv.org/html/" + paper.id,
);
async function setup(page, manifest = content) {
  await page.route("**/api/research", (r) => r.fulfill({ json: feed }));
  await page.route("**/api/paper-content?**", (r) =>
    r.fulfill({ json: manifest }),
  );
  await page.goto("/#research");
  await expect(page.locator(".research-card")).toHaveCount(1);
}
test("every paper has source-labeled math prerequisites and the full-text guide adds supported concepts", async ({
  page,
}) => {
  await setup(page);
  await page.locator(".research-prerequisites > summary").click();
  await expect(
    page.locator(".research-prerequisites .paper-math-concept"),
  ).toHaveCount(inferPrerequisites(paper).length);
  await expect(page.locator(".research-prerequisites")).toContainText(
    "based on the title/abstract",
  );
  await expect(
    page.locator(".research-prerequisites .katex").first(),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Check the full-text reading guide →",
      exact: true,
    })
    .click();
  const reader = page.getByRole("dialog", {
    name: "Paper figures, tables and mathematics",
    exact: true,
  });
  await expect(reader).toBeVisible();
  await expect(reader).toContainText("matched against the HTML full text");
  await expect(reader).toContainText("Concentration inequalities");
  await expect(reader.locator(".katex-error")).toHaveCount(0);
  await reader
    .getByRole("button", {
      name: "Ask AI about these prerequisites",
      exact: true,
    })
    .click();
  await expect(reader).not.toBeVisible();
  await expect(page.locator("#tutor-paper")).toHaveValue(paper.id);
  await expect(page.locator("#tutor-section")).toHaveValue("prerequisites");
});
test("gallery includes subpanel and appendix figures, original captions, semantic tables and image enlargement", async ({
  page,
}) => {
  await page.route("https://arxiv.org/html/2611.12345v2/**", (r) =>
    r.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#236ea5"/></svg>',
    }),
  );
  await setup(page);
  await page
    .getByRole("button", { name: "Figures & tables", exact: true })
    .click();
  const reader = page.getByRole("dialog", {
    name: "Paper figures, tables and mathematics",
    exact: true,
  });
  await expect(reader.locator(".paper-figure-grid figure")).toHaveCount(3);
  await expect(reader).toContainText("Figure A1");
  await expect(
    reader.locator(".paper-figure-grid figcaption .katex").first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      reader
        .locator("img")
        .first()
        .evaluate((img) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await reader
    .getByRole("button", { name: "Enlarge image 1", exact: true })
    .click();
  const zoom = page.getByRole("dialog", {
    name: "Enlarged paper visual",
    exact: true,
  });
  await expect(zoom).toBeVisible();
  await zoom.getByRole("button", { name: "Close enlarged visual" }).click();
  await expect(reader).toBeVisible();
  await reader.getByRole("tab", { name: "Tables", exact: true }).click();
  await expect(reader.locator(".paper-table")).toHaveCount(2);
  await expect(reader.locator('th[colspan="2"]')).toHaveText("Results");
  await expect(reader).toContainText("Table A1");
  await expect(reader.locator(".paper-table .katex").first()).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);
  await page.screenshot({ path: "/tmp/rl-paper-tables-mobile.png" });
});
test("PDF-only fallback renders original pages with the real PDF worker and reaches the final appendix page", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fallback = {
    ...content,
    status: "pdf-only",
    assets: [],
    tables: [],
    coverage: { note: "Usable HTML could not be retrieved; use Complete PDF." },
  };
  await page.route("**/api/paper-pdf?**", (r) =>
    r.fulfill({ contentType: "application/pdf", body: makePaperPdf(8) }),
  );
  await setup(page, fallback);
  await page
    .getByRole("button", { name: "Figures & tables", exact: true })
    .click();
  const reader = page.getByRole("dialog", {
    name: "Paper figures, tables and mathematics",
    exact: true,
  });
  await expect(reader).toContainText("could not be separately extracted");
  await reader.getByRole("tab", { name: "Complete PDF", exact: true }).click();
  await reader
    .getByRole("button", { name: "Load complete PDF", exact: true })
    .click();
  await expect(reader.locator("[data-pdf-page]")).toHaveCount(6);
  await expect
    .poll(() =>
      reader.locator('[data-pdf-page="1"]').evaluate((canvas) => canvas.width),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      reader.locator('[data-pdf-page="1"]').evaluate((canvas) => {
        const p = canvas.getContext("2d").getImageData(100, 200, 1, 1).data;
        return p[2] > 100 && p[0] < 100;
      }),
    )
    .toBe(true);
  await reader.getByLabel("PDF page number", { exact: true }).fill("8");
  await reader.getByRole("button", { name: "Go", exact: true }).click();
  await expect(reader.locator("[data-pdf-page]")).toHaveCount(1);
  await expect(reader).toContainText("Pages 8–8 of 8");
  await reader
    .getByRole("button", { name: "Enlarge PDF page 8", exact: true })
    .click();
  const zoom = page.getByRole("dialog", {
    name: "Enlarged paper visual",
    exact: true,
  });
  await expect(zoom).toBeVisible();
  await expect
    .poll(() => zoom.locator("canvas").evaluate((c) => c.width))
    .toBeGreaterThan(400);
  await page.keyboard.press("Escape");
  await page.goto("/#atlas");
  await expect(page.locator(".paper-reader,.paper-zoom")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("unavailable full-text extraction preserves prerequisites and explicit PDF access instead of a permanent loading state", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/paper-content?**", (r) =>
    r.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page
    .getByRole("button", { name: "Figures & tables", exact: true })
    .click();
  const reader = page.getByRole("dialog", {
    name: "Paper figures, tables and mathematics",
    exact: true,
  });
  await expect(reader).toContainText("could not be loaded");
  await expect(reader).toContainText("could not be separately extracted");
  await reader
    .getByRole("tab", { name: "Math prerequisites", exact: true })
    .click();
  await expect(reader.locator(".paper-math-concept")).toHaveCount(
    inferPrerequisites(paper).length,
  );
  await reader.getByRole("tab", { name: "Complete PDF", exact: true }).click();
  await expect(
    reader.getByRole("link", { name: "Open original PDF ↗", exact: true }),
  ).toHaveAttribute("href", "https://arxiv.org/pdf/" + paper.id);
});
