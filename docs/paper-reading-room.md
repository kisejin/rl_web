# Paper mathematics and visual galleries

Every collected paper has a **Math to know** disclosure and a **Figures & tables** reading room. Mathematics recommendations are available immediately from metadata/abstracts. Opening the reading room requests a full-text HTML conversion and upgrades the guide when source evidence is available.

## Mathematics recommendations

`src/paper-prerequisites.js` is a curated catalog of mathematical concepts, reference equations and links into the existing learning atlas. Probability and linear algebra are general foundations; additional concepts are matched to terms in the title/abstract or retrieved HTML body. Each recommendation identifies its basis and, when matched, includes a short source excerpt explaining why it was suggested. Bibliographies and site controls are excluded from full-text matching.

These are reading recommendations, not an author-certified prerequisite list or an AI claim to have proved the paper. The displayed equations are teaching references. Math cards link to the relevant theory and the existing chatbot’s paper-specific prerequisites section.

## Figures and semantic tables

`GET /api/paper-content?paperId=<collected-id>` accepts only IDs in the server-owned collection. It tries arXiv HTML and then ar5iv using bounded requests and same-paper redirect checks. The parser:

- Collects image assets, including SVGs supplied through HTML `object` elements and subpanels with inherited parent captions.
- Scans the complete converted document, including available appendices.
- Extracts semantic tables while excluding equation-layout tables; cell spans, captions and MathML’s source TeX are retained.
- Generates source anchors and reports unsupported visual formats explicitly. External/non-paper asset URLs are rejected.
- Labels unavailable or unusable conversions as PDF-only instead of claiming the paper contains zero figures or tables.

Images open in an enlargement dialog; wide tables scroll horizontally. Captions, table cells and prerequisite equations use the existing safe KaTeX renderer. Original-source links remain available.

The manifest is cached in bounded warm-process memory and Vercel Blob at `research/paper-content/<id>.json`; source revision changes invalidate it. Successful conversions are reused for one day; unsuccessful conversions have a shorter retry window. Extraction happens when a paper’s reading room is opened, rather than downloading every full paper on every feed load.

## Complete PDF fallback and cross-check

The Complete PDF tab renders original pages with the existing PDF.js dependency. It is available even when HTML conversion fails and includes the appendix pages. It is explicitly a page gallery, not a claim of individually segmented figure/table extraction. Up to six pages are rendered at once; page navigation/goto accesses all pages, and a page can be enlarged.

`GET /api/paper-pdf?paperId=<collected-id>` streams only the canonical arXiv PDF for an existing collected ID, with checked MIME type, PDF signature, redirect destinations and a 48 MiB in-app limit. Oversized or unavailable PDFs retain the original arXiv PDF link. Client workers/render tasks are destroyed on dialog close/navigation. Standard fonts, CMaps and WASM decoders are bundled locally by `scripts/prepare-pdf.mjs` rather than fetched from a third-party CDN.

HTML conversion can differ from a PDF, so counts describe **assets/tables found in that HTML**, not a certificate of completeness for every format/version. The complete original PDF is the visual reference when conversion omits an object or a format is unsupported.

## Verification

Tests cover source-bound URLs and redirects, subpanels, appendix inclusion, semantic/equation table separation, mathematical angle brackets, row/column spans, prerequisite evidence and reference TeX, cache coalescing/revisions, canonical-ID authorization and a real streaming PDF proxy. Browser tests use a deliberately authored eight-page PDF with diagrams/tables and the real PDF worker, reach its final appendix page, enlarge a page, exercise gallery dialogs and verify narrow-screen containment and cleanup.
