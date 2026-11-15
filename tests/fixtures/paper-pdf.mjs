// A small original PDF fixture with figures/tables drawn as page content.
export function makePaperPdf(pages = 8) {
  const objects = [];
  const add = (value) => {
    objects.push(value);
    return objects.length;
  };
  const catalog = add(""),
    tree = add(""),
    font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    kids = [];
  for (let n = 1; n <= pages; n++) {
    const stream = `BT /F1 16 Tf 30 365 Td (Original paper - Page ${n}) Tj 0 -28 Td (Figure ${n}: a diagram) Tj ET\n0.2 0.4 0.7 rg 40 200 150 90 re f\n0 0 0 RG 30 70 240 90 re S 30 100 m 270 100 l S 150 70 m 150 160 l S\nBT /F1 12 Tf 35 140 Td (Table ${n}) Tj 0 -25 Td (Method / Result) Tj 0 -30 Td (${n === pages ? "Appendix result" : "Observed result"}: ${n}) Tj ET\n`;
    const content = add(
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    );
    kids.push(
      add(
        `<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 300 400] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${tree} 0 R >>`;
  objects[tree - 1] =
    `<< /Type /Pages /Count ${pages} /Kids [${kids.map((k) => k + " 0 R").join(" ")}] >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((value, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${value}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
