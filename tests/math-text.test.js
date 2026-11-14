import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { mathText } from "../src/math-text.js";
import { labs } from "../src/content.js";

test("every lab equation and authored math fragment is valid LaTeX", () => {
  for (const lab of labs) {
    assert.ok(lab.equation, lab.id);
    for (const formula of [lab.equation, lab.exampleMath].filter(Boolean))
      assert.doesNotThrow(
        () =>
          katex.renderToString(formula, {
            throwOnError: true,
            strict: "error",
          }),
        lab.id,
      );
    for (const field of [
      lab.desc,
      lab.input,
      lab.output,
      lab.hint,
      lab.proof,
      ...(lab.checks || []),
    ].filter(Boolean)) {
      for (const match of field.matchAll(
        /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,
      ))
        assert.doesNotThrow(
          () =>
            katex.renderToString(match[1] ?? match[2], {
              throwOnError: true,
              strict: "error",
            }),
          `${lab.id}: ${match[0]}`,
        );
      assert.ok(!mathText(field).includes("katex-error"), lab.id);
    }
  }
});
test("math text renders inline, display, fractions and norms while keeping code literal", () => {
  const markup = mathText(
    String.raw`With \(\gamma<1\), prove \[\lVert V-V^*\rVert_\infty\leq\frac{\delta}{1-\gamma}\]. Use ` +
      "`done=true`" +
      ".",
  );
  assert.match(markup, /lab-math-inline/);
  assert.match(markup, /lab-math-block/);
  assert.match(markup, /mfrac/);
  assert.match(markup, /<code class="inline-code">done=true<\/code>/);
  const literal = mathText("`\\(not math\\)`");
  assert.ok(!literal.includes('class="katex"'));
  assert.match(literal, /not math/);
});
test("prose and code are HTML-escaped and KaTeX trusted commands stay disabled", () => {
  const output = mathText(
    "<img src=x onerror=alert(1)> and `<script>alert(1)</script>`",
  );
  assert.ok(!output.includes("<img"));
  assert.ok(!output.includes("<script"));
  assert.match(output, /&lt;img/);
  const blocked = mathText(String.raw`\(\href{javascript:alert(1)}{click}\)`);
  assert.ok(!blocked.includes("<a "));
});
