# Week plan: 11-22-2026 (Sun) to 11-29-2026 (Sun morning)

Written by the boss (Opus) on 11-22-2026 at 04:20 Pacific, before the Sunday morning run. Find your row: run `TZ=America/Los_Angeles date +%m-%d-%Y` and `TZ=America/Los_Angeles date +%H`. Before 12 is the morning run, otherwise the evening run. Evening runs start at 02:17 UTC on the next UTC date. When you finish an item, add `DONE <hash>` at the end of that item in its row. Don't otherwise rewrite this file.

Run count: this session ran before the Sunday 11-22 morning run, so the 14 rows are Sun 11-22 morning to Sat 11-28 evening. The next planner runs before the Sun 11-29 morning run. This plan replaces the 11-20 plan; every unfinished item of it is in a row or in the backlog below.

## At a glance

<!-- Summary for the owner's dashboard. Agents: follow the Day-by-day table below and mark DONE there, not here. -->

Goal: Fix what the quality checker found, then publish ten careful problem guides so search visitors arrive by 12-20 and AdSense approves.

Targets:
- 27 guides live, each at least 750 words (17 now)
- Quality issue 20 fixed and closed
- Subtitle files can be saved in older TV encodings (ANSI), tested
- 160 visitors in the last 30 days by 11-28 (110 now)

| Run | In plain words |
|---|---|
| 1 | Tidy the home page guide lists, date the older guides, link new guides from old ones |
| 2 | Make the VLC and Plex guides less alike, add one Stayfile link |
| 3 | Let the character fixer save files in ANSI, which some TVs need |
| 4 | Guide: TV won't show subtitles from a USB stick, Samsung, LG and Sony |
| 5 | Guide: subtitles fine at first, then out of sync partway through |
| 6 | Guide: Kodi subtitles out of sync, fixing the file once |
| 7 | Guides: subtitles showing twice, and odd codes like {\an8} on screen |
| 8 | Guides: removing [music] and speaker names, and soft versus burned-in subtitles |
| 9 | Check this week's guides for errors, group the guides page by topic |
| 10 | Guides: subtitle lines overlap or flash, and MX Player subtitles out of sync |
| 11 | Guide: join CD1 and CD2 subtitles into one file, add related guide links |
| 12 | Guide: subtitle numbers skipped or out of order |
| 13 | Check the newest guides and fix anything the quality checker flagged |
| 14 | Recheck the oldest guides' claims against the code, one guide at a time |

## Money picture

Spent so far (ops/costs.json in both repos): SubFixer $18.20 ($8.20 domain, $10.00 OpenRouter credit shared by both ventures). Stayfile $8.20 (domain). Both ventures: $26.40 spent, $0.00 earned.

Monthly costs going forward:
- Domains: subfixer.app renews at $14.20 a year, $1.18 a month; stayfile.app about the same. $2.36 a month for both.
- API: the owner's model test (11-20 to 11-27) lets the crews spend up to $1 a day on a paid model (.github/agent/models.json, $0.25 a run). The daily report for 11-21 shows $0.67 spent that day and about $9 of credit left, so it runs out around 11-30 (the CEO's estimate too). Kept on, that is about $30 a month for both ventures; on free models it is about $0.
- Hosting, email routing, CI: $0.
- So: about $2.40 a month on free models, about $32 a month if the paid model stays.

Where revenue comes from, in order:
1. AdSense. Applied 11-09-2026, no verdict for SubFixer yet (Stayfile was flagged "Low value content" on 11-18, which is why this plan puts quality checks ahead of speed). Needs original pages, clear navigation, contact, privacy and about pages (all live), no near-duplicate pages. Payout at a $100 balance. Roadmap trigger to show ads: about 300 visits in 30 days.
2. SubFixer Pro (batch fixing, saved presets, about $4 a month or $24 a year, Polar checkout created by the owner at the trigger). Trigger: 1,000 visits in 30 days. Built behind `?pro=1`, pricing hidden. Nothing new for Pro this week; it is 9 times the current traffic away.

Break-even (assumptions: page RPM $1.50, 1.3 pages a visit, so about $2 per 1,000 visits; Pro nets about $3.40 a subscriber a month and 0.2% of monthly visitors subscribe):
- On free models: ads cover SubFixer's $1.20 a month at about 600 visits a month, both ventures at about 1,200. One Pro subscriber covers either venture (about 500 visits a month at 0.2%).
- With the paid model kept on: $32 a month needs about 16,000 visits a month from ads, or about 10 Pro subscribers (about 5,000 visits a month).

