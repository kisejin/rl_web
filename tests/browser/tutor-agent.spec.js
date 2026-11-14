import { test, expect } from "@playwright/test";
function planReply() {
  const state = {
    goal: "Understand Bellman",
    status: "active",
    steps: [
      { id: "1", title: "Prove contraction", status: "pending" },
      { id: "2", title: "Implement value iteration", status: "pending" },
    ],
  };
  return [
    ["agent", { type: "status", label: "Built-in MCP connected · 6 tools" }],
    ["agent", { type: "tool", name: "update_plan", status: "running" }],
    ["agent", { type: "plan", state }],
    [
      "agent",
      {
        type: "sources",
        sources: [
          { title: "Bellman lesson", url: "/#lesson/bellman" },
          { title: "Unsafe", url: "javascript:alert(1)" },
        ],
      },
    ],
    ["agent", { type: "tool", name: "update_plan", status: "done" }],
    ["delta", { text: "Your learning plan is ready." }],
    ["done", { truncated: false }],
  ]
    .map(
      ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    )
    .join("");
}
test("agent controls, real-event plan UI, manual progress and goals persist per section", async ({
  page,
}) => {
  let request,
    calls = 0;
  await page.route("**/api/tutor", async (route) => {
    calls++;
    request = route.request().postDataJSON();
    await route.fulfill({
      contentType: "text/event-stream",
      body: planReply(),
    });
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("/goal Understand Bellman");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-agent-activity summary")).toContainText(
    "goal saved",
  );
  expect(calls).toBe(0);
  await page.getByRole("button", { name: /Plan & goal/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Learning goal", exact: true }),
  ).toHaveValue("Understand Bellman");
  await page.getByRole("button", { name: "Ask for a plan" }).click();
  await page
    .getByRole("combobox", { name: "Tutor skill" })
    .selectOption("proof");
  await page.getByRole("checkbox", { name: "Search papers" }).check();
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText("plan is ready");
  expect(request.agent.mode).toBe("plan");
  expect(request.agent.skill).toBe("proof");
  expect(request.agent.webSearch).toBe(true);
  await page.locator(".tutor-agent-activity summary").click();
  await expect(page.locator(".tutor-agent-sources a")).toHaveCount(1);
  await page.getByRole("button", { name: /Plan & goal/ }).click();
  await expect(page.locator(".tutor-plan-steps li")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "Complete plan step 1" }).check();
  await page.getByRole("button", { name: "Close learning plan" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page.getByRole("button", { name: /Plan & goal/ }).click();
  await expect(
    page.getByRole("checkbox", { name: "Complete plan step 1" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Close learning plan" }).click();
  await page
    .getByRole("combobox", { name: "Tutor lesson", exact: true })
    .selectOption("foundations");
  await page.getByRole("button", { name: /Plan & goal/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Learning goal", exact: true }),
  ).toHaveValue("");
  await expect(page.locator(".tutor-plan-steps li")).toHaveCount(0);
});
function makePDF() {
  const stream =
    "BT /F1 14 Tf 30 250 Td (Bellman fixed point V equals T V.) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let text = "%PDF-1.4\n",
    offsets = [0];
  for (const [i, obj] of objects.entries()) {
    offsets.push(Buffer.byteLength(text));
    text += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  }
  const xref = Buffer.byteLength(text);
  text +=
    `xref\n0 6\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(text);
}
test("image, real PDF and Python attachments are prepared and sent with the chosen model", async ({
  page,
}) => {
  let request;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/tutor", async (route) => {
    request = route.request().postDataJSON();
    await route.fulfill({
      json: {
        reply: "The attached PDF discusses a Bellman fixed point.",
        model: "gemini-3.8-flash",
      },
    });
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await page
    .getByRole("combobox", { name: "Tutor model", exact: true })
    .selectOption("gemini-3.8-flash");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 180, 80);
    ctx.fillStyle = "black";
    ctx.font = "20px sans-serif";
    ctx.fillText("gamma < 1", 10, 40);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Choose attachments").setInputFiles([
    { name: "proof.pdf", mimeType: "application/pdf", buffer: makePDF() },
    {
      name: "value.py",
      mimeType: "text/plain",
      buffer: Buffer.from("def value_iteration():\n    pass\n"),
    },
    {
      name: "equation.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    },
  ]);
  await expect(page.locator(".tutor-file-chip")).toHaveCount(3, {
    timeout: 30000,
  });
  await expect(page.locator(".tutor-file-chip img")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Your question about this lesson" })
    .fill("Explain these files.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-assistant")).toContainText(
    "Bellman fixed point",
  );
  expect(request.attachments).toHaveLength(3);
  expect(request.attachments[0].text).toContain("Bellman fixed point");
  expect(request.attachments[1].text).toContain("def value_iteration");
  expect(request.attachments[2].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  await expect(page.locator(".tutor-message-files")).toContainText("proof.pdf");
  await page.getByRole("button", { name: "Remove equation.png" }).click();
  await expect(page.locator(".tutor-file-chip")).toHaveCount(2);
  expect(errors).toEqual([]);
});
test("unsupported files are rejected without sending them or losing the typed question", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/tutor", async (route) => {
    calls++;
    await route.fulfill({ json: { reply: "Answer" } });
  });
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("Keep my question.");
  await page.getByLabel("Choose attachments").setInputFiles({
    name: "program.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not an allowed file"),
  });
  await expect(page.locator(".tutor-error")).toContainText("Use PNG/JPEG");
  await expect(input).toHaveValue("Keep my question.");
  expect(calls).toBe(0);
  await expect(page.locator(".tutor-file-chip")).toHaveCount(0);
});
test("agent workspace and dialogs fit a 320px mobile lab and support expansion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/lab.html#rubric");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  await expect(
    page.getByRole("button", { name: "Attach files" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send question" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Expand tutor", exact: true }).click();
  await expect(page.locator(".tutor-panel")).toHaveClass(/is-expanded/);
  await page.getByRole("button", { name: "MCP & skills", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "MCP tools and skills" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "/skill proof", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your question about this lesson" }),
  ).toHaveValue("/skill proof");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("combobox", { name: "Tutor skill" })).toHaveValue(
    "proof",
  );
  const bounds = await page.locator(".tutor-panel").boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
  await page.getByRole("button", { name: /Plan & goal/ }).click();
  const modal = await page
    .getByRole("dialog", { name: "Learning plan and goal" })
    .boundingBox();
  expect(modal.x).toBeGreaterThanOrEqual(0);
  expect(modal.width).toBeLessThanOrEqual(320);
});

test("a model image rejection recommends the verified model and retains the question and attachment", async ({
  page,
}) => {
  await page.route("**/api/tutor", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "The model could not process the request." },
    }),
  );
  await page.goto("/#lesson/bellman");
  await page.getByRole("button", { name: "Open AI study tutor" }).click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 20;
    canvas.height = 20;
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Choose attachments")
    .setInputFiles({
      name: "plot.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(page.locator(".tutor-file-chip")).toHaveCount(1);
  const input = page.getByRole("textbox", {
    name: "Your question about this lesson",
  });
  await input.fill("Read the image.");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".tutor-error")).toContainText("Qwen 3.8 Flash");
  await expect(input).toHaveValue("Read the image.");
  await expect(page.locator(".tutor-file-chip")).toHaveCount(1);
});
