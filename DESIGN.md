# SubFixer design

Built on Vercel's Geist design language (light and dark) for color, spacing, corners and
components, applied by hand in
`src/layouts/Base.astro` so the site stays one small static CSS file. No UI packages.

Why Geist: SubFixer is a quiet utility. Geist is near-white canvas, ink text, hairline
borders, soft 6 to 12px corners and one black primary button. It reads calm and technical
without decoration.

Keep it distinct from Stayfile (sibling site), which is on IBM Carbon: Plex, square
corners, green accent, a 48px top bar and a narrow heading column beside each section.
SubFixer uses none of those.

## Rules

- Primary action is ink (#171717 light, #ededed dark). Blue is only for text links and the
  focus ring. No other accent color.
- Corners: 6px on buttons, inputs, tabs and the error box; 8px on the tab track and preview
  table; 12px on cards (drop zone, loaded tool, FAQ). Round step numbers are full circles.
- Depth: 1px hairlines plus a faint two-layer shadow on cards. No heavy shadows.
- Never a thick colored border on one side of a box (the impeccable side-tab check is on).
  The error box gets a full 1px red border.
- Top bar is 64px (56px on phones), canvas background with a bottom hairline.
- Desktop (1056px+) shows the tool list as a left sidebar. The current page gets a gray
  rounded fill, not a side bar. Phones rely on the footer list.
- Type: Atkinson Hyperlegible Next 400, 500 and 600 (Braille Institute, OFL), self-hosted
  latin subset in `public/fonts` with `AtkinsonHyperlegibleNext-OFL.txt`. It replaces the
  Geist face because Geist is on the impeccable overused-font list. It was drawn for
  legibility, which suits a subtitle tool. No other web font. Timecodes, file names and
  numbers use the system mono stack.
- Scale (px): h1 32/40 at -0.6 tracking (24/32 at -0.4 on phones), h2 20/28 at -0.2,
  body 16/24, small 14/20, labels 13/16 weight 500. Atkinson is wide, so body tracking
  stays at 0.
- Spacing: 4, 8, 12, 16, 24, 32, 40, 48, 64.
- Tool tabs are a segmented control and scroll sideways on phones.
- Sections below the tool stack the heading on top of the content.
- No scroll effects, no animation beyond 150ms color and border changes, no images.

## Tokens

| Token | Light | Dark |
|---|---|---|
| canvas (cards, top bar) | #ffffff | #0a0a0a |
| canvas-soft (page) | #fafafa | #000000 |
| canvas-soft-2 (tab track, current nav) | #f5f5f5 | #1a1a1a |
| hover | #f2f2f2 | #1f1f1f |
| hairline | #ebebeb | #2e2e2e |
| hairline-strong | #a1a1a1 | #707070 |
| ink | #171717 | #ededed |
| body | #4d4d4d | #a1a1a1 |
| mute | #666666 | #a1a1a1 |
| primary | #171717 | #ededed |
| link | #0761d1 | #52a8ff |
| focus | #0070f3 | #52a8ff |
| error | #ee0000 | #ff6166 |
| error-soft | #fff0f0 | #2a1314 |