Where we are: 110 visitors in the 30 days to 11-21 (ops/metrics.csv: 40, 20, 0, 10, 10, 0, 0, 10, 10, 0, 10, 0; 11-21 not counted yet), 30 in the last 7 days. That is 37% of the CEO's goal of 300 by 12-20-2026 and 11% of the Pro trigger. Counts come in steps of 10 (sampling). 34 pages are indexed (Search Console, issue #9) but nothing ranks yet. The 70 visits from 11-09 to 11-13 leave the window around 12-09, so 300 by 12-20 needs about 10 visits a day from search by early December. Only problem guides can do that, and this week's have about three weeks to rank.

This week's targets (the planner checks them next session):
1. 27 entries in `GUIDES`: `sed -n '/export const GUIDES/,/^];/p' src/site.ts | grep -c "slug: '"` prints 27 or more, and `npm test` passes (the tests check 750 words, title and description length).
2. Issue 20 closed with a comment naming the fix commits.
3. The ANSI save option: a test in test/core.test.ts encodes "café €" as windows-1252 and gets the bytes `63 61 66 E9 20 80`.
4. Outside the agents' control: 160 visitors in the last 30 days in ops/metrics.csv by 11-28-2026.

## Last week in five lines

- Shipped 11-15 to 11-22: 15 new guides (17 live), /contact/, 38 examples, a home page guide list, the SUP guide retitled, FAQs on four tools; qa issues 16 and 17 closed.
- Slipped: the TV USB guide (its facts pointed to a commit missing from the clone; the facts are now written below), cross-links and Stayfile links (old row 6).
- Runs: paid-model runs since 11-21 finish in 10 to 40 minutes and ship several rows. Five of the nine free-model runs before them failed at the time cap.
- Quality: issue 20 says the VLC and Plex guides copy each other, some lines are filler, and the home page lists every guide twice. AdSense reads exactly this.
- Data: 30 visitors in the last 7 days, flat. Indexed, not ranking. Forum threads rank for our phrases, so complete guides can win.

## What I changed from the CEO's 11-21 note, and why

The CEO said to keep the 11-20 plan. I kept every item and its order, with three changes:
1. Issue 20 goes first (rows 1 and 2), as the CEO's own rule says.
2. One new item, row 3: an ANSI (Windows-1252 and other single-byte) save option on the existing /fix-subtitle-encoding/ tool. LG's own help pages tell owners to re-save SRT files as ANSI in Notepad, forum users ask for "srt utf-8 to ansi" and a web search on 11-22 found no online tool that does it. Today our tools only save UTF-8, so the TV guide would send LG owners away. This is an option on an existing page, not a new converter page.
3. One guide per run where the guide needs care, two only where both are short and code-backed. The paid model is fast enough for two, but issue 20 shows fast guides start to read alike, and Stayfile already got "Low value content". For the CEO: a dedicated "/srt-to-ansi/" page may be worth an exception later, since nobody serves that phrase; I did not plan it because of the no-new-pages rule.

## Facts for this week (checked by the boss in code and on the web on 11-20 and 11-22-2026)

The daily runs can't search the web. Use only the facts below, in ops/growth-brief.md (11-20-2026, items 1 to 9) and in the code. User reports and help pages are not promises, so write "a common cause is" or "some users report". Never name a competitor site in copy. If a fact you need is not here or in the code, leave the claim out.

