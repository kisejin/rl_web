import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  MAX_ATTACHMENT_TEXT,
  MAX_IMAGE_DATA,
  validateAttachments,
} from "./tutor-attachments.js";
export async function prepareTutorFile(file) {
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new Error("Choose a non-empty file under 10 MB.");
  if (
    /\.(png|jpe?g|webp)$/i.test(file.name) ||
    ["image/png", "image/jpeg", "image/webp"].includes(file.type)
  ) {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let quality = 0.84,
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > MAX_IMAGE_DATA && quality > 0.35) {
        quality -= 0.12;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      return validateAttachments([
        {
          name: file.name,
          kind: "image",
          dataUrl,
          width: canvas.width,
          height: canvas.height,
        },
      ])[0];
    } finally {
      bitmap.close();
    }
  }
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      useSystemFonts: true,
    });
    let pdf;
    try {
      pdf = await task.promise;
      let text = "",
        read = 0;
      for (
        let i = 1;
        i <= Math.min(pdf.numPages, 20) && text.length < MAX_ATTACHMENT_TEXT;
        i++
      ) {
        const page = await pdf.getPage(i),
          content = await page.getTextContent();
        text +=
          `\n[Page ${i}]\n` +
          content.items
            .map((item) => item.str + (item.hasEOL ? "\n" : " "))
            .join("");
        read++;
      }
      if (text.replace(/\[Page \d+\]/g, "").trim().length < 5)
        throw new Error(
          "This PDF has no selectable text. Attach a screenshot of the page as an image.",
        );
      return validateAttachments([
        {
          name: file.name,
          kind: "text",
          text: text.slice(0, MAX_ATTACHMENT_TEXT),
          pages: read,
          partial: read < pdf.numPages || text.length > MAX_ATTACHMENT_TEXT,
        },
      ])[0];
    } finally {
      await task.destroy();
    }
  }
  if (/\.(txt|md|py|json|csv|ipynb)$/i.test(file.name)) {
    const text = await file.text();
    return validateAttachments([
      {
        name: file.name,
        kind: "text",
        text: text.slice(0, MAX_ATTACHMENT_TEXT),
        partial: text.length > MAX_ATTACHMENT_TEXT,
      },
    ])[0];
  }
  throw new Error(
    "Use PNG/JPEG/WebP, a text PDF, or .py, .txt, .md, .json, .csv or .ipynb.",
  );
}
