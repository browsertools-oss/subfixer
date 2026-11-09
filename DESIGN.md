# SubFixer design

Built on IBM Carbon's tokens (white theme for light, g100 for dark), applied by hand in
`src/layouts/Base.astro` so the site stays one small static CSS file. No Carbon packages.

Why Carbon: SubFixer is a utility. Carbon is made for dense, calm product UI: square
corners, 1px hairlines, gray layers instead of shadows, one blue accent.

Keep it distinct from Stayfile (sibling site), which uses green, rounded cards and a card grid.

## Rules

- Corners are 0px everywhere. No shadows. Depth comes from `--layer` gray and 1px borders.
- One accent: `--interactive` / `--btn` (#0f62fe). Links, primary button, selected tab and
  side-nav marker only.
- UI shell header is #161616 in both themes, 48px tall.
- Type: IBM Plex Sans 400 and 600, self-hosted latin subset in `public/fonts`. No other web
  font. Timecodes and numeric inputs use the system mono stack.
- Scale (px): h1 32/40 (28/36 on phones), h2 20/28, body 16/24, small 14/20 with 0.16px
  tracking, labels 12/16 with 0.32px tracking.
- Spacing on a 4px grid: 4, 8, 12, 16, 24, 32, 48.
- Inputs: field gray fill, 1px bottom rule, 40px tall. Primary button 48px, label left-aligned.
- Tabs are Carbon line tabs and scroll sideways on phones.
- Desktop (1056px+) shows the tool list as a left side nav. Phones rely on the footer list.
- No scroll effects, no animation beyond hover color changes, no images.

## Tokens

| Token | Light | Dark |
|---|---|---|
| background | #ffffff | #161616 |
| layer | #f4f4f4 | #262626 |
| layer-hover | #e8e8e8 | #333333 |
| layer-selected | #e0e0e0 | #393939 |
| border-subtle | #e0e0e0 | #393939 |
| border-strong | #8d8d8d | #6f6f6f |
| text | #161616 | #f4f4f4 |
| text-2 | #525252 | #c6c6c6 |
| text-helper | #6f6f6f | #a8a8a8 |
| link | #0f62fe | #78a9ff |
| interactive | #0f62fe | #4589ff |
| focus | #0f62fe | #ffffff |
| error | #da1e28 | #ff8389 |
