# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: a casual watcher with a downloaded movie or episode whose subtitles are wrong. They
are early or late, drift, show garbled letters, carry [MUSIC] and speaker tags, or come in a
format the player will not open. They are mid-evening, video paused, and want it fixed in
under a minute without learning subtitle jargon. They usually arrive from Google with one
specific problem. Design for them first. Secondary: editors and uploaders who fix a
whole season or a batch of files at once. Don't block them.

## Product Purpose
SubFixer fixes subtitle files in the browser. Success is the file loading on the first try and the
fixed download playing in sync.

## Positioning
Everything runs on the visitor's device. Files are never uploaded. There is one tool: the file stays
loaded while the visitor switches between fixes, and every fix page is the same tool preset to that
fix. Free, with no account.

## Capabilities and Constraints
- Fixes: shift timing (all lines or from a line), change frame rate, sync two points, fix
  timing (overlaps, gaps, too short or too long), fix characters (encoding), clean up
  (including duplicates and renumbering), reading speed (check and rewrap), find and replace
  (batch rules, optional patterns), check and edit, convert format, merge files. Every fix shows
  a before and after preview, and any fix can be checked against a local video. More are coming,
  so the fix count grows past 7. Layouts must not hard-code seven.
- Batch: up to 100 files, downloaded as one zip.
- Formats in: SRT, VTT, ASS, SSA, MicroDVD SUB, SBV, SAMI, LRC, TTML, DFXP, YouTube XML, EBU and Spruce STL, TXT, Blu-ray SUP (read with OCR in the browser; tesseract.js and its language data load from the jsDelivr CDN only when a .sup file arrives).
  Formats out: subtitle formats plus TXT, CSV, DOCX and XLSX.
- Static Astro site on Cloudflare Pages. No server processing, no paid APIs ($50/mo cap).
  Heavy libraries are lazy-loaded.
- About 26 SEO URLs (`src/site.ts`). Each fix page's copy and URL must be kept.
- Business model: free, with display ads later and a planned paid batch tier. Leave room for one
  unobtrusive ad slot below the tool and a future "Pro batch" mention. Show no ads or upsell yet.

## Brand Commitments
- Name: SubFixer. Domain: subfixer.app.
- Copy rules (`.github/agent/daily.md`): plain sentences, no em or en dashes, no sales words.
- Keep it distinct from the sibling site Stayfile (IBM Carbon look) and from subtitlefixer.com.
- Font: Atkinson Hyperlegible Next, self-hosted with its license.
- Light and dark mode. Errors get a full red border.
- Tone: plain and helpful. A little playful is fine. Trust signals are free, no upload and no sign-up.
- The owner dislikes templated, sloppy-looking and text-heavy pages. He wants it visual.

## Evidence on Hand
There are no testimonials, usage numbers or press. Do not invent any.

## Product Principles
- Fix first, read later: the tool sits above every explanation.
- Plain words for symptoms: describe what the viewer sees, not what the format calls it.
- Nothing leaves the device. Make that visible and true.
- One tool, many doors: every page is the same tool, so switching fixes never loses the file.

## Accessibility & Inclusion
Readers may be tired, on a TV-room laptop or on a phone. Keep text legible, targets large and full
keyboard support. Do not rely on color alone to show a state.