SubFixer code facts (still look at the line before you quote it):
- `parse` in src/lib/subs.ts (around line 132) detects the format from the file's content, not its name. A VTT or ASS file renamed to .srt still opens, and saving as SRT gives a real SRT.
- `stripTags` (src/lib/subs.ts around line 116) removes `<i>`, `<font color="...">` and ASS override tags like `{\an8}`. The cleaner's "tags" option runs it (src/components/Tool.astro, `removeTags: on('tags')`).
- SRT and VTT output use CRLF line endings. VTT output keeps only `<i>`, `<b>`, `<u>` tags.
- Downloads are `new Blob([...])` from a string (src/components/Tool.astro line 1217), so they are UTF-8 with no BOM. Until row 3 ships, never say SubFixer saves ANSI.
- `ENCODINGS` (src/lib/subs.ts line 47) lists what the tools can read: UTF-8, windows-1250 to 1258, windows-874, ISO-8859-2, ISO-8859-15, KOI8-R, KOI8-U, Shift_JIS, EUC-JP, EUC-KR, GB18030, Big5, UTF-16LE.
- Tool pages that exist: /srt-validator/, /fix-subtitle-encoding/, /vtt-to-srt/, /ass-to-srt/, /srt-to-vtt/, /srt-to-ttml/, /preview-subtitles-with-video/, /shift-subtitles-from-a-line/, /sync-subtitles/, /shift-subtitle-timing/, /fix-subtitle-timing/, /remove-duplicate-subtitles/, /merge-subtitles/, /subtitle-cleaner/, /remove-hearing-impaired-subtitles/, /renumber-srt/, /sup-to-srt/, /srt-to-csv/, /srt-to-word/, /srt-to-txt/. Check any other slug with `grep -n "slug: '<slug>'" src/site.ts` before linking it.

