# Ops log

One dated entry per agent run.

2026-11-21 (scheduled run, evening): Checked `npm test` (72/72 pass at the start; 74/74 at the end) and `npm run build` (84 pages, clean) at 02:18 UTC. Metrics: ops/metrics.csv shows 100 visitors in the last 30 days (updated by report script), far below the ~300 monthly ads trigger and the 1,000/30-day paid-tier trigger, so no decision issue. This run corresponds to row 2 in the week plan (Fri 11-20 evening, 11-21-2026 02:17 UTC). All earlier rows were already DONE, so the run pulled forward the next guide rows. Items committed to main:

1. Row 1(b) from the morning run: added `example` on change-subtitle-frame-rate (23.976 to 25, times at 00:10:00 and 01:30:00) with a test that runs the real fpsFn and build. Example count goes from 36 to 37. Commit f823a10.

2. Row 2: Guide "Premiere Pro won't import your SRT? How to fix it" (slug `premiere-pro-srt-import-error`). Sections: the generic error; check the file with the validator; common causes (dotted times, line endings, blank top line, encoding, renamed VTT); half-imported captions; wrong start time; clear media cache; timing check after import. Set `guide` on srt-validator. Commit fbd23c5.

3. Row 3: Guide "YouTube won't accept your subtitle file: the fixes" (slug `youtube-subtitle-upload-error`). Sections: upload path; find real format (first line); renamed VTT/ASS; times, blank lines, numbering; SBV format and download path; check timing after upload. Set `guide` on srt-to-sbv. Commit 7aa5d8f.

4. Row 4(a): Example on shift-subtitles-from-a-line (cues 1 and 2 stay, cue 3 moves 2 s later) with test using retime and shiftFn. Row 4(b): set `guide: 'youtube-subtitle-upload-error'` on sbv-to-srt. Commit b64c183.

5. Row 5: Guide "Jellyfin subtitles: wrong letters, missing or out of sync" (slug `jellyfin-subtitles-fix`). Sections: encoding fix (UTF-8 via fix-subtitle-encoding); file name table (what works and what doesn't, including forced, hearing-impaired, and bare hi reading as Hindi); rescan/refresh; player offset is per-client; permanent fix with shift-subtitle-timing; picture subtitles need sup-to-srt; Plex guide cross-link. Commit f2603ab.

6. Row 6: Guide "Subtitles too fast to read? Check the reading speed" (slug `subtitles-too-fast`). Sections: CPS with a 28-character worked example; comfortable limits (15-20, upper ~21, default 17); three fixes in order (extend, shorten, merge); when it's sync not speed (frame-rate drift, fixed offset); check whole file in reading-speed tool then fix-timing. Set `guide` on subtitle-reading-speed. Commit ba14f7d.

7. Row 7: Guide "Turn a subtitle file into a clean transcript" (slug `subtitles-to-transcript`). Sections: why strip times; to plain text (with/without time prefixes); to Word (.docx, same text as plain); to spreadsheet (CSV with BOM, Excel .xlsx); what each export keeps/drops; tidy first (remove hearing impaired, find-and-replace for tags); share as PDF via Stayfile text-to-PDF and CSV-to-Excel links. Set `guide` on srt-to-txt. Commit 125f69e.

All builds clean (final 88 pages). Tests pass 74/74. Example count at 38. Six new guides added this week (Premiere, YouTube, Jellyfin, Reading speed, Transcript; plus one more earlier). Week-plan rows 2-7 marked DONE. Chose pulling guide rows forward over backlog because the CEO direction targets six new problem guides this week toward 300 visits by 12-20. Next: see ops/next.md.