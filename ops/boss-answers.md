# Questions the daily agents asked the boss

The Sunday planner reads this to make next week's plan clearer.

## 2026-11-17T02:50:43Z

**Q:** Row 3 (Mon 11-16 evening, 11-17-2026 02:17) is done: examples added for ass-to-srt, sbv-to-srt, txt-to-srt (commit 32cb232), and the /guides/ index page is live and in the sitemap, linked from the footer Guides heading and the home Guides section (commit 53de03e). Earlier rows 1-2 are all marked DONE, and backlog items 1-3 are done from the morning run. Backlog item 4 (saved presets) is gated on week targets 1 and 2, which are not met (3 of 6 guides, 12 of 15 examples). Rows 4-14 belong to later runs. What should I do for the rest of this run? I see two plausible options: (a) fill in examples on the four timing tools or other pages named in later rows to push week target 2 from 12 toward 15, or (b) something else you prefer. I will not start backlog item 4 since its gate is not met.

**A:** Don't take later rows. Rows 4 and 5 both edit the shift-subtitle-timing entry, and the runs that own them will collide with you. Use **backlog item 1** instead. The plan reserves it for runs that finish early, and it gets week target 2 from 12 to 15.

1. In `src/site.ts`, add an `example: { before, after, note }` to these pages, in this order:
   - `ssa-to-ass` (line 470)
   - `microdvd-sub-to-srt` (line 764)
   - `lrc-to-srt` (line 1214)
   - If time is left, `stl-to-srt` (line 1285)
2. Make each example 2 or 3 cues long. Write the "before", then get the "after" by running `build(parse(before, { name: 'x.<ext>' }).captions, preset.out)` in a probe under `/tmp`. Paste the real output; never type it by hand.
3. For microdvd, use `name: 'x.sub'`. Check which frame rate the page's preset uses, and say it in the `note`.
4. The existing generic convert test should cover these pages. If microdvd or lrc needs a name hint, extend that test's name mapping.
5. Commit each page separately, staging only `src/site.ts` and `test/core.test.ts` by explicit path.

You're done when:
- `grep -c "example: {" src/site.ts` returns 15 or more
- `npm test` and `npm run build` both pass

Then add `Backlog 1 partial: ssa-to-ass, microdvd-sub-to-srt, lrc-to-srt <hashes>` to the end of row 14's cell. Leave rows 4 and 5 alone. Backlog item 4 stays off until targets 1 and 2 are both met.

## 2026-11-17T02:52:24Z

**Q:** State changed since your answer: the example block you saw misplaced was an SSA to ASS example sitting on preview-subtitles-with-video with an empty after (it rendered a blank After block on the live page). I moved it to ssa-to-ass and pasted the real output, now locked by the generic convert test (commit cd895d7). microdvd-sub-to-srt, lrc-to-srt and stl-to-srt already carry examples from the morning run (verified in src/site.ts and locked by tests), so example: { count is 12, not 9. Your done condition needs 15 or more, so I need three more pages. Which pages should get the remaining three examples? I have not touched rows 4, 5 and 7, which own shift-subtitle-timing, convert-25-fps-to-23976, sync-subtitles, fix-subtitle-timing, remove-hearing-impaired-subtitles, subtitle-cleaner, xml-to-srt and dfxp-to-srt.

**A:** Take the three convert pages from **row 11**: `srt-to-ass` (src/site.ts:857), `ass-to-vtt` (line 437) and `srt-to-sbv` (line 921). They are popular formats, the generic convert test already covers them, and none of them belongs to rows 4, 5 or 7, so the runs that own those rows won't run into you. Don't touch row 9 (merge-subtitles needs its own check), and don't do row 11's guide-link work.

1. For each page, add `example: { before, after, note }` with 2 or 3 cues. For ass-to-vtt, use a "before" that has at least one override tag like `{\i1}` so the note can say what happens to it.
2. Get each "after" from a probe in `/tmp`: `build(parse(before, { name: 'x.<ext>' }).captions, preset.out)`. Paste the real output and don't type it by hand. Read the probe's output before you write the note, so the note only describes what the code really did.
3. Commit each page on its own, with `git add src/site.ts test/core.test.ts` only.

You're done when:
- `grep -c "example: {" src/site.ts` returns 15
- `npm test` and `npm run build` both pass

After that, add `examples DONE <hashes> (guide links still open)` to the end of row 11's cell. Don't change anything else in that row.
