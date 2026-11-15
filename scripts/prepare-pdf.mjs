import { mkdir, cp } from "node:fs/promises";
// Keep PDF decoding/font support local to the site; no third-party CDN at runtime.
for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
  const destination = new URL(
    "../public/pdf-runtime/" + folder + "/",
    import.meta.url,
  );
  await mkdir(destination, { recursive: true });
  await cp(
    new URL("../node_modules/pdfjs-dist/" + folder + "/", import.meta.url),
    destination,
    { recursive: true },
  );
}
