import { test, expect } from "@playwright/test";
import { labs, lessons } from "../../src/content.js";
test("home simulation, value toggle and discount work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#grid .grid-cell")).toHaveCount(25);
  await page.getByRole("button", { name: "Show state value" }).click();
  await expect(page.locator(".cell-value")).toHaveCount(20);
  await page.locator("#gamma").fill("0.99");
  await expect(page.locator("#gamma-number")).toHaveText("0.99");
  await page.getByRole("button", { name: "Run agent" }).click();
  await expect(page.locator("#sim-thought")).toContainText("Goal reached", {
    timeout: 10000,
  });
  await expect(page.locator("#step-count")).toHaveText("08");
  await expect(page.locator("#reward-count")).toHaveText("9.3");
  await page.getByRole("button", { name: "Reset simulation" }).click();
  await expect(page.locator("#step-count")).toHaveText("00");
});
test("lessons, quiz, notes and progress persist", async ({ page }) => {
  await page.goto("/#lesson/bellman");
  await page.locator(".proof-details summary").click();
  await expect(page.locator(".proof-step")).toHaveCount(3);
  await page.locator('[data-answer="0"]').click();
  await expect(page.locator(".quiz-feedback")).toContainText("Not quite");
  await page.locator('[data-answer="1"]').click();
  await expect(page.locator(".quiz-feedback")).toContainText("Correct");
  await page
    .locator("#lesson-note")
    .fill("Bellman is a contraction when gamma is less than 1.");
  await page.getByRole("button", { name: "Complete chapter" }).click();
  await expect(page.locator(".progress-caption b")).toHaveText("0%");
  await page
    .locator("#lesson-proof")
    .fill(
      "For a finite MDP with gamma less than 1, rewards cancel. The triangle inequality and normalized probabilities bound the difference by gamma times the infinity norm. Take the maximum over states.",
    );
  await page.locator("#lesson-reviewed").check();
  await page.getByRole("button", { name: "Complete chapter" }).click();
  await expect(page.locator(".progress-caption b")).toHaveText("11%");
  await page.reload();
  await expect(page.locator("#lesson-note")).toHaveValue(
    "Bellman is a contraction when gamma is less than 1.",
  );
  await page.goto("/#notebook");
  await expect(page.locator(".note-card").first()).toContainText(
    "Bellman is a contraction",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export notes" }).click();
  expect((await download).suggestedFilename()).toBe("rl-atlas-notebook.md");
});
test("lab filter and search combine", async ({ page }) => {
  await page.goto("/#labs");
  await expect(page.locator(".lab-row")).toHaveCount(labs.length);
  await page.getByRole("button", { name: "Math + Code", exact: true }).click();
  await expect(page.locator(".lab-row")).toHaveCount(
    labs.filter((l) => l.hybrid).length,
  );
  await page.locator("#lab-search").fill("rubric");
  await expect(page.locator(".lab-row")).toHaveCount(
    labs.filter(
      (l) =>
        l.hybrid && `${l.title} ${l.topic}`.toLowerCase().includes("rubric"),
    ).length,
  );
  await page.locator("#lab-search").fill("no match");
  await expect(page.locator(".empty-state")).toBeVisible();
});
test("all solutions execute in real workers", async ({ page }) => {
  test.setTimeout(360000);
  for (const lab of labs) {
    await page.goto("/lab.html#" + lab.id);
    await page.locator("#code-editor").fill(lab.solution);
    if (lab.hybrid) {
      await page
        .locator("#proof-input")
        .fill(
          "Assume the conditions of the problem hold. Expand the expectation, apply the triangle inequality, and use normalization to obtain the conclusion.",
        );
      await page.locator(".proof-rubric summary").click();
      for (let i = 0; i < lab.checks.length; i++)
        await page.locator(`[data-proof-check="${i}"]`).check();
    }
    await page.getByRole("button", { name: "Run tests" }).click();
    await expect(page.locator(".test-summary")).toContainText(
      `${lab.tests.length}/${lab.tests.length} tests passed`,
    );
    await expect(page.locator(".lab-solved")).toContainText(
      lab.hybrid ? "Code passed" : "Solved",
    );
  }
  await page.goto("/#labs");
  await expect(page.locator(".lab-number.solved")).toHaveCount(labs.length);
});
test("hybrid completion requires code plus self-reviewed proof", async ({
  page,
}) => {
  const lab = labs.find((l) => l.id === "bellman");
  await page.goto("/lab.html#bellman");
  await page.locator("#code-editor").fill(lab.solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("4/4");
  await expect(page.locator(".lab-solved")).toBeEmpty();
  await page
    .locator("#proof-input")
    .fill(
      "For a finite MDP and gamma less than 1, the rewards cancel. Apply the triangle inequality and use that probabilities sum to 1. Take the maximum over states to obtain contraction.",
    );
  await page.locator(".proof-rubric summary").click();
  for (let i = 0; i < 3; i++)
    await page.locator(`[data-proof-check="${i}"]`).check();
  await expect(page.locator(".lab-solved")).toContainText(
    "Proof self-reviewed",
  );
  await page.locator('[data-proof-check="0"]').uncheck();
  await expect(page.locator(".lab-solved")).toBeEmpty();
});
test("runner reports syntax errors, wrong output and infinite loop timeout", async ({
  page,
}) => {
  await page.goto("/lab.html#return");
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("0/5");
  await page.locator("#code-editor").fill("def discounted_return(:");
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-error")).toBeVisible();
  await page
    .locator("#code-editor")
    .fill(
      "def discounted_return(rewards, gamma):\n    while True:\n        pass",
    );
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-error")).toContainText("Exceeded 3 seconds");
  await page.locator("#code-editor").fill(labs[0].solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("5/5");
  await page
    .locator("#code-editor")
    .fill("def discounted_return(rewards, gamma):\n    return 0");
  await expect(page.locator(".lab-solved")).toBeEmpty();
});
test("rubric interactive gate and score recalculate", async ({ page }) => {
  await page.goto("/#lesson/rubric");
  await expect(page.locator("#rubric-result")).toHaveText("0.810");
  await page.locator('[data-rubric="0"]').fill("0");
  await expect(page.locator("#rubric-result")).toHaveText("0.310");
  await page.locator("#rubric-gate").uncheck();
  await expect(page.locator("#rubric-result")).toHaveText("0.000");
});
test("all lessons render without math errors or page exceptions", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const l of lessons) {
    await page.goto("/#lesson/" + l.id);
    await expect(page.locator(".lesson-content h1")).toHaveText(l.title);
    await expect(page.locator(".katex-error")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test("mobile main flows fit viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "home",
    "curriculum",
    "lesson/bellman",
    "labs",
    "lab/rubric",
    "notebook",
  ]) {
    await page.goto(
      route.startsWith("lab/") ? "/lab.html#" + route.slice(4) : "/#" + route,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await page.locator('.sidebar a[href="/#lesson/rubric"]').click();
  await expect(page.locator(".lesson-content h1")).toHaveText(
    "Rubric-based Reward RL",
  );
});

test("English UI is used on all routes and notebook export", async ({
  page,
}) => {
  const untranslated =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const routes = [
    "home",
    "curriculum",
    "labs",
    "notebook",
    ...lessons.map((l) => "lesson/" + l.id),
    ...labs.map((l) => "lab/" + l.id),
  ];
  for (const route of routes) {
    await page.goto(
      route.startsWith("lab/") ? "/lab.html#" + route.slice(4) : "/#" + route,
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.locator("body").innerText()).not.toMatch(untranslated);
    for (const text of await page
      .locator("[aria-label], [placeholder]")
      .evaluateAll((elements) =>
        elements.flatMap((el) => [
          el.getAttribute("aria-label") || "",
          el.getAttribute("placeholder") || "",
        ]),
      ))
      expect(text).not.toMatch(untranslated);
  }
  await page.goto("/#notebook");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export notes" }).click();
  const result = await download;
  const stream = await result.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString();
  expect(text).toContain("Learning notebook");
  expect(text).not.toMatch(untranslated);
});

test("all chapter animations support stepping, parameters, scrubbing and reset", async ({
  page,
}) => {
  for (const id of [...lessons.map((l) => l.id), "kl"]) {
    await page.goto("/#lesson/" + (id === "kl" ? "rubric" : id));
    const scene = page.locator(`[data-visual="${id}"]`);
    await scene.getByRole("tab", { name: "Explore parameters" }).click();
    await expect(scene.locator(".visual-scene > svg")).toBeVisible();
    await expect(scene.locator(".katex-error")).toHaveCount(0);
    await scene.locator("[data-visual-next]").click();
    await expect(scene.locator("[data-step-counter]")).toContainText("2 /");
    const slider = scene.locator("[data-visual-parameter]");
    const max = await slider.getAttribute("max");
    await slider.fill(max);
    await expect(scene.locator(".visual-parameter output")).toHaveText(
      Number(max).toFixed(2),
    );
    const timeline = scene.locator("[data-visual-timeline]");
    const last = await timeline.getAttribute("max");
    await timeline.fill(last);
    await expect(scene.locator("[data-visual-next]")).toBeDisabled();
    await expect(scene.locator(".katex-error")).toHaveCount(0);
    await scene.locator("[data-visual-reset]").click();
    await expect(scene.locator("[data-step-counter]")).toContainText("1 /");
  }
});
test("animation play, pause, completion and navigation clean up timers", async ({
  page,
}) => {
  await page.goto("/#lesson/bellman");
  const scene = page.locator('[data-visual="bellman"]');
  await scene.getByRole("tab", { name: "Explore parameters" }).click();
  await scene.getByRole("button", { name: "Play concept animation" }).click();
  await expect(scene.locator("[data-step-counter]")).toContainText("2 /", {
    timeout: 5000,
  });
  await scene.getByRole("button", { name: "Pause concept animation" }).click();
  const counter = await scene.locator("[data-step-counter]").textContent();
  await page.waitForTimeout(2000);
  await expect(scene.locator("[data-step-counter]")).toHaveText(counter);
  await scene.locator("[data-visual-timeline]").fill("4");
  await scene.getByRole("button", { name: "Play concept animation" }).click();
  await expect(scene.locator("[data-step-counter]")).toHaveText("6 / 6", {
    timeout: 5000,
  });
  await expect(
    scene.getByRole("button", { name: "Play concept animation" }),
  ).toBeVisible();
  await scene.getByRole("button", { name: "Play concept animation" }).click();
  await page.goto("/#lesson/probability");
  await page.waitForTimeout(2000);
  await expect(page.locator("[data-step-counter]")).toHaveText("1 / 5");
});
test("larger reading text, proof walkthrough and reduced motion work on mobile", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#lesson/bellman");
  expect(
    await page
      .locator(".prose-section p")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(18);
  expect(
    await page
      .locator(".quiz-option")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await page.getByRole("tab", { name: "Explore parameters" }).click();
  await expect(
    page.getByRole("button", { name: "Play concept animation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause concept animation" }),
  ).toHaveCount(0);
  await page.locator(".proof-details summary").click();
  await page.getByRole("button", { name: "Next step →", exact: true }).click();
  await expect(page.locator(".proof-current")).toHaveCount(1);
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect(page.locator(".proof-pending")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("all ten Manim movies decode, play, pause and have captions", async ({
  page,
}) => {
  for (const id of [...lessons.map((l) => l.id), "kl"]) {
    await page.goto("/#lesson/" + (id === "kl" ? "rubric" : id));
    const scene = page.locator(`[data-visual="${id}"]`),
      video = scene.locator("video");
    await expect(
      scene.getByRole("tab", { name: "Watch Manim" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(video).toBeVisible();
    await video.evaluate((el) => el.play());
    await expect
      .poll(() => video.evaluate((el) => el.currentTime))
      .toBeGreaterThan(0.1);
    await expect
      .poll(() => video.evaluate((el) => el.readyState))
      .toBeGreaterThanOrEqual(2);
    expect(
      await video.evaluate((el) => [el.videoWidth, el.videoHeight]),
    ).toEqual([960, 540]);
    expect(await video.evaluate((el) => el.textTracks.length)).toBe(1);
    await expect(scene.locator(".film-error")).toBeHidden();
    await scene.getByRole("tab", { name: "Explore parameters" }).click();
    expect(await video.evaluate((el) => el.paused)).toBeTruthy();
    await expect(scene.locator(".visual-scene > svg")).toBeVisible();
  }
});
test("Manim player speed, seeking, transcript, keyboard tabs and lifecycle work", async ({
  page,
}) => {
  await page.goto("/#lesson/bellman");
  const scene = page.locator('[data-visual="bellman"]'),
    video = scene.locator("video");
  await scene.locator("[data-film-speed]").selectOption("1.5");
  expect(await video.evaluate((el) => el.playbackRate)).toBe(1.5);
  await scene.locator(".film-transcript summary").click();
  const cue = scene.locator("[data-film-seek]").nth(1);
  const time = Number(await cue.getAttribute("data-film-seek"));
  await cue.click();
  await expect
    .poll(() => video.evaluate((el) => el.currentTime))
    .toBeGreaterThanOrEqual(time);
  await scene.getByRole("tab", { name: "Explore parameters" }).click();
  expect(await video.evaluate((el) => el.paused)).toBeTruthy();
  await scene.getByRole("button", { name: "Play concept animation" }).click();
  await scene.getByRole("tab", { name: "Watch Manim" }).click();
  await scene.getByRole("tab", { name: "Explore parameters" }).click();
  await expect(
    scene.getByRole("button", { name: "Play concept animation" }),
  ).toBeVisible();
  await scene.getByRole("tab", { name: "Explore parameters" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(scene.getByRole("tab", { name: "Watch Manim" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await scene.locator("[data-film-replay]").click();
  await expect
    .poll(() => video.evaluate((el) => el.currentTime))
    .toBeGreaterThan(0);
  await expect
    .poll(() => video.evaluate((el) => el.currentTime))
    .toBeLessThan(3);
  await page.goto("/#lesson/mdp");
  await expect(page.locator('[data-visual="mdp"] video')).toBeVisible();
});

test("all labs render LaTeX in definitions, prose, hints and proofs without changing executable code", async ({
  page,
}) => {
  for (const lab of labs) {
    await page.goto("/lab.html#" + lab.id);
    await expect(
      page.locator("#lc-description .lab-equation .katex-display"),
    ).toHaveCount(1);
    await expect(page.locator(".problem-body .katex-error")).toHaveCount(0);
    await expect(page.locator(".problem-body")).not.toContainText("\\(");
    await expect(page.locator(".problem-body")).not.toContainText("\\[");
    await expect(page.locator(".example-code")).toHaveText(lab.example);
    await expect(page.locator("#code-editor")).toContainText("def " + lab.fn);
    await page.locator(".hint summary").click();
    await expect(page.locator(".hint .katex").first()).toBeVisible();
    if (lab.hybrid) {
      await expect(
        page.locator(".hybrid-proof>p .katex").first(),
      ).toBeVisible();
      await page.locator(".proof-rubric summary").click();
      await expect(
        page.locator('.proof-rubric input[type="checkbox"]'),
      ).toHaveCount(lab.checks.length);
    }
  }
});
test("lab LaTeX remains readable with contained scrolling on small screens", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ["value-iteration", "reinforce", "rubric-policy"]) {
      await page.goto("/lab.html#" + id);
      await page.locator(".hint summary").click();
      await page.locator(".proof-rubric summary").click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}: ${id}`,
      ).toBeTruthy();
      expect(
        await page
          .locator("#lc-description .lab-equation .katex")
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(18);
    }
  }
});

test("documentation search opens with keyboard and navigates across guides and labs", async ({
  page,
}) => {
  await page.goto("/#lesson/foundations");
  await page.keyboard.press("Control+k");
  await expect(page.locator("#doc-search-dialog")).toBeVisible();
  const input = page.getByRole("searchbox", {
    name: "Search concepts, lessons, or code labs",
  });
  await input.fill("Discounted Return");
  await expect(page.locator(".doc-search-results a").first()).toContainText(
    "Discounted Return",
  );
  await input.press("Enter");
  await expect(page.locator(".lab-page-title h1")).toHaveText(
    "Discounted Return",
  );
  await expect(page.locator("#doc-search-dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Search documentation", exact: true })
    .click();
  await input.fill("zz-no-result-zz");
  await expect(page.locator(".doc-search-empty")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#doc-search-dialog")).not.toBeVisible();
});
test("documentation table of contents scrolls, highlights and restores deep links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#lesson/bellman");
  const link = page
    .locator(".doc-toc nav a")
    .filter({ hasText: "Decompose the return" });
  await link.click();
  await expect(page).toHaveURL(/#lesson\/bellman::section-/);
  await expect(link).toHaveAttribute("aria-current", "location");
  const target = await link.getAttribute("data-doc-target");
  expect(
    await page
      .locator("#" + target)
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(60);
  await page.reload();
  await expect(page.locator(".lesson-content h1")).toHaveText(
    "The Bellman Equation",
  );
  expect(
    await page
      .locator("#" + target)
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBeLessThan(250);
  await page.getByRole("link", { name: "Back to top ↑" }).click();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
test("documentation themes persist without replacing app content and auto follows system", async ({
  page,
}) => {
  await page.goto("/#lesson/bellman");
  const toggle = page.locator("button[data-doc-theme]");
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "light");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
  await expect(page.locator(".lesson-content h1")).toHaveText(
    "The Bellman Equation",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", /auto/);
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "light");
  await expect(page.locator("#main-content")).toBeVisible();
});
test("documentation mobile menu and table of contents remain usable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Toggle table of contents" }).click();
  await expect(page.locator(".doc-toc")).toBeVisible();
  await page
    .locator(".doc-toc nav a")
    .filter({ hasText: "Decompose the return" })
    .click();
  await expect(page.locator(".doc-toc")).not.toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await page.locator('.sidebar a[href="/#labs"]').click();
  await expect(page.locator(".page-heading h1")).toContainText(
    "build it yourself",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("coding workspace saves checked submissions and restores submitted code", async ({
  page,
}) => {
  const lab = labs.find((l) => l.id === "return");
  await page.goto("/lab.html#return");
  await page.locator("#code-editor").fill(lab.solution);
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator("#lc-submissions .lc-verdict")).toHaveText(
    "Accepted",
  );
  await expect(page.locator("[data-lc-submission-count]")).toHaveText("1");
  await page.reload();
  await page.locator('[data-lc-left="submissions"]').click();
  await page.locator(".lc-submission summary").click();
  await page
    .locator("#code-editor")
    .fill("def discounted_return(rewards, gamma):\n    return 0");
  await page.getByRole("button", { name: "Load this code" }).click();
  await expect(page.locator("#code-editor")).toHaveJSProperty(
    "value",
    lab.solution,
  );
  await page
    .locator("#code-editor")
    .fill("def discounted_return(rewards, gamma):\n    return 0");
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator(".lc-verdict").first()).toHaveText("Wrong Answer");
  await expect(page.locator("[data-lc-submission-count]")).toHaveText("2");
});

test("custom cases validate JSON and run without awarding completion", async ({
  page,
}) => {
  await page.goto("/lab.html#return");
  await page
    .locator("#code-editor")
    .fill(labs.find((l) => l.id === "return").solution);
  await page.locator('[data-lc-console="cases"]').click();
  await page.locator("#lc-case-args").fill("[[2,4],0.5]");
  await page.locator("#lc-case-expected").fill("4");
  await page.getByRole("button", { name: "Run selected case" }).click();
  await expect(page.locator("#lc-custom-result")).toContainText("Case passed");
  await expect(page.locator(".lab-solved")).toBeEmpty();
  await expect(page.locator("[data-lc-submission-count]")).toHaveText("0");
  await page.locator("#lc-case-expected").fill("99");
  await page.getByRole("button", { name: "Run selected case" }).click();
  await expect(page.locator("#lc-custom-result")).toContainText("Case failed");
  await page.locator("#lc-case-args").fill("invalid");
  await page.getByRole("button", { name: "Run selected case" }).click();
  await expect(page.locator("#lc-custom-result")).toContainText(
    "Use valid JSON",
  );
});

test("workspace layout, editor controls and problem picker work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab.html#return");
  const split = page.getByRole("separator", {
    name: "Resize description and editor",
  });
  await split.focus();
  await split.press("ArrowRight");
  await expect(split).toHaveAttribute("aria-valuenow", "38");
  await page.getByRole("button", { name: "Increase editor font size" }).click();
  expect(
    await page
      .locator("#code-editor")
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("16px");
  await page.reload();
  await expect(split).toHaveAttribute("aria-valuenow", "38");
  await page
    .getByRole("button", { name: "Maximize editor", exact: true })
    .click();
  await expect(page.locator(".lc-page")).toHaveClass(/lc-editor-maximized/);
  await page.getByRole("button", { name: "Restore editor layout" }).click();
  await page.locator('[data-lc-left="editorial"]').click();
  await expect(page.locator("#lc-editorial")).toContainText(
    "REFERENCE IMPLEMENTATION",
  );
  await page.getByRole("button", { name: "Problem List", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Find a challenge" })
    .fill("rubric");
  await expect(page.locator(".lc-problem-links a:visible")).toHaveCount(
    labs.filter((l) => `${l.title} ${l.topic}`.toLowerCase().includes("rubric"))
      .length,
  );
  await page.locator(".lc-problem-links a:visible").first().click();
  await expect(page).toHaveURL(/lab\.html#rubric/);
  await expect(page.locator(".lab-page-title h1")).toContainText("Rubric");
});

test("mobile coding panels support Run and Submit at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/lab.html#return");
  await page.locator('[data-lc-mobile="code"]').click();
  await expect(page.locator("#code-editor")).toBeVisible();
  await page
    .locator("#code-editor")
    .fill(labs.find((l) => l.id === "return").solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("5/5");
  await expect(page.locator('[data-lc-mobile="tests"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator("#lc-submissions")).toBeVisible();
  await expect(page.locator(".lc-verdict")).toHaveText("Accepted");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("hybrid submissions require a proof and retain the earlier verdict", async ({
  page,
}) => {
  await page.goto("/lab.html#bellman");
  await page
    .locator("#code-editor")
    .fill(labs.find((l) => l.id === "bellman").solution);
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator(".lc-verdict")).toHaveText("Proof required");
  await page.locator('[data-lc-left="description"]').click();
  await page
    .locator("#proof-input")
    .fill(
      "For a finite MDP and gamma less than 1, rewards cancel. Apply the triangle inequality and normalization of transition probabilities, then maximize over states to establish contraction.",
    );
  await page.locator(".proof-rubric summary").click();
  for (let i = 0; i < 3; i++)
    await page.locator(`[data-proof-check="${i}"]`).check();
  await page.getByRole("button", { name: "Submit solution" }).click();
  await expect(page.locator(".lc-verdict").first()).toHaveText("Accepted");
  await expect(page.locator(".lc-verdict").nth(1)).toHaveText("Proof required");
});

for (const width of [1440, 390]) {
  test(`lab opens full page and expands each pane at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#lesson/bellman");
    await page.getByRole("link", { name: /Open code lab/ }).click();
    await expect(page).toHaveURL(/lab\.html#bellman/);
    const bounds = await page.locator(".lc-page").boundingBox();
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
    expect(bounds.width).toBe(width);
    expect(bounds.height).toBe(900);
    await page
      .getByRole("button", { name: "Maximize description", exact: true })
      .click();
    await expect(page.locator(".lc-right-pane")).not.toBeVisible();
    expect(
      (await page.locator(".lc-left-pane").boundingBox()).width,
    ).toBeGreaterThan(width - 20);
    await expect(
      page.locator("#lc-description .lab-equation .katex-display"),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Maximize description", exact: true }),
    ).toBeVisible();
    if (width < 760) await page.locator('[data-lc-mobile="code"]').click();
    await page
      .locator("#code-editor")
      .fill(labs.find((l) => l.id === "bellman").solution);
    await page
      .getByRole("button", { name: "Maximize editor", exact: true })
      .click();
    expect(
      (await page.locator(".lc-code-pane").boundingBox()).width,
    ).toBeGreaterThan(width - 20);
    await expect(page.locator(".test-panel")).not.toBeVisible();
    await page.getByRole("button", { name: "Run tests" }).click();
    await expect(page.locator(".test-summary")).toContainText("4/4");
    await page
      .getByRole("button", { name: "Maximize tests", exact: true })
      .click();
    await expect(page.locator(".lc-code-pane")).not.toBeVisible();
    expect(
      (await page.locator(".test-panel").boundingBox()).width,
    ).toBeGreaterThan(width - 20);
    await page.getByRole("button", { name: "Restore tests layout" }).click();
    await expect(page.locator(".lc-page")).toHaveAttribute(
      "data-focused-pane",
      "",
    );
    if (width < 760) await page.locator('[data-lc-mobile="code"]').click();
    await expect(page.locator("#code-editor")).toHaveJSProperty(
      "value",
      labs.find((l) => l.id === "bellman").solution,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
}

test("workspace full screen button tracks browser state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/lab.html#return");
  const button = page.getByRole("button", { name: "Toggle full screen" });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBeTruthy();
  await expect(button).toContainText("Exit full screen");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBeFalsy();
});

test("docked console gives code the full height and opens for tests and runs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab.html#return");
  const toggle = page.getByRole("button", { name: "Expand test console" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#lc-testcases")).not.toBeVisible();
  const tallEditor = await page.locator(".lc-code-pane").boundingBox();
  expect(tallEditor.height).toBeGreaterThan(850);
  await page.locator('[data-lc-console="cases"]').click();
  await expect(page.locator("#lc-testcases")).toBeVisible();
  expect(
    (await page.locator(".lc-code-pane").boundingBox()).height,
  ).toBeLessThan(tallEditor.height - 100);
  await page.getByRole("button", { name: "Collapse test console" }).click();
  await expect(page.locator("#lc-testcases")).not.toBeVisible();
  await page
    .locator("#code-editor")
    .fill(labs.find((l) => l.id === "return").solution);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("5/5");
  await expect(
    page.getByRole("button", { name: "Collapse test console" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Collapse test console" }).click();
  await expect(page.locator(".test-summary")).not.toBeVisible();
  await page.locator('[data-lc-console="results"]').click();
  await expect(page.locator(".test-summary")).toContainText("5/5");
});

test("labs default to dark while guides and explicit theme preferences retain their themes", async ({
  page,
}) => {
  await page.goto("/#lesson/bellman");
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "light");
  await page.getByRole("link", { name: /Open code lab/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
  await page
    .getByRole("link", { name: "Learning guides", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "light");
  await page.evaluate(() =>
    localStorage.setItem("rl-atlas-doc-theme", "light"),
  );
  await page.goto("/lab.html#return");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "light");
  await page.locator("button[data-doc-theme]").click();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-doc-theme", "dark");
});

test("Python lab is a separate full-viewport document without documentation CSS or sidebar", async ({
  page,
}) => {
  const requested = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto("/#lesson/foundations");
  await page.getByRole("link", { name: /Open code lab/ }).click();
  await expect(page).toHaveURL(/\/lab\.html#return/);
  await expect(
    page.locator(".sidebar,.doc-toc,.docs-layout,.app-shell,.topbar"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Your Python code" }),
  ).toBeVisible();
  await expect(page.locator(".lc-language")).toContainText("Python");
  await expect(page.locator("#code-editor")).toContainText(
    "def discounted_return",
  );
  await page.reload();
  await expect(page.locator("#code-editor")).toContainText(
    "def discounted_return",
  );
  const labRequests = [];
  page.on("request", (request) => labRequests.push(request.url()));
  await page.reload();
  await expect(page.locator(".lc-page")).toBeVisible();
  expect(
    labRequests.some((url) => /\/src\/(?:docs|style)\.css/.test(url)),
  ).toBeFalsy();
  const box = await page.locator(".lc-page").boundingBox();
  expect(box.x).toBe(0);
  expect(box.width).toBe(page.viewportSize().width);
  expect(box.height).toBe(page.viewportSize().height);
});

test("Python interpreter handles stdlib imports and shows print output", async ({
  page,
}) => {
  await page.goto("/lab.html#return");
  await page
    .locator("#code-editor")
    .fill(
      'import math\n\ndef discounted_return(rewards, gamma):\n    print("Python runtime:", math.sqrt(4))\n    return sum(reward * gamma ** i for i, reward in enumerate(rewards))',
    );
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.locator(".test-summary")).toContainText("5/5");
  await expect(page.locator(".lc-stdout")).toContainText("Python runtime: 2.0");
});

test("legacy lab bookmarks redirect to the independent Python page", async ({
  page,
}) => {
  await page.goto("/#lab/bellman");
  await expect(page).toHaveURL(/\/lab\.html#bellman/);
  await expect(page.locator(".lab-page-title h1")).toHaveText("Bellman Backup");
  await expect(
    page.getByRole("textbox", { name: "Your Python code" }),
  ).toContainText("def bellman_backup");
  await expect(page.locator(".doc-toc,.sidebar")).toHaveCount(0);
});

test("Python exception cases require the requested ValueError", async ({
  page,
}) => {
  await page.goto("/lab.html#rubric");
  await page.locator('[data-lc-console="cases"]').click();
  await page.locator("#lc-case-args").fill("[[1], [-1], true]");
  await page.locator("#lc-case-expected").fill("raise ValueError");
  await page
    .locator("#code-editor")
    .fill(
      'def rubric_reward(scores, weights, gate):\n    raise TypeError("wrong exception")',
    );
  await page.getByRole("button", { name: "Run selected case" }).click();
  await expect(page.locator("#lc-custom-result")).toContainText("Case failed");
  await page
    .locator("#code-editor")
    .fill(
      'def rubric_reward(scores, weights, gate):\n    raise ValueError("Invalid criterion")',
    );
  await page.getByRole("button", { name: "Run selected case" }).click();
  await expect(page.locator("#lc-custom-result")).toContainText("Case passed");
});