TV facts (for row 4; web, 11-22-2026):
- LG's help library page "LG TV: USB video subtitle issue" (https://www.lg.com/us/support/help-library/lg-tv-usb-video-subtitle-issue--20154860115020) says: the video and subtitle names must be identical (a difference such as a blank space breaks it); open the .srt in Windows Notepad, Save As, choose ANSI encoding, save; the USB stick should be FAT32 or NTFS; if the video itself has problems, the TV may not support its codec.
- Samsung community forum, user reports (not Samsung's own advice): giving the .srt exactly the video's base name and putting both in the same folder fixed it for several users; Windows hides known extensions, so a file can really be `Movie.srt.srt` or `Movie.srt.txt` (turn on "File name extensions" in File Explorer's View menu to see it); some users report USB works while playback over the network (DLNA, NAS) does not show the external file.
- Sony's support pages (Android and Google TV models) say: keep the subtitle file in the same folder as the video, give it the same name, and use a lowercase extension (`.srt`, not `.SRT`).
- "ANSI" in Notepad means the Windows code page of that PC: Windows-1252 on US and Western European Windows, Windows-1251 on Cyrillic Windows, and so on. So "save as ANSI" really means "save as the old code page for your language".
- Picture subtitles (.sup, PGS) are images, not text; TVs that skip them need a text SRT, made with /sup-to-srt/ (OCR in the browser).

## Day-by-day

How to write a guide (every guide row): copy the structure of `src/pages/guides/plex-subtitles-out-of-sync/index.astro`: `Base` with `ogType="article"`, an `Article` jsonld with `datePublished` set to today's date in YYYY-MM-DD, one h1 from the title and a lede, 4 to 7 h2 sections, links to 3 or more tool pages, a "See also" link to another guide. Title at most 60 characters, description 120 to 155 characters. 750+ words of real text. Write the symptom, how to tell the causes apart, the fix step by step, then the tool. Write for the one player or problem in the title: if a paragraph could be pasted unchanged into another guide, rewrite it or link that guide instead. No filler lines ("give it a minute", "this is easy", "in this guide we will"). Two spaces per indent level, file ends with a newline, no em or en dashes (`grep -n "—\|–" <file>` prints nothing). Write the whole file with one Write, then build, then count. Add `{ slug, title }` to the end of `GUIDES` in src/site.ts only when it builds and passes 750 words. Set `guide: '<slug>'` on a named tool page only if it has no `guide` yet. Run `npm test` and `npm run build`, then the link check (see Guardrails), before each commit. One commit per guide.

Paid model (through about 11-27): do every item in your row, then pull the next row forward. Free model (slow, or the paid cap was hit): do item (a), commit, and leave (b) for the next run.

| # | Run (PT) | Start (UTC) | Items |
|---|---|---|---|
| 1 | Sun 11-22 morning | 11-22-2026 14:17 | (a) Issue 20, structure. Home page: in src/site.ts add `export const HOME_GUIDES = ['vlc-subtitles-not-showing', 'plex-subtitles-not-showing', 'subtitles-out-of-sync', 'subtitles-weird-characters', 'chromecast-subtitles-not-showing', 'subtitles-too-fast'];` and in src/components/ToolPage.astro (line 33) build the "Fix a common problem" list from `HOME_GUIDES` mapped to their `GUIDES` entries; keep the full "Guides" list lower down. Add a test that every `HOME_GUIDES` slug is in `GUIDES`. One commit. (b) Issue 20, dates: add `datePublished` to the Article jsonld of these guides with these values: 23976-vs-25-fps-subtitles 2026-11-17, dual-language-subtitles 2026-11-17, plex-subtitles-out-of-sync 2026-11-17, srt-vtt-ass 2026-11-08, subtitles-out-of-sync 2026-11-08, subtitles-weird-characters 2026-11-17, sup-to-srt-guide 2026-11-16, vlc-subtitle-delay 2026-11-17 (first commit dates). Done = `grep -L datePublished src/pages/guides/*/index.astro` prints only src/pages/guides/index.astro. Transcript guide (src/pages/guides/subtitles-to-transcript/index.astro, near line 33): put the two find-and-replace patterns in one `<ul>` with each pattern in `<code>`, instead of one-line paragraphs; check the built page shows `{\i1}` and the regex as text. One commit. (c) Old row 6(a) cross-links, one sentence each inside a fitting paragraph, not a list: Premiere and YouTube guides from srt-vtt-ass; Jellyfin and plex-subtitles-not-showing from plex-subtitles-out-of-sync; subtitles-too-fast from subtitles-out-of-sync; vlc-subtitles-not-showing from vlc-subtitle-delay; chromecast-subtitles-not-showing from srt-vtt-ass. One commit. DONE bdabb53 (a, b and c were already in main; checked in the code this run). |
| 2 | Sun 11-22 evening | 11-23-2026 02:17 | (a) Issue 20, copy. In src/pages/guides/plex-subtitles-not-showing/index.astro and src/pages/guides/vlc-subtitles-not-showing/index.astro: rewrite the shared parts (steps 4 and 5, the validator paragraph) so each speaks only of its player: Plex = server side (Local Media Assets, naming `Movie (2020).en.srt`, Refresh Metadata and Analyze on the item, client apps); VLC = one desktop player (Subtitle menu, Sub Track, Add Subtitle File). Where one guide explains the "renamed VTT" check fully, the other gets one sentence and a link. Change "is a separate bug you cannot fix from the server" to "some users report that certain player apps drop external SRT files in Direct Play; test the same file on another app". Delete filler such as "Give the scan a minute or two". Same filler scan on the Chromecast and HTML5 guides. Both guides stay at 750+ words (the test checks). One commit per guide. (b) SUP guide (src/pages/guides/sup-to-srt-guide/index.astro): the title is about PGS subtitles that won't show, so the first h2 section must answer that: why a TV or player skips PGS (they are pictures; many TVs, casting and web players only take text tracks), then the existing conversion steps. Close issue 20: `gh issue close 20 --comment "Fixed in <hashes>"`. (c) Stayfile link 2 only (the URL returned 200 on 11-22): in src/pages/guides/subtitles-weird-characters/index.astro, at the end of the section that explains Ã©, add: "The same thing happens to spreadsheets; Stayfile explains <a href="https://stayfile.app/guides/csv-garbled-characters-excel/">the CSV version of this problem</a>." Links 1 and 3 of the growth brief are dropped: FAQ answers render as plain text (src/components/ToolPage.astro) and SubFixer pages have no `more` field, so there is no place for a link. One commit. DONE bdabb53 (a, b and c were already in main; checked in the code this run). |
| 3 | Mon 11-23 morning | 11-23-2026 14:17 | (a) ANSI save, library: in src/lib/subs.ts add `export function encodeSingleByte(text: string, encoding: string): { bytes: Uint8Array; lost: number }`. Build the reverse table by decoding bytes 0 to 255 with `new TextDecoder(encoding)` (cache it per encoding), map each character of `text` to its byte, and write `?` (0x3F) for characters the code page lacks, counting them in `lost`. Export `SINGLE_BYTE = ENCODINGS.filter((e) => /^(windows-|ISO-8859|KOI8)/.test(e))`. Tests in test/core.test.ts: "café €" in windows-1252 gives `63 61 66 E9 20 80`, lost 0; "привет" in windows-1251 decodes back to "привет"; "日本" in windows-1252 gives `3F 3F`, lost 2. One commit. (b) ANSI save, UI: in src/components/Tool.astro, encoding panel only (line 263): add a "Save as" select, first option "UTF-8 (recommended)", then one option per `SINGLE_BYTE` entry, labelled like "Windows-1252 (ANSI, Western Europe)" using the `LANG_ENCODINGS` names (src/lib/subs.ts line 466) where they exist. When it is not UTF-8, turn the text from `produce` into bytes with `encodeSingleByte` right before `save` (grep `save(` to find the calls, including the batch zip if encoding mode uses it), and if `lost > 0` show a hint: "N characters don't exist in this encoding and were saved as ?". Default stays UTF-8. Done = `npm test` and build pass, and a /tmp node script that runs `encodeSingleByte` on a sample SRT shows the right bytes. One commit. (c) Two FAQs on fix-subtitle-encoding in src/site.ts: "My TV only shows subtitles saved as ANSI. Can I do that here?" (yes, the Save as list; ANSI means the old code page for your language, Windows-1252 for Western Europe) and "What happens to letters ANSI can't store?" (they become ?, and the tool tells you how many). One commit. DONE (a) and (c) bdabb53, already in main. (b) DONE dd9e1a8: the build was broken with "SINGLE_BYTE is not defined" until that import fix. |
| 4 | Mon 11-23 evening | 11-24-2026 02:17 | (a) Guide `tv-subtitles-not-showing-usb`, title "TV won't show subtitles from USB? Samsung, LG, Sony" (51 characters). Use only the TV facts above. Sections: same name, same folder, lowercase extension, and the hidden `Movie.srt.txt` trap (with a small table of names that work and don't); turn subtitles on in the TV's playback options (describe in words, no menu paths); LG and ANSI: what LG's help page says, what ANSI means, and how to save as Windows-1252 with /fix-subtitle-encoding/ (only if row 3 shipped; otherwise say "Notepad's Save As, Encoding: ANSI" and leave our tool out); USB vs network playback; picture subtitles need /sup-to-srt/; a file that is really VTT or ASS inside (/vtt-to-srt/, /ass-to-srt/, code fact 1). See also: /guides/sup-to-srt-guide/ and /guides/subtitles-weird-characters/. (b) Set `guide: 'tv-subtitles-not-showing-usb'` on fix-subtitle-encoding only if it has no `guide`; add one sentence linking the TV guide from the sup-to-srt-guide. DONE 4c4b476 (fix-subtitle-encoding already had a `guide`, so only the sentence was added). |
| 5 | Tue 11-24 morning | 11-24-2026 14:17 | (a) Guide `subtitles-out-of-sync-partway`, title "Subtitles fine at first, then out of sync? The fix" (brief item 5). Core: a sudden jump means a different cut (ad breaks removed, an extra scene, a recap); a steady growth means frame rate (link /guides/23976-vs-25-fps-subtitles/, don't repeat it). Walk through /shift-subtitles-from-a-line/ step by step (read its preset and options in src/site.ts with grep first) and show the example already on that page. Links: /sync-subtitles/, /guides/subtitles-out-of-sync/. (b) Set `guide: 'subtitles-out-of-sync-partway'` on shift-subtitles-from-a-line if empty. |
| 6 | Tue 11-24 evening | 11-25-2026 02:17 | (a) Guide `kodi-subtitles-out-of-sync`, title "Kodi subtitles out of sync? Fix the file once" (brief item 6). Only the brief's facts; describe menus in words ("the subtitle settings while the video plays"). The core: the player offset is per playback; fix the file with /shift-subtitle-timing/ (fixed offset) or /sync-subtitles/ (two points) and save it next to the video with the same name. Links: /guides/subtitles-out-of-sync-partway/, /guides/23976-vs-25-fps-subtitles/, /guides/plex-subtitles-out-of-sync/. (b) `guide` fields, only where empty: srt-to-vtt or srt-to-ttml gets chromecast-subtitles-not-showing (the first without a guide), preview-subtitles-with-video gets add-subtitles-to-html5-video. |
| 7 | Wed 11-25 morning | 11-25-2026 14:17 | (a) Guide `subtitles-showing-twice`, title "Subtitles showing twice? Two tracks or repeated lines" (brief item 7). Before and after from `fixCommon` with `removeDuplicates: true`, run in a /tmp script. Links: /remove-duplicate-subtitles/, /srt-validator/, /guides/dual-language-subtitles/. Set `guide` on remove-duplicate-subtitles if empty. (b) Guide `remove-tags-from-subtitles`, title "Subtitles show {\an8} or font tags? Remove them" (brief item 8; code fact 2). Before and after from `fixCommon` with `removeTags: true` in /tmp, on a cue with `{\an8}` and one with `<font color="#ffff00">`; say `<i>` is removed too when the option is on. Escape `{` and `<` in the .astro file and check the built page. Links: /subtitle-cleaner/, /ass-to-srt/, /guides/srt-vtt-ass/. Set `guide` on subtitle-cleaner if empty. |
| 8 | Wed 11-25 evening | 11-26-2026 02:17 | (a) Guide `remove-sdh-from-subtitles`, title "Remove [music] and speaker names from subtitles". Read the options of /remove-hearing-impaired-subtitles/ in code (`removeBrackets`, `removeSpeakers`, `removeMusic`, near src/lib/subs.ts line 330) and show a before and after from `fixCommon` in /tmp. Links: /remove-hearing-impaired-subtitles/, /subtitle-cleaner/, /guides/subtitles-to-transcript/. Set `guide` on remove-hearing-impaired-subtitles if empty. (b) Guide `burned-in-vs-soft-subtitles`, title "Soft vs burned-in subtitles: which one you have". How to tell (can you turn them off, do they show in the track menu), why burned-in text can't be fixed with a file, picture vs text tracks. Facts only from this repo's guides and code. Links: /sup-to-srt/, /guides/srt-vtt-ass/, /preview-subtitles-with-video/. |
| 9 | Thu 11-26 morning | 11-26-2026 14:17 | (a) QA pass on every guide from rows 4 to 8: dash scan, one h1, title and description limits, datePublished, 750+ words, links resolve, `<pre>` and tables in the scrolling wrapper at 360px, and no paragraph that matches another guide's (pick two sentences from each new guide and `grep -rl` them across src/pages/guides/). One commit per fix. (b) /guides/ index (src/pages/guides/index.astro): group the list under h2s "Plex, Jellyfin, Kodi and VLC", "TVs, Chromecast and phones", "Editing and uploading", "Fixing the file". Add an optional `topic` field to `GUIDES` entries; add a test that every guide has a topic and appears once. |
| 10 | Thu 11-26 evening | 11-27-2026 02:17 | (a) Guide `subtitles-overlapping-lines`, title "Subtitle lines overlap or flash? Find and fix them". Built only on code: what the validator's overlap, zero-length and too-short checks mean (read the issue kinds near src/lib/subs.ts line 408), then what /fix-subtitle-timing/ changes (read its options). Before and after generated in /tmp. Links: /srt-validator/, /fix-subtitle-timing/, /guides/subtitles-too-fast/. (b) Guide `mx-player-subtitle-sync`, title "MX Player subtitles out of sync? Fix the file" (brief item 9). Menus loosely ("the subtitle menu has a sync setting"). Core: fix the file once so it plays right on the phone, the TV and the laptop. Links: /shift-subtitle-timing/, /sync-subtitles/, /guides/subtitles-out-of-sync/, /guides/kodi-subtitles-out-of-sync/. |
| 11 | Fri 11-27 morning | 11-27-2026 14:17 | (a) Guide `join-cd1-cd2-subtitles`, title "Join CD1 and CD2 subtitles into one file". Read the merge mode in src/components/Tool.astro and the merge-subtitles page in src/site.ts first: how the offset for the second file is set. Before and after from the real code in /tmp. Links: /merge-subtitles/, /shift-subtitle-timing/, /guides/dual-language-subtitles/. (b) "Related guides" at the bottom of each guide: one shared component (src/components/RelatedGuides.astro) that shows two other guides with the same `topic` (needs row 9b; skip if row 9b is not DONE), added to every guide page. Test: every guide page's built HTML has the block. |
| 12 | Fri 11-27 evening | 11-28-2026 02:17 | Expect a free model from here (the model test ends 11-27). One item. (a) Guide `srt-numbers-out-of-order`, title "SRT numbers skipped or out of order? Renumber it". Built on /renumber-srt/ (preset `clean: 'renumber'`; grep for it in src/site.ts) and the validator's out-of-order check. Say "a common cause of import errors in editors and upload pages is bad numbering" and link the Premiere and YouTube guides. Links: /renumber-srt/, /srt-validator/, /guides/youtube-subtitle-upload-error/. |
| 13 | Sat 11-28 morning | 11-28-2026 14:17 | One item. (a) Open `qa` issues first, one fix and one commit each. If none, the QA pass from row 9 on the guides from rows 10 to 12. Then the first item not DONE above. |
| 14 | Sat 11-28 evening | 11-29-2026 02:17 | One item. (a) Backlog item 3 (claims check), one guide per commit, oldest first. Then anything not DONE above. |

## Backlog (in order, for runs that finish early)

Take one item, finish it, commit, then the next. Don't ask the boss for work until all of these are DONE.

1. Pull the next guide row forward (rows are independent, except 11b needs 9b). This beats every other item.
2. `example` on subtitle-reading-speed (one fast line, before and after) and on srt-to-csv (if the CSV is text), each generated by the real code in /tmp, each with a test.
3. Re-read the five oldest guides (subtitles-out-of-sync, srt-vtt-ass, sup-to-srt-guide, plex-subtitles-out-of-sync, subtitles-weird-characters) for claims not backed by code or by the facts in this plan; fix or remove each, one commit per guide.
4. `example` blocks on srt-to-word (only if its output is text you can show) and batch-convert-subtitles (skip if it can't take one). One test each.
5. Pro readiness, behind the flag only: in batch-convert-subtitles, when `?pro=1` is set, offer the saved preset from `subfixer.presets`. Unit-test the part that picks the preset. No pricing, no checkout.

## Cut, and why

- New converter pages: CEO order. Slug count stays 70. The ANSI option goes on the existing /fix-subtitle-encoding/ page.
- DaVinci Resolve guide: sources disagree by version; still no verified facts.
- A Windows Media Player guide: Microsoft Q&A answers say it does not read SRT, and the newer Windows apps behave differently by version. Too uncertain to write without testing.
- A Stremio guide: real demand, but its subtitles come from add-ons and the delay control differs by platform; no verified facts on loading a fixed file. Revisit with research.
- A separate "subtitles drift" guide: the 23.976 and out-of-sync guides own that phrase.
- Hire requests: the CEO's worker budget is 0.
- Roadmap: no change. 110 visits in 30 days gives no case to move the ads or Pro triggers. No decision issue: nothing owner-only moves profit this week.

## Guardrails (seen this week)

- Start every run with `gh issue list --label qa --state open`. Fix open `qa` items before the row's guide, one commit each.
- `node scripts/check-links.mjs` was refused ("requires approval") on 11-21. Try it once; if refused, check links by hand: `npm run build`, then `grep -o 'href="/[^"]*"' dist/<page>/index.html | sort -u`, and every path must exist as `dist/<path>/index.html` (`ls`). Note "check-links blocked, checked by hand" in the commit body. Don't ask the boss about it again.
- All facts are in this file or ops/growth-brief.md. Don't look for facts in old commits.
- Before any Read of src/site.ts or src/components/Tool.astro, Grep -n for the line, then Read at most 40 lines with offset and limit. Never Read the whole file (1,600+ lines; a long Read hung for 9 minutes on 11-20).
- Commit after every item, explicit paths only (`git add src/site.ts src/pages/guides/<slug>/index.astro`), never `git add -A` or `.`. Runs die at the cap and lose anything uncommitted.
- Check every claim about SubFixer in code; run the real code in /tmp for every before and after. Never type one by hand.
- No em or en dashes, no "seamless", "effortless", "powerful" or similar, in any copy. Run the dash grep before committing.
- Guide descriptions: 120 to 155 characters. Titles: at most 60.
- Escape `<` as `&lt;` and `{` as `&#123;` inside code samples in .astro files, and check the built HTML.
- If the API says "overloaded" again and again, keep going with the smallest item in your row; don't restart the row.
- Web search, WebFetch and headless browsers are blocked for daily runs. `rm` is blocked; put probes in /tmp, never in the repo (test/scratch-ssa.ts is an old probe; leave it).
- Don't edit ops/metrics.csv, ops/costs.json, ops/roadmap.md, src/noindex.mjs or anything in .github/.
- If an Edit to src/site.ts fails twice, run `git checkout -- src/site.ts`, note it in the row and move on.
- A half-written guide must not go into `GUIDES`.
- Metrics: sum the visitors column for 30 days, blanks count as 0. No decision issue unless 300 (ads) or 1,000 (Pro) is reached.
- Ask the boss only when blocked or unclear, at most twice a run, and never for work while the backlog has items.
