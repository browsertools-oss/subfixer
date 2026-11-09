# SubFixer design system: Broadside

A printer's film bill. Buff stock, near-black ink, one vermilion. Loud because the capitals are tall and the rules heavy, never because anything is drawn. Source of truth: `src/styles/tokens.css` (tokens, light and dark) and `src/styles/site.css` (everything else). The Hallmark stamp heads `site.css`.

## Type
- Six Caps 400 (OFL, self-hosted): the h1 and the How it works numerals only. Uppercase, line-height 1.
- Bevan 400 (OFL): the wordmark, section heads, group names (Timing, Text, Format), the drop head. Uppercase, untracked.
- Archivo Narrow 400 to 700 (OFL, variable): everything read, labels, buttons, inputs. Labels are sentence case, a step smaller, untracked, muted. No mono in the UI.

## Colour
- Light (`bill`): paper oklch(92% .028 88), ink oklch(18% .01 50), vermilion oklch(53% .19 33).
- Dark (`inked`): stock oklch(17% .01 60), buff ink, vermilion oklch(63% .19 33).
- The cinema screen stays dark in both modes. Subtitle text is near-white with a black edge, as on a real screen.
- Vermilion marks one thing at a time: the corrected cue, the struck-out text in symptom drawings, hover, the selected fix tab underline.

## Surfaces and controls
- Square corners, no shadows. Rules at 1px (hair) or 5px (bar) above sections. A frame is a 3px ink border with a 1px keyline inside: the drop well and the screen.
- Grain specks only on the drop well and the footer band.
- One filled button style: ink block, Archivo Narrow 600, turns vermilion on hover. Download and Choose files use it.
- Symptoms are a printed index: one row per problem with its timeline drawing, the sentence, and the fix name underlined. One click, no selected state.
- Inputs: square, 44px, 1px ink border. Focus: 2px vermilion outline everywhere.

## Do not
- No tracked caps labels, colour dots, ticket masks, mono chips, middle-dot meta lines, rounded corners or a second accent colour.
