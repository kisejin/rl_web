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
    expect(route.request().headers().accept).toBe("text/event-stream");
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
    "stream",
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

async function installTutorStream(page) {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    let controller;
    window.__tutorStreamClosed = false;
    window.fetch = async (url, options) => {
      if (url !== "/api/tutor") return original(url, options);
      window.__tutorStreamRequest = JSON.parse(options.body);
      const body = new ReadableStream({
        start(c) {
          controller = c;
          options.signal.addEventListener(
            "abort",
            () => {
              window.__tutorStreamClosed = true;
              c.error(options.signal.reason);
            },
            { once: true },
          );
        },
        cancel() {
          window.__tutorStreamClosed = true;
        },
      });
      return new Response(body, {
        headers: { "Content-Type": "text/event-stream" },
      });
    };
    window.__tutorEmit = (event, data, bytewise = false) => {
      const bytes = new TextEncoder().encode(
        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
      if (bytewise) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      } else controller.enqueue(bytes);
    };
    window.__tutorEnd = () => {
      window.__tutorStreamClosed = true;
      controller.close();
    };
  });
}
test("answer text appears before streaming completes, with UTF-8, live math and safe code rendering", async ({
  page,
}) => {
  await installTutorStream(page);
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain this inequality.");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.evaluate(() => {
    window.__tutorEmit("meta", { model: "qwen3.8-flash" });
    window.__tutorEmit(
      "delta",
      { text: "Tiếng Việt 🧠: First words arrive now.\n\n" },
      true,
    );
  });
  await expect(page.locator(".tutor-assistant .tutor-answer")).toContainText(
    "Tiếng Việt 🧠: First words arrive now.",
  );
  await expect(page.locator(".tutor-assistant")).toHaveClass(/is-streaming/);
  await expect(
    page.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__tutorStreamClosed)).toBeFalsy();
  expect(await page.evaluate(() => window.__tutorStreamRequest.stream)).toBe(
    true,
  );
  await page.evaluate(() =>
    window.__tutorEmit("delta", {
      text: '\\[\\gamma<1\\]\n\n```python\nvalue = 1\n```\n\n<img src=x onerror="window.streamXss=true">',
    }),
  );
  await expect(page.locator(".tutor-assistant .katex-display")).toHaveCount(1);
  await expect(page.locator(".tutor-assistant pre code")).toContainText(
    "value = 1",
  );
  await expect(page.locator(".tutor-assistant img")).toHaveCount(0);
  expect(await page.evaluate(() => window.streamXss)).toBeUndefined();
  await page.evaluate(() => {
    window.__tutorEmit("done", { truncated: false });
    window.__tutorEnd();
  });
  await expect(
    page.getByRole("button", { name: "Send question" }),
  ).toBeVisible();
  await expect(page.locator(".tutor-assistant")).not.toHaveClass(
    /is-streaming/,
  );
  await expect(
    page.getByRole("button", { name: "Copy tutor answer" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText("Tiếng Việt 🧠");
  await expect(page.locator(".tutor-answer-status")).toHaveCount(0);
});
test("stopping a streamed answer preserves the received text as a partial answer", async ({
  page,
}) => {
  await installTutorStream(page);
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain the proof.");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.evaluate(() =>
    window.__tutorEmit("delta", {
      text: "Keep this useful partial explanation.",
    }),
  );
  await expect(page.locator(".tutor-assistant")).toContainText(
    "Keep this useful partial explanation.",
  );
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator(".tutor-error")).toContainText(
    "partial answer has been kept",
  );
  await expect(page.locator(".tutor-answer-status")).toHaveText(
    "Partial answer",
  );
  await expect(page.locator(".tutor-user")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "Keep this useful partial explanation.",
  );
  await expect(page.locator(".tutor-answer-status")).toHaveText(
    "Partial answer",
  );
});
test("an interrupted stream retains partial output and reports that it did not finish", async ({
  page,
}) => {
  await installTutorStream(page);
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain this step.");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.evaluate(() => {
    window.__tutorEmit("delta", { text: "The first step is useful." });
    window.__tutorEnd();
  });
  await expect(page.locator(".tutor-error")).toContainText("connection ended");
  await expect(page.locator(".tutor-assistant")).toContainText(
    "The first step is useful.",
  );
  await expect(page.locator(".tutor-answer-status")).toHaveText(
    "Partial answer",
  );
  await expect(
    page.getByRole("combobox", { name: "Tutor model", exact: true }),
  ).toBeEnabled();
});

test("a batched completed response still reveals progressively before saving", async ({
  page,
}) => {
  await installTutorStream(page);
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain the concept.");
  await page.getByRole("button", { name: "Send question" }).click();
  const text = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
  await page.evaluate((text) => {
    window.__tutorEmit("delta", { text });
    window.__tutorEmit("done", { truncated: false });
    window.__tutorEnd();
  }, text);
  await expect(page.locator(".tutor-answer-status")).toHaveText("Displaying…");
  const prefix = await page
    .locator(".tutor-assistant .tutor-answer")
    .innerText();
  expect(prefix.length).toBeGreaterThan(0);
  expect(prefix.length).toBeLessThan(text.length);
  expect(text.startsWith(prefix.trimEnd())).toBeTruthy();
  await expect(page.locator(".tutor-assistant")).not.toHaveClass(
    /is-streaming/,
  );
  await expect(page.locator(".tutor-assistant .tutor-answer")).toHaveText(text);
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator(".tutor-assistant .tutor-answer")).toHaveText(text);
});

test("Stop during queued display keeps the visible prefix without dumping the backlog", async ({
  page,
}) => {
  await installTutorStream(page);
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain the proof.");
  await page.getByRole("button", { name: "Send question" }).click();
  await page.evaluate(() => {
    window.__tutorEmit("delta", { text: "queued ".repeat(1000) });
    window.__tutorEmit("done", { truncated: false });
    window.__tutorEnd();
  });
  await expect(page.locator(".tutor-answer-status")).toHaveText("Displaying…");
  const shown = await page.evaluate(() => {
    const text = document
      .querySelector(".tutor-assistant .tutor-answer")
      .textContent.trim();
    document.querySelector("[data-tutor-stop]").click();
    return text;
  });
  expect(shown.length).toBeLessThan(7000);
  await expect(page.locator(".tutor-answer-status")).toHaveText(
    "Partial answer",
  );
  await expect(page.locator(".tutor-assistant .tutor-answer")).toHaveText(
    shown,
  );
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(page.locator(".tutor-assistant .tutor-answer")).toHaveText(
    shown,
  );
});
