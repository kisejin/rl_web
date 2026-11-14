export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_TEXT = 24000;
export const MAX_IMAGE_DATA = 500000;
export function validateAttachments(value = []) {
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS)
    throw new Error("Attach up to three files.");
  let textSize = 0;
  return value.map((file, i) => {
    if (!file || typeof file.name !== "string")
      throw new Error("Invalid attachment.");
    const name = file.name
      .split(/[\\/]/)
      .at(-1)
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 100);
    if (!name) throw new Error("Choose a named file.");
    const base = { id: String(i + 1), name, partial: !!file.partial };
    if (
      file.kind === "text" &&
      typeof file.text === "string" &&
      file.text.trim() &&
      file.text.length <= MAX_ATTACHMENT_TEXT
    ) {
      textSize += file.text.length;
      if (textSize > 32000)
        throw new Error(
          "Attached text exceeds 32,000 characters. Remove a file or use a shorter excerpt.",
        );
      return {
        ...base,
        kind: "text",
        text: file.text,
        pages: Math.min(20, Math.max(0, Number(file.pages) || 0)),
      };
    }
    if (
      file.kind === "image" &&
      typeof file.dataUrl === "string" &&
      file.dataUrl.length <= MAX_IMAGE_DATA &&
      /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        file.dataUrl,
      ) &&
      Number.isInteger(file.width) &&
      Number.isInteger(file.height) &&
      file.width > 0 &&
      file.height > 0 &&
      file.width <= 1600 &&
      file.height <= 1600
    ) {
      let bytes;
      try {
        bytes = atob(file.dataUrl.split(",")[1]);
      } catch {
        throw new Error("Unreadable image.");
      }
      const png = bytes.startsWith("\x89PNG\r\n\x1a\n");
      const jpeg = bytes.startsWith("\xff\xd8\xff");
      if ((!png && !jpeg) || png !== file.dataUrl.startsWith("data:image/png;"))
        throw new Error("Invalid image bytes.");
      return {
        ...base,
        kind: "image",
        dataUrl: file.dataUrl,
        width: file.width,
        height: file.height,
      };
    }
    throw new Error(
      "Unsupported or oversized attachment. Use a text PDF, code/text, PNG or JPEG.",
    );
  });
}
