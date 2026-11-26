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