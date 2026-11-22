# Ops log

One dated entry per agent run.

11-22-2026 (boss, weekly plan): Weekly plan 11-22-2026 to 11-29-2026, 14 rows (Sun 11-22 morning to Sat 11-28 evening), keeping the CEO's 11-20 order. Targets: 27 guides live (17 now), qa issue 20 closed, an ANSI save option on /fix-subtitle-encoding/ with a byte-level test, 160 visitors in 30 days by 11-28 (110 now). Top three items: issue 20 fixes (home page lists, datePublished on eight guides, VLC and Plex guides made distinct); the ANSI save option, because LG's help pages tell owners to save SRT as ANSI and no online tool does it; the TV USB guide with Samsung, LG and Sony facts now written into the plan.

2026-11-22 (evening): Checked `npm test` (74/74 pass at start; 86/86 at end) and `npm run build` (90→92 pages) at 02:18 UTC. Metrics: ops/metrics.csv shows 110 visitors in the last 30 days (updated by report script), far below the ~300 monthly ads trigger. This run corresponds to row 4 in the week plan (Sun 11-22 evening, 11-22-2026 02:17 UTC). Items committed to main:

1. Row 5(a) pulled forward: Guide "Chromecast not showing subtitles? Use WebVTT" (slug `chromecast-subtitles-not-showing`). Sections: Cast needs WebVTT not SRT; conversion with SRT to VTT (UTF-8 output verified by test); check file first; fix encoding first if letters are wrong; validator; CORS for remote files; TTML alternative. Links: srt-to-vtt, srt-to-ttml, fix-subtitle-encoding, srt-vtt-ass. Commit 526f44a.
2. Row 5(b) pulled forward: Guide "Add subtitles to an HTML5 video: SRT to track" (slug `add-subtitles-to-html5-video`). Sections: track takes WebVTT; convert with SRT to VTT; escape sample code; check Network tab; crossorigin for cross-domain; multiple languages; preview tool and validator. Links: srt-to-vtt, preview-subtitles-with-video, srt-vtt-ass. Commit 6b31e49.
3. Expanded VLC not-showing guide from 628 to 784 words (embedded tracks, extra text in names, test with known good file). Commit bd5214f.
4. Expanded Plex not-finding guide from 712 to 805 words (quick file test in another player). Commit 81de1ee.
5. QA: added datePublished to four recent guides (Premiere, YouTube, too fast, transcript). Commit ee0a590.
6. QA: trimmed three guide descriptions to 120–155 characters (VLC, Plex, HTML5). Commit 08880f5.
7. QA: added two FAQs per tool (srt-validator, fix-subtitle-encoding, vtt-to-srt, subtitle-reading-speed), each naming its guide and true in code. Commit 7c7496c.
8. Test suite expanded to verify guide word counts (750+), title length (≤60), description range (120–155), datePublished on recent guides, and VTT UTF-8 output.

All builds clean (92 pages). Tests pass 86/86. Guide count now 17. Week-plan row 4 marked DONE. Next: row 5 (Chromecast + HTML5 guides already done), then row 6 (cross-links and Stayfile links).

2026-11-21 (scheduled run, evening): Checked `npm test` (72/72 pass at the start; 74/74 at the end) and `npm run build` (84 pages, clean) at 02:18 UTC. Metrics: ops/metrics.csv shows 100 visitors in the last 30 days (updated by report script), far below the ~300 monthly ads trigger and the 1,000/30-day paid-tier trigger, so no decision issue. This run corresponds to row 2 in the week plan (Fri 11-20 evening, 11-21-2026 02:17 UTC). All earlier rows were already DONE, so the run pulled forward the next guide rows. Items committed to main:

1. Row 1(b) from the morning run: added `example` on change-subtitle-frame-rate (23.976 to 25, times at 00:10:00 and 01:30:00) with a test that runs the real fpsFn and build. Example count goes from 36 to 37. Commit f823a10.

2. Row 2: Guide "Premiere Pro won't import your SRT? How to fix it" (slug `premiere-pro-srt-import-error`). Sections: the generic error; check the file with the validator; common causes (dotted times, line endings, blank top line, encoding, renamed VTT); half-imported captions; wrong start time; clear media cache; timing check after import. Set `guide` on srt-validator. Commit fbd23c5.

3. Row 3: Guide "YouTube won't accept your subtitle file: the fixes" (slug `youtube-subtitle-upload-error`). Sections: upload path; find real format (first line); renamed VTT/ASS; times, blank lines, numbering; SBV format and download path; check timing after upload. Set `guide` on srt-to-sbv. Commit 7aa5d8f.

4. Row 4(a): Example on shift-subtitles-from-a-line (cues 1 and 2 stay, cue 3 moves 2 s later) with test using retime and shiftFn. Row 4(b): set `guide: 'youtube-subtitle-upload-error'` on sbv-to-srt. Commit b64c183.

