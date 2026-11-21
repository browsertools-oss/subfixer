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
- 2026-11-13: The fix tabs now follow the tabs pattern: each tab has an id and
  `aria-controls`, each panel is `role="tabpanel"` with `aria-labelledby`, and the selected
  tab is the only one in the tab order (roving tabindex, arrow keys and Home/End move and
  activate). On phone width (<=599px) the tab strip keeps its horizontal scroll and fades
  out at the right edge (mask-image gradient, about 30px) instead of hiding the scrollbar
  with no cue. The ticket rolls keep their 82% peek instead; no other change.
- 2026-11-15: On screens under 1000px the Convert footer roll folds behind a hairline
  `<details>` summary reading "Convert (N)" with the live page count (53 as of today), the
  same disclosure pattern as the FAQ. The count is computed from the page list on every
  page, so it does not drift. The list stays in the HTML for crawlers and stays keyboard
  reachable; only the visual wall of links is collapsed. At 1000px and up the summary is
  hidden and the list shows as the two-column roll it was. Chosen over trimming links, for
  the same reason as the 2026-11-11 entry: the roll is the site's internal-link graph.
- 2026-11-15: The fold relies on author CSS beating the UA rule that hides a closed
  details' content (`details:not([open]) > :not(summary) { display: none }`). The summary
  is hidden at 1000px and up while `.foot-fold > ul` is forced to `display: block`, and the
  details itself carries no `open` attribute. Verified by reasoning, not by rendering: no
  browser is available in this environment, so any change to this pattern needs a render
  check (or the fallback: render the same list twice, once inside the details and once
  outside, both from the same page list).
- 2026-11-15: The two guides pass `ogType="article"` to Base; every other page keeps the
  default `website`. Matches their Article JSON-LD. No visual change.
- 2026-11-15: ToolPage gained an optional `example?: { before, after, note }` field, rendered
  as "What changes in your file" after "How it works": a note line, then two labelled
  `<pre class="sample">` blocks (Before and After), monospace, overflow-x:auto, small type,
  two columns at 900px and up, one column below. An optional `guide` slug renders a
  "Read the guide: <title>" link under the FAQ. Examples are 2-3 cues and the `after` text is
  the tool's real output (locked by a test that rebuilds it). Chosen over a screenshot: text
  stays crawlable and matches the file the visitor gets.
- 2026-11-16: New /guides/ index page (h1 "Subtitle guides", one line per guide with a
  one-sentence summary, no new layout; reuses the 404/guide plainlist styles). The footer
  "Guides" heading is now an anchor to /guides/ instead of a plain <p>; the home Guides
  section gained a "See all guides" link under the list. Chosen so the guides hub is
  reachable from every page and from the home page.
- 2026-11-17: Guide tables (the symptom table in /guides/subtitles-weird-characters/) are
  wrapped in `.table-wrap` (overflow-x: auto, margin 16px 0) so a wide table scrolls inside
  its wrapper at 360px instead of pushing the page sideways. `<pre class="sample">` blocks
  already scroll the same way. Chosen over shrinking table type below phone size.
- 2026-11-17: Saved presets (backlog item 4, the first Pro feature) ship behind `?pro=1`.
  The tool stores the last mode and its settings in localStorage under `subfixer.presets`
  and reads them back only when the URL carries the flag. No pricing, no new visible UI, no
  page for anyone without the flag; serialize/parse are unit-tested. Chosen as the smallest
  useful Pro slice that does not leak into the free experience.
- 2026-11-21: The home page has a "Fix a common problem" section, one line per guide in
  `GUIDES` (link text is the guide title), placed under the ad slot and above "How it works".
  It lives in ToolPage.astro behind the `home` flag because src/pages/index.astro only renders
  ToolPage. Same `block` and `plainlist` styles as the Guides section; no new layout.
