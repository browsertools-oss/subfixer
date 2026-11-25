# Ops log

One dated entry per agent run.

2026-11-24 (evening): Checked `npm test` (106/106 pass at start) and `npm run build` (99 pages, clean) at 02:18 UTC. This run corresponds to row 6 in the week plan (Tue 11-24 evening, 11-24-2026 02:17 UTC). Items committed to main:

1. Row 6(a) and (b): Added `guide` links from remove-duplicate-subtitles → subtitles-showing-twice and subtitle-cleaner → remove-tags-from-subtitles in src/site.ts. Both guide pages were already in the tree. Commit 5d12c36.
2. Row 7 QA pass on the MKV page and guides from rows 3–6:
   - MKV page (src/site.ts): lede said "Save any text track as SRT or ASS" but WebVTT tracks save as .vtt (trackFile, mkv.ts line 467) and only ASS gets Save as SRT (MkvExtract.astro line 144). Fixed lede and step 3. Commit 294330e.
   - MKV guide (extract-subtitles-from-mkv-without-software): said picture tracks "save as images" and the extractor saves them; the extractor has no Save for picture tracks. Fixed two sentences to say it does not save them and points to MKVToolNix + OCR. Commit 14d19f1.
   - Other checks passed: links by hand, dash/banned-word grep clean, one h1 and datePublished on each guide, no shared sentences.
3. Row 8(a): New guide remove-sdh-from-subtitles (title 47 chars). Before/after from fixCommon with removeBrackets, removeSpeakers, removeMusic in two tests, including the WARNING: colon-name and mid-line music cases the guide describes. Linked from remove-hearing-impaired-subtitles (guide field), listed in GUIDES and RECENT_GUIDES. Commit dc0bf8b.
4. Row 8(b): New guide burned-in-vs-soft-subtitles (title 48 chars). How to tell the two kinds apart (turn off in player, check track list, check folder), what each means for saving text, what tools work on each. Soft text → MKV extractor; soft picture → MKVToolNix + sup-to-srt with OCR (takes a while, gets some wrong, check lines, file stays on device); burned in → no tool can save, look for separate file or write new. Listed in GUIDES and RECENT_GUIDES. Commit c2f84ab.
5. Row 9(a): New guide subtitles-overlapping-lines (title 48 chars). Validator's overlap, zero, short codes (ISSUE_TEXT, subs.ts line 411) and fixTiming behavior (minDurMs, fixOverlaps, minGapMs in tidy.ts). Before/after from fixTiming with overlap, gap, minDur in a test. Links: /srt-validator/, /fix-subtitle-timing/, /guides/subtitles-too-fast/. Listed in GUIDES and RECENT_GUIDES. Commit e3e59b4.
6. Row 10 (pulled forward): New guide mx-player-subtitle-sync (title 42 chars). Player sync setting is per-playback; fix the file with shift-subtitle-timing or sync-subtitles. Worked example with -2000 ms shift. Links: /shift-subtitle-timing/, /sync-subtitles/, /guides/subtitles-out-of-sync/, /guides/kodi-subtitles-out-of-sync/, /guides/subtitles-out-of-sync-partway/, /guides/23976-vs-25-fps-subtitles/, /extract-subtitles-from-mkv/. Listed in GUIDES and RECENT_GUIDES. Commit c7cafdb.

All builds clean (final 103 pages). Tests pass 113/113 (was 106). Guide count now 22 (was 18). Week-plan rows 6, 7, 8, 9, 10 marked DONE. Next: row 11 (QA + guides index grouped by topic) or row 12 (claims check).

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

11-22-2026 (boss, replan for the MKV extractor, CEO order 11-22): Weekly plan 11-23-2026 to 11-29-2026, 12 rows. Targets: the MKV subtitle extractor live and tested by 11-24, 25 guides live (17 now), every run commits at least one item, 160 visitors in 30 days by 11-28 (110 now). Top three items: the MKV reader library with tests (row 1), the /extract-subtitles-from-mkv/ page (row 2), the guide "Extract subtitles from an MKV without installing anything" plus links from the SUP FAQ and guides (row 3). The TV USB guide is row 4 again (the 11-22 evening run wrote it but never committed).

