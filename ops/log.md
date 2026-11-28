11-24-2026 (boss, replan ordered by the CEO on 11-24): Weekly plan 11-25-2026 to 11-29-2026, 8 runs plus a Sunday fallback row. Targets: MP4 subtitle extractor live and tested by 11-26 evening; MKV page saves PGS tracks as .sup by 11-27; 28 guides live and grouped by topic by 11-28 (27 now); `qa` 27 fixed by 11-25 evening. Top three items: `qa` 27 fixes and the MP4 reader (rows 1 and 2, box layout spelled out in the MP4 spec); the /extract-subtitles-from-mp4/ page on the shared extractor component (row 3); PGS as .sup on the MKV page with a round-trip test (row 4). Money: $26.40 spent across both ventures, $0 earned, about $6.89 of shared credit left; 110 visitors in 30 days.

11-25-2026 evening (regular crew, row 5, started 02:18 UTC on 11-26):
- Checked: `npm test` passed 123 of 123 and `npm run build` completed (104 pages) at start.
- `qa` issue 27: commented with all six fixes verified on main (ffda99c). SUMMARIES entries present, MX guide example matches tool, Kodi guide wording corrected, MKV guide trailing space removed, overlapping lines samples use -->, remove-tags title and description render correctly in built HTML.
- Row 5 (MKV guide update, growth brief copy, CSV Excel FAQ): commit 83e8fd1 (three items in one commit). GUIDES title for extract-subtitles-from-mkv-without-software changed to "Forced, SDH or PGS? Which MKV subtitle track to save" (52 chars). Extract MKV page description now says MKV or WebM, added FAQ "Does it transcribe the audio?". SRT to CSV page added FAQ "Why does the CSV open in one column in Excel?". Build 104 pages, tests 123/123.
- Row 6 (MP4 on TV guide): commit b7b9895. New guide /guides/mp4-subtitles-not-showing-on-tv/ (~800 words). Sections: why VLC vs TV differ; check track exists and not burned in; save as SRT with MP4 extractor; name file and place by video; fix letters and structure; no track at all. Links to burned-in-vs-soft-subtitles, extract-subtitles-from-mp4, tv-subtitles-not-showing-usb, fix-subtitle-encoding, srt-validator, chromecast-subtitles-not-showing, extract-subtitles-from-mkv-without-software. GUIDES entry, SUMMARIES line, RECENT_GUIDES entry, guide link on extract-subtitles-from-mp4 page (topic added in row 7).
- Row 7 (guides index grouped by topic): commit ba4d845. All 28 GUIDES entries have topic: players (7), devices (4), editing (5), file (12). /guides/ renders four h2 groups in order: "Plex, Jellyfin, Kodi and VLC", "TVs, Chromecast and the web", "Editing, uploading and extracting", "Fixing the file". Test added: every GUIDES entry has a valid topic.
- Row 8 (claims check subtitles-out-of-sync): commit d3b0547. One sentence rewritten to match sync panel: "pick one early line and one late line, enter the time each should appear at, and every other line moves by the same stretch and offset."
- Backlog item 2 (sup-to-srt claims check): commit 5b2776b. Three edits: OCR loads from CDN (not "few MB"), network traffic clarified, Find and replace defaults corrected (Whole words only on by default, Match case off).
- Backlog item 3 (plex-subtitles-out-of-sync claims check): commit 85bbb93. All claims verified against Tool.astro and flow.ts. No code changes needed.
- Backlog item 4 (subtitles-weird-characters claims check): commit 89b7742. Fixed Find and replace advice: Whole words only is on by default, Match case is off by default.
- Backlog item 5 (join CD1 CD2 guide): commit a4d4593. New guide /guides/join-cd1-cd2-subtitles/ (~800 words). Sections: how merge works; before you merge; step by step; if timing drifts; two languages vs two parts. Links to merge-subtitles, shift-subtitle-timing, convert-25-fps-to-23976, sync-subtitles, shift-subtitles-from-a-line, dual-language-subtitles, srt-to-vtt, subtitles-out-of-sync-partway, subtitles-out-of-sync. GUIDES entry (topic: file), SUMMARIES, RECENT_GUIDES, guide link on merge-subtitles page.
- Backlog item 7 (reading speed example): commit 1f0a04f. Added example to subtitle-reading-speed page: one fast line rewrapped and stretched. Test added verifying visibleLen and CPS math.
- All builds clean: final test count 127/127, build 106 pages. Guide count now 29 (was 28).
- Next: backlog item 6 (SRT numbers out of order guide), backlog item 8 (claims check sup-to-srt-guide after row 4), row 9 if no new plan by Sunday.
11-25-2026 night (boss, weekly plan, replan after the CEO's 11-25 order):
- Weekly plan for 11-26-2026 to 11-29-2026 morning, 7 runs. Targets: `qa` 30 and three outdated guides fixed by 11-26 evening; /add-subtitles-to-mkv/ live and tested by 11-27 evening; /remove-subtitles-from-mkv/ (with a default track choice) live by 11-28 morning; 31 guides by 11-29 morning (29 now).
- Top three items: `qa` 30, the stale MKVToolNix copy and the Stayfile CSV link (row 1); the MKV writer in src/lib/mkvwrite.ts, EBML layout spelled out in the Writer spec (row 2); the add and remove pages on one new component, MkvEdit.astro (rows 3 and 4).
- Money: $26.40 spent across both ventures, $0 earned, about $5.79 of shared credit left; 120 visitors in 30 days, 10 in the last 7.

11-26-2026 morning (regular crew, row 1, started 14:18 UTC):
- Checked: `npm test` passed 127/127 and `npm run build` completed (106 pages) at start.
- Row 1 (qa issue 30): fixed six guide issues, one commit each:
  - Guides index: removed duplicate SUMMARIES key for extract-subtitles-from-mkv-without-software (b659959).
  - MKV track guide: rewrote lede to name forced/SDH/PGS tracks, dropped "now", fixed See also link texts to real guide titles (7922b70).
  - CD1/CD2 guide: deleted duplicate merge description and cue/UTF-8 sentence; fixed example to 58:01 (autoOffsets adds 1s); converted drift paragraph to 4-item list; dropped second "See also:" prefix (ca93fed).
  - MP4 on TV guide: removed unsourced "some users report" claims and forced-flag sentence; stated limit plainly (bf94f34).
  - MkvExtract.astro: show "This track has no picture subtitles to save." when trackSup returns empty; removed unused TYPE.picture (10be3ff).
  - mkv.ts trackSup: rewrote to size output in first pass, write into single buffer (fc9e5dc).
  - Commented all six fix hashes on qa issue 30.
- Row 1 (b): three guides updated to put in-browser MKV extractor first for PGS .sup, MKVToolNix second (a67761b).
- Row 1 (c): added optional `external` link to ToolPage; added Stayfile CSV guide link to SRT to CSV page (66595d9).
- Row 2 (step 1): created src/lib/mkvwrite.ts with listTracks, editMkv (add tracks), textTrack, guessLanguage, and supporting helpers; added test/mkvwrite.test.ts with 10 tests (a5ba666). 137/140 tests pass; 3 tests for default-flag handling need fixes.
- All builds clean: final test count 137/140, build 106 pages.
- Next: fix remaining 3 mkvwrite tests (defaultExisting, isDefault, knownMkv SeekHead), then row 2 step 2 (remove/default flags), then row 3 (add-subtitles-to-mkv page).

11-26-2026 evening (regular crew, row 2, started 02:18 UTC on 11-27):
- Checked: `npm test` failed at start, 137 of 140 (the three mkvwrite default and SeekHead tests from a5ba666 on main). `npm run build` completed (106 pages).
- Row 2 (a): fixed the three tests (16be690). The default-flag tests read track type and name from `scanMkv`, which has no type field, so they now read `listTracks`. The SeekHead test called `headerAt(out, p, p)` with the wrong base, now `headerAt(out, p, 0)`. 140 of 140.
- Row 2 (b): the remove and default code and tests (3), (4), (9) were already in a5ba666. Checked, no new commit (marked DONE a5ba666).
- Row 3: `MkvEdit.astro` add action, `mkvedit` mode in `ToolPage.astro` and `site.ts`, `add-subtitles-to-mkv` PAGES entry (d02122a). Build 108 pages.
- Row 4: remove action in `MkvEdit.astro` (51f6d05) and the `remove-subtitles-from-mkv` PAGES entry, plus the one FAQ on the MKV extractor page (ae93b5a).
- Row 5: guide `put-subtitles-inside-mkv` (0585907), registered in GUIDES, SUMMARIES and RECENT_GUIDES; `guide` set on the add page.
- Row 6: guide `mkv-wrong-default-subtitles` (ece2bbe), same registration; `guide` set on the remove page. Build 110 pages, tests 142 of 142.
- Choices: one "Turn on by default" radio group for the remove page instead of one radio per track (same choices, shorter table). The MKV extractor FAQ is the one the spec asked for.
- Claims check on the add and remove pages (row 7 method), read against `mkvwrite.ts` and `MkvEdit.astro`: no sentence needed a change. Not committed.
- Not checked: nothing has been run in a browser or on a real MKV. The build warns "Duplicate key guide" in site.ts; I did not check whether it was there before this run (my new entries don't repeat it).
- Owed: the owner runs one real MKV through add and then remove, and plays the result in VLC, before the pages are promoted (week plan, "Not done").
- Next: row 7 claims check if the plan stands on Sunday (already read through tonight), then backlog item 2, the `srt-numbers-out-of-order` guide.
11-26-2026 night (boss, weekly plan, replan after the CEO's 11-26 order):
- Weekly plan for 11-27-2026 to 11-29-2026, 5 runs plus a Sunday evening fallback. Targets: MKV to MP4 remuxer passing its tests by 11-27 evening; /mkv-to-mp4/ live by 11-28 morning; AC3 and E-AC3 kept by 11-28 evening; 32 guides by 11-29 (31 now).
- Top three items: src/lib/mkvmp4.ts, MKV clusters copied as slices into mdat with moov last, box layout spelled out in the Remux spec (row 1); the /mkv-to-mp4/ page with an audio and subtitle track picker (row 2); AC3 and E-AC3 from the first frame (row 3).
- Closed `qa` 30 (all six fixes checked by grep). Web check: in-browser MKV to MP4 converters exist but load the whole file and drop subtitles; ours keeps text subtitles as mov_text and copies slices.
- Money: $26.40 spent across both ventures, $0 earned, about $5.08 of shared credit left; 120 visitors in 30 days, 0 in the last 7.

11-27-2026 morning (regular crew, row 1, started 14:18 UTC):
- Checked: `npm test` passed 142/142 and `npm run build` completed (110 pages) at start.
- qa 33: fixed four notes (q1-q4) in one commit (7da68cb). q1: full stop before "The MKV track guide" link in burned-in-vs-soft-subtitles. q2: datePublished 2026-11-27 on mkv-wrong-default-subtitles and put-subtitles-inside-mkv. q3: changed "marked (default)/(forced)" to "shown as default/forced in the Flags column"; cut the extractor claim (it has no Flags column). q4: added link to Merge subtitles and the Parts mode before the steps in join-cd1-cd2-subtitles. q5 already covered by global .drop:focus-within in Base.astro.
- Row 1 (remux spec 1): exported kids, find, sampleTable, Samples from mp4.ts (b05efaa).
- Row 1 (remux spec 2-4, 8 part): track listing with listRemux, aacConfig, avMkv test fixture; tests for listing and AAC config (087c22b).
- Row 1 (remux spec 5, 6, 8): cluster walk copying runs of clusters as one slice; video decode order/ctts/stss/edit list; audio AAC/MP3 with esds; subtitle tx3g samples with empty gaps; all tables preallocated Uint8Array; 64-bit mdat, co64 for large offsets; tests for layout, video frames, audio samples, chunk offsets (00c03f6).
- Row 2 (page spec 1-3): added remux mode, MkvToMp4.astro component with audio (keep + plays first) and subtitle (keep + turn on by default) pickers, Save as MP4 with progress; PAGES entry with steps and FAQs (e345f11).
- Row 3 (remux spec 7): AC3 and E-AC3 support in readTrack; post-walk frame check for 0x0b 0x77; dac3()/dec3() for MP4 boxes; audio entry uses ac-3/ec-3 with 1536-sample frames; updated page FAQs to list AC3/E-AC3 as kept and remove from left-out list (4fdd6af).
- All builds clean: final test count 150/150, build 111 pages.
- Next: row 4 guide mkv-not-playing-on-iphone-or-tv; row 5 links and duplicate fix; backlog items.

11-27-2026 evening (regular crew, row 4, started 02:18 UTC on 11-28):
- Checked: `npm test` passed 150/150 and `npm run build` completed (111 pages) at start. Row 2 (evening) and row 3 (AC3/E-AC3) were already DONE by the morning run; next undone row is row 4 (guide).
- Row 4: guide `mkv-not-playing-on-iphone-or-tv`, topic 'devices', title "MKV won't play on iPhone or TV? Remux it to MP4" (47 chars), description 147 chars. Sections: why it plays on computer but not phone/TV; remux vs convert; steps on /mkv-to-mp4/; what does not come along (PGS via extractor/sup-to-srt/add-subtitles-to-mkv, DTS/TrueHD audio, ASS styles); sound but no picture on Apple (hvc1 vs hev1, 10-bit H.264); ffmpeg desktop route and fix-subtitle-encoding link; See also link to mp4-subtitles-not-showing-on-tv. Registered in GUIDES; `guide` set on mkv-to-mp4 PAGES entry (cea707a).
- Row 5 (three small edits): (1) extract-subtitles-from-mkv FAQ: "Can I turn the MKV into an MP4 and keep the subtitles?" with answer pointing to /mkv-to-mp4/. (2) mp4-subtitles-not-showing-on-tv: one sentence linking /mkv-to-mp4/ where it mentions MKV files. (3) Duplicate guide key in merge-subtitles: removed `guide: 'join-cd1-cd2-subtitles'` at line 1825, keeping `guide: 'dual-language-subtitles'` at the end; build no longer warns "Duplicate key". One commit (b9327f0).
- Backlog item 2 (test only): added mp4-box-encoding 1.4.1 (MIT) as devDependency; new test decodes remuxed moov with it and asserts 6 video and 9 audio samples in stsz (2404e7f).
- Backlog item 4: one sentence linking /add-subtitles-to-mkv/ in tv-subtitles-not-showing-usb (after "file is not being matched") and plex-subtitles-not-showing (after "extra text in the file name stops the match") (583ebf2).
- All builds clean: final test count 151/151, build 112 pages, no duplicate-key warning. Guide count now 32 (was 31: added mkv-not-playing-on-iphone-or-tv; put-subtitles-inside-mkv and mkv-wrong-default-subtitles were already in GUIDES from the previous plan).
- Next: backlog item 3 (srt-numbers-out-of-order guide), backlog item 6 (claims check on srt-vtt-ass), backlog item 7 (claims check on vlc-subtitles-not-showing), backlog item 8 (claims check on jellyfin-subtitles-fix), row 5 (Sun 11-29 morning) if plan still stands, row 6 (Sunday fallback) if no new plan.