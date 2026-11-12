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
- 2026-11-11: The Convert footer roll grew to 30+ links, far taller than the other rolls.
  At 1000px and wider, `.foot-roll[data-group='convert']` spans two grid cells and its
  links are set in two CSS columns; items keep `break-inside: avoid`. Below 1000px the
  roll is unchanged (the grid already collapses). Chosen over trimming footer links,
  because they are the site's internal-link graph.
- 2026-11-11: The picker and tab roll labels said "Format" while the footer and tabs were
  meant to say "Convert" (see the 2026-11-10 entry). The remaining label in Tool.astro was
  renamed, so all three roll displays now read Convert.
- 2026-11-12: Added src/pages/404.astro, a noindex page in the site's own look (h1, lede,
  "Fix a subtitle problem", "Convert a file", "Or read the guides" sections, links to the
  common fixes). Base.astro gained a `noindex` prop that writes a robots meta tag;
  the sitemap filter excludes /404. For hosts that serve 404.html. The page adds no new
  layout: it reuses the block sections and plainlist styles from the guides and home.
