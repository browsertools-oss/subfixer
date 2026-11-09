# SubFixer design

Box office. Every fix is a roll ticket you tear off. You pick the problem by what it looks like,
drop the file on a big ticket and watch the lines move back into sync on a timeline.
Direction: cinema roll tickets (seed fc2875a8fe78ff13, brief in `.impeccable/surfaces/`).

Keep it distinct from Stayfile (IBM Carbon: Plex, gray dashed drop area, green links, 48px
top bar) and from subtitlefixer.com. SubFixer uses none of those.

## Structure

- One tool. Every URL (home plus the fix pages in `src/site.ts`) renders the same tool,
  preset to that page's fix. Switching fixes is client-side and keeps the files.
- First viewport, left: h1 (800 weight), lede, the drop ticket, the trust row (Free, No upload,
  No sign-up). Right: the screen, a night still with a yellow subtitle and two lanes
  (Subtitle, Speech) where the cue slides from its late ghost into line with the speech.
- Below: "What is wrong with your subtitles?" as ticket rolls, one row per group (Timing,
  Text, Format). Nine tickets today. Each ticket has a vertical stub with the fix name, a perforation, a drawing
  and the symptom in plain words. Rolls use an auto-fill grid, so new fixes just add tickets.
  On phones each roll is a sideways scroll strip.
- After a file loads, the screen and drop ticket go away (`.tool.has-file`) and the tool
  shows: file bar, viewer (the current line on a dark screen, then the cue map with every
  line as a block, before in gray above, after in the group color below, overlaps in red, a
  yellow playhead you drag or move with arrow keys), fix tabs, the counter panel, Save as
  and Download, then the preview table.
- Reading options (`#srcOpts`) sit under the file bar and only appear when the file needs one:
  the frame rate for MicroDVD or Spruce files without one, the language for multi-language SAMI,
  reading speed and start time for plain text. Changing one re-reads the file in place.
- Picture subtitles (.sup) are read with OCR. While it runs, a raised box under the drop ticket
  shows the file name, a progress bar in the Format blue, a short warning and a Stop link. The
  reader (tesseract.js) loads only when a .sup file arrives. The OCR language sits in the reading options.
- Merge files is a tab like the others. "Add files" on the file bar appends files without
  dropping the ones already loaded.
- Below the tool: `.adslot` (empty, hidden until an ad exists), How it works as three
  numbered columns, Questions as hairline details, then the home-only sections.
- Footer: a sunk band with the link rolls in columns, each headed by its roll color dot.

## Ticket drawings

All symptom drawings share one grammar on a 240 x 64 viewBox: cue blocks in a lane at
y 14 to 28, a speech waveform at y 50. Ghost (dashed) blocks mark where a line should
be. Same baseline idea as the hero lanes. Drawn in `--print` on the ticket paper.

## Rules

- Roll colors carry the group everywhere: tickets, tab borders, the selected tab fill, the
  cue map's after lane, footer dots. Timing red-orange, Text green, Format blue.
- One primary action at a time: "Choose files" (yellow on the drop ticket) before a file is
  loaded, "Download fixed file" (ink fill) after.
- The drop ticket is printed on the opposite stock: ink in light mode, pale in dark mode.
  Drag-over adds a 4px yellow ring and a slight tilt.
- A picked ticket lifts, gets a 3px ink ring and a stamped "Picked" mark. State is never
  color alone.
- Ticket notches are CSS masks, perforations are dot gradients. No images.
- Never a thick colored border on one side of a box (the impeccable side-tab check is on).
  The error box gets a full 1px red border.
- Motion: the hero cue snap loop, ticket lift on hover, drop tilt. Ease-out only. All off under
  prefers-reduced-motion.
- Corners: 14 to 16px on big surfaces (drop, screen, counter), 10px tickets, 8px controls.

## Type

Atkinson Hyperlegible Next 400, 600 and 800 (Braille Institute, OFL), self-hosted latin
subset in `public/fonts` with `AtkinsonHyperlegibleNext-OFL.txt`. 800 for h1, h2, the drop
headline, stub caps and the brand. Body 17/1.6. h1 clamp 36 to 58px, tight tracking.
Hyphenated words in the h1 never break. Timecodes and format chips use the system mono stack.

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg (ground) | #e4e5e8 | #121015 |
| raise (panels) | #f3f3f5 | #1c1a21 |
| sunk (footer) | #d6d8dd | #0c0b0e |
| ink | #17151b | #efedf3 |
| soft | #4f4d57 | #aaa6b5 |
| rule | #c3c5cc | #2e2b35 |
| field | #7d7b86 | #6c6878 |
| stock / stock-ink (drop ticket) | #17151b / #f3f3f5 | #efedf3 / #17151b |
| timing / text / convert paper | #f2683a / #3db56d / #5a8ef0 | same |
| print (ink on paper) | #17110e | same |
| screen | #0b0a0e | #070609 |
| sub (subtitle yellow, Choose files) | #ffe14d | same |
| focus | #2f5bd3 | #8aa8ff |
| error | #c8102e | #ff6b7d |

## Finish review

Verdict: ships. Checked desktop 1440 and phone 390, light and dark, home, a loaded file and a
preset page, with no horizontal scroll. Detector clean. Functional run passes (encoding, ASS
italics, editor, cleaner, from-line shift, exports, batch zip, ticket switching, reset) with no
page errors and no non-GET requests. No raster images ship; every visual is inline SVG or CSS.
