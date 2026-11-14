import katex from "katex";

export const escapeText = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Explicit author markup only: LaTeX \(...\), display \[...\], and `code`.
// Escape prose before inserting HTML. Never interpret code examples as math.
export function mathText(text) {
  const input = String(text ?? ""),
    pattern = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|`([^`\n]+)`/g;
  let result = "",
    start = 0;
  for (const match of input.matchAll(pattern)) {
    result += escapeText(input.slice(start, match.index));
    if (match[3] !== undefined)
      result += `<code class="inline-code">${escapeText(match[3])}</code>`;
    else {
      const display = match[1] !== undefined,
        source = display ? match[1] : match[2];
      result += `<span class="lab-math ${display ? "lab-math-block" : "lab-math-inline"}">${katex.renderToString(source, { displayMode: display, throwOnError: false, trust: false, strict: "error" })}</span>`;
    }
    start = match.index + match[0].length;
  }
  return result + escapeText(input.slice(start));
}
