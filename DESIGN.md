# SubFixer design

A plain document page. One column, type and space, one dark button. No design-system kit,
no cards, no decoration. The tool should read like a well-set page that happens to work.

Keep it distinct from Stayfile (sibling site), which is on IBM Carbon: Plex, a gray drop
area with a dashed frame, green links, a 48px top bar and a heading column beside each
section. SubFixer uses none of those.

## Structure

- One tool. Every URL (home plus the fix pages in `src/site.ts`) renders the same tool,
  preset to that page's fix. Drop a file once, then pick the fix. Switching fixes is
  client-side and keeps the file.
- No sidebar or menu. The footer has a single "Other fixes:" line of plain text links,
  then the privacy line.
- Column is 680px wide, left-aligned text, centered on the page. 24px side padding
  (16px on phones).

## Rules

- One primary action on screen at a time: "Choose a file" before a file is loaded,
  "Download fixed file" after. Both are the dark button (ink fill, 6px corners, 46px).
- The drop area has no frame at rest. While a file is dragged over it gets a light tint and
  a 2px ink outline. The whole page also accepts drops.
- The fix chooser is a row of plain words. The chosen fix is ink, bold and underlined. No
  segmented control, no pills.
- Inputs: 1px field border, 6px corners, 44px tall. Timecodes use the system mono stack.
- Lists are normal numbered lists. Questions are native details rows split by hairlines.
- Links are ink with a light underline that darkens on hover. Blue appears only as the
  focus ring.
- Never a thick colored border on one side of a box (the impeccable side-tab check is on).
  The error box gets a full 1px red border.
- No shadows, no animation, no images, no icons.

## Type

Atkinson Hyperlegible Next 400 and 600 (Braille Institute, OFL), self-hosted latin subset in
`public/fonts` with `AtkinsonHyperlegibleNext-OFL.txt`. Chosen for legibility, which suits
a subtitle tool. Body 17/1.6, small 15, h1 34/1.2 (28 on phones), h2 20/1.3.

## Tokens

| Token | Light | Dark |
|---|---|---|
| bg | #ffffff | #141414 |
| tint (drag-over) | #f3f2ef | #1f1f1e |
| ink | #1c1c1c | #ecebe8 |
| soft (secondary text) | #5c5c5c | #a8a6a1 |
| rule (hairlines) | #e4e2dd | #2e2d2b |
| field (input borders) | #8f8d87 | #6e6d68 |
| btn / btn-text | #1c1c1c / #ffffff | #ecebe8 / #141414 |
| focus | #2f5bd3 | #8aa8ff |
| error | #c8102e | #ff6b7d |
