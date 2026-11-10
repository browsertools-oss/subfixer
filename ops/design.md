# Design decisions (run log)

The source of truth for the look is the repo-root `DESIGN.md` (Box office: roll tickets).
Read it before any UI change. Record new decisions here so later runs follow them.

- 2026-11-10: The file is `ops/design.md` because the daily run reads `ops/` first; the
  durable spec stays in `DESIGN.md`. Keep them in sync: fix drift in `DESIGN.md` when found.
- 2026-11-10: Group name is "Convert" everywhere (code `GROUPS`, tabs, tickets, footer).
  `DESIGN.md` said "Format" in three places; fixed to "Convert" to match the UI.
- 2026-11-10: The five new convert pages (SRT to ASS, DFXP, SAMI, SBV, TTML) add no new
  layout. They reuse the shared tool template and the Convert roll color.
- 2026-11-10: The home page "Why it runs in your browser" no longer claims the tool keeps
  working offline. No service worker exists and OCR loads tesseract.js at runtime, so the
  claim was not true there either.
