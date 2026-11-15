import katex from "katex";
import { escapeText } from "./math-text.js";
// Escape source text; only explicitly delimited mathematics is interpreted.
export function researchMath(value) {
  const input = String(value ?? "").slice(0, 20000);
  const pattern =
    /`[^`\n]*`|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$|\s)[^\n$]*?[^\s$\\]\$(?!\$)|\\begin\{(align\*?|equation\*?|gather\*?|aligned|gathered)\}[\s\S]*?\\end\{\1\}/g;
  let output = "",
    start = 0,
    count = 0;
  for (const match of input.matchAll(pattern)) {
    output += escapeText(input.slice(start, match.index));
    const token = match[0];
    if (token.startsWith("`") || ++count > 64) {
      output += escapeText(token);
      start = match.index + token.length;
      continue;
    }
    const environment = token.startsWith("\\begin"),
      display =
        environment || token.startsWith("$$") || token.startsWith("\\[");
    const tex = environment
      ? token
      : token.slice(
          display ? 2 : token.startsWith("\\(") ? 2 : 1,
          display ? -2 : token.startsWith("\\(") ? -2 : -1,
        );
    try {
      if (tex.length > 5000) throw new Error("Long formula");
      output += `<span class="research-math ${display ? "research-math-block" : "research-math-inline"}">${katex.renderToString(tex, { displayMode: display, throwOnError: true, trust: false, strict: "ignore", maxExpand: 1000, maxSize: 20 })}</span>`;
    } catch {
      output += `<code class="research-math-fallback" title="Original TeX: unsupported or incomplete formula">${escapeText(token)}</code>`;
    }
    start = match.index + token.length;
  }
  return output + escapeText(input.slice(start));
}