11-23-2026 morning (regular crew, row 1, started 14:18 UTC, wrapped up after a budget run note, about 15:20 UTC):
- Checked: `npm test` passed 90 of 90 at start. `npm run build` failed with `SINGLE_BYTE is not defined` while rendering /shift-subtitle-timing/ (exit non-zero; the build did not complete).
- Cause: src/components/Tool.astro uses `SINGLE_BYTE` in the server template ("Save as" select, line 273), but the import sat only in the client `<script>` block.
- Fix: commit 5788083 on branch `fix/build-single-byte-import` (one-line import in the frontmatter). Pushed the branch to origin. Could not open a PR: `gh pr create` needs approval for workers. Asked the boss (Opus); answer: leave the fix on main, the end-of-run push takes it live, don't delete the branch, don't force-push. Cherry-picked it to main as 07e7765. Tests 90/90 and build complete (92 pages) on main after the fix.
- Week plan: added "Build fix 07e7765" to row 1 (commit 0433fba).
- Not done: row 1(a), the MKV reader (src/lib/mkv.ts, test/mkv-fixture.ts, test/mkv.test.ts). Nothing written. The run note asked to stop after the current item, so the boss's three-step plan for row 1 is still open for the next run.
- Next: row 1(a) step 1 (reader, scanMkv, tests 1, 4, 5, 6, 7 and the package.json test script), then step 2 (trackFile, assToSrt), then step 3.
- Note for the owner: main was not building since the last deploy-facing change. The fix is on main locally and goes out with the end-of-run push. Confirm the push actually lands; the build check on main is green.

11-23-2026 evening (regular crew, row 2, started 02:18 UTC on 11-24):
- Checked: `npm test` passed 90 of 90 and `npm run build` completed (92 pages) at start. The build fix from the morning is in src/components/Tool.astro (SINGLE_BYTE imported in the frontmatter, line 3). Commit 07e7765 is not in this clone; the fix is in the code and the build is green, so nothing was redone.
- Row 1(a), MKV reader, in three steps as the plan asked:
  - Step 1, commit 79ef652: src/lib/mkv.ts (buffered reader, EBML walk, scanMkv), test/mkv-fixture.ts (a sample MKV built in code, unknown-size Segment, Void, zlib track, a 3 MB video block), test/mkv.test.ts tests 1, 4, 5, 6, 7, and mkv.test.ts added to the test script.
  - Step 2, commit 5b610bf: trackFile and assToSrt, tests 2 and 3.
  - Deviation, for the record: scanMkv also returns `codecPrivate` (a Map of track number to the CodecPrivate text). trackFile needs that text and the spec's return shape had no place for it. It is an added field, no existing field changed.
  - Also for the record: the fixture writes FlagDefault on every track, because the Matroska default for that flag is 1.
- Row 2(a), MKV page, commit 7f2c460: the `extract` mode and PAGES entry at /extract-subtitles-from-mkv/ (Convert group, title 53 characters, description 137), MkvExtract.astro (drop zone, track table, Save and Save as SRT for ASS, Stop button, a skipped-lines note), and the ToolPage switch. Built as page 93. The lede and FAQs say only what mkv.ts does: read in 1 MB pieces, nothing uploaded, PGS and VobSub are pictures, burned-in subtitles can't be pulled out, MKV and WebM only.
- Choice: the FAQ answer on PGS points to mkvextract plus /sup-to-srt/ (the same route the SUP FAQ already gives). Chosen because it is the one way to get picture tracks to text in this set of tools.
- Checks: `npm test` 97 of 97 pass. `npm run build` complete, 93 pages, dist/extract-subtitles-from-mkv/index.html exists. Dash grep on the new files prints nothing. Links on the new page (/shift-subtitle-timing/, /fix-subtitle-encoding/, /sup-to-srt/) exist in the build output; checked by hand, since check-links is blocked for workers.
- Not checked: the page has not been run in a browser with a real MKV. The reader is tested only on the fixture. The week plan's owner check (one real file) still stands.
- Week plan: row 1 and row 2 marked DONE.
- Next: row 3(a), the guide extract-subtitles-from-mkv-without-software, then the links in row 3(b). Day count: the MKV page is live for the next deploy.

Row 3(a) and 3(b) (same run, continued):
- Row 3(a), commit 8edd6f4: the guide extract-subtitles-from-mkv-without-software. Structure follows plex-subtitles-out-of-sync. Title 57 chars, description 139 chars, 1300+ words, datePublished 2026-11-24. Sections: track vs burned-in (turn off to check, VLC Sub Track lists them), text vs picture tracks (codec names in plain words), step-by-step with the extractor (what the track list shows, what each save gives), naming for Plex and Jellyfin (Movie.eng.srt), fix after save (shift timing, encoding fixer, validator), picture tracks need MKVToolNix then SUP to SRT, what to do when no tracks at all, common mistakes. See also SUP guide and Plex not-showing.
- Row 3(b), commit cebbc56: three links added in one commit. SUP FAQ answer, SUP guide, Jellyfin guide each get one sentence pointing text tracks to /extract-subtitles-from-mkv/. Plex guide skipped (no spot mentioning subtitles inside the video file).
- Checks: npm test 98 of 98 pass (the new guide is now in RECENT_GUIDES). npm run build 94 pages. Dash grep clean on new files.
- Guide count now 18 (was 17). Week plan rows 3(a) and 3(b) marked DONE.
- Next: row 4(a) TV USB guide with Samsung, LG, Sony facts.