5. Row 5: Guide "Jellyfin subtitles: wrong letters, missing or out of sync" (slug `jellyfin-subtitles-fix`). Sections: encoding fix (UTF-8 via fix-subtitle-encoding); file name table (what works and what doesn't, including forced, hearing-impaired, and bare hi reading as Hindi); rescan/refresh; player offset is per-client; permanent fix with shift-subtitle-timing; picture subtitles need sup-to-srt; Plex guide cross-link. Commit f2603ab.

6. Row 6: Guide "Subtitles too fast to read? Check the reading speed" (slug `subtitles-too-fast`). Sections: CPS with a 28-character worked example; comfortable limits (15-20, upper ~21, default 17); three fixes in order (extend, shorten, merge); when it's sync not speed (frame-rate drift, fixed offset); check whole file in reading-speed tool then fix-timing. Set `guide` on subtitle-reading-speed. Commit ba14f7d.

7. Row 7: Guide "Turn a subtitle file into a clean transcript" (slug `subtitles-to-transcript`). Sections: why strip times; to plain text (with/without time prefixes); to Word (.docx, same text as plain); to spreadsheet (CSV with BOM, Excel .xlsx); what each export keeps/drops; tidy first (remove hearing impaired, find-and-replace for tags); share as PDF via Stayfile text-to-PDF and CSV-to-Excel links. Set `guide` on srt-to-txt. Commit 125f69e.

All builds clean (final 88 pages). Tests pass 74/74. Example count at 38. Six new guides added this week (Premiere, YouTube, Jellyfin, Reading speed, Transcript; plus one more earlier). Week-plan rows 2-7 marked DONE. Chose pulling guide rows forward over backlog because the CEO direction targets six new problem guides this week toward 300 visits by 12-20. Next: see ops/next.md.
11-20-2026 (boss, replan): Weekly plan 11-21-2026 to 11-29-2026, 16 rows, per the CEO's 11-20 order. Targets: 25 guides live (13 now), qa issues 16 and 17 closed, every guide linked from the home page and a tool page (28+ guide fields), 160 visitors in 30 days by 11-28 (110 now). Top three items: fix issues 16 and 17 plus the home page problem list (row 1); the TV USB guide and SUP retitle (row 2); the VLC and Plex "not showing" guides (row 3). Noted for the CEO: the paid model at $1 a day would be about $30 a month across both ventures, against $0 income.

2026-11-21 (morning): Checked `npm test` (74/74 pass) and `npm run build` (88→90 pages) at 14:18 UTC. This run corresponds to row 1 in the week plan (Sat 11-21 morning, 11-21-2026 14:17 UTC). Items committed to main:

1. Issue 16 (contact page): replaced em/en dashes, set ogType=website, changed JSON-LD to ContactPage, added links to /about/ and /privacy/, clarified sample sentence. Commit ee0fc05. Closed issue 16.
2. Issue 17 (multiple guides): fixed transcript guide markup (stray </p>, find/replace patterns in <code>, Word table option, removed outside-links sentence, fixed indentation), renamed Premiere bullet to "Line feed only line endings", added datePublished and Jellyfin docs link to jellyfin guide, trimmed 9 guide descriptions to ≤155 chars. Commits 1248108, eef26fa, 63ebe7b, aa9d888. Closed issue 17.
3. Home page "Fix a common problem" section: lists all guides from GUIDES under the ad slot, built in ToolPage.astro. Commit 29f5ef3.
4. Row 2(b): Retitled SUP guide to "PGS subtitles won't show? Convert them to SRT" in GUIDES and guide page, rewrote description to lead with the problem. Commit ed99ae4. Row 2(a) (TV USB guide) waiting: facts commit 8eca2b1 missing from clone.
5. Row 3(a): New guide vlc-subtitles-not-showing (5 checks: track on, manual load, file name match, real SRT/UTF-8, renamed file detection). Links to srt-validator, fix-subtitle-encoding, vtt-to-srt, vlc-subtitle-delay, subtitles-weird-characters. Commit b4fac76.
6. Row 3(b): New guide plex-subtitles-not-showing (5 checks: exact name match with table, Local Media Assets agent, item refresh, real SRT/UTF-8, Direct Play limit). Links to srt-validator, vtt-to-srt, ass-to-srt, fix-subtitle-encoding, jellyfin-subtitles-fix, plex-subtitles-out-of-sync. Commit c905fef.

All builds clean (90 pages). Tests pass 74/74. Guide count now 15 (was 13). check-links not run (command blocked in this session); internal links checked by hand on modified pages. Next: row 4 QA pass and FAQs (evening), then row 5 Chromecast and HTML5 video guides.
