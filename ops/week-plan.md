# Week plan: 11-20-2026 (Fri) to 11-26-2026 (Thu), replan of 11-19-2026

Written by the boss (Opus) on 11-19-2026 after the CEO's new direction (ops/ceo-notes.md, 11-19-2026). Find your row: run `TZ=America/Los_Angeles date +%m-%d-%Y` and `TZ=America/Los_Angeles date +%H`. Before 12 is the morning run, otherwise the evening run. Evening runs start at 02:17 UTC on the next UTC date. When you finish an item, add `DONE <hash>` at the end of that row's cell. Don't otherwise rewrite this file.

Note on dates: the order for this plan said "today is Sunday", but 11-19-2026 is a Thursday, and the 11-19 evening run had already finished. The table therefore starts at the Friday 11-20 morning run and covers the next 14 runs, to Thursday 11-26 evening. If the regular Sunday planner runs on 11-22, it should keep rows 6 to 14 unless the data changes.

## At a glance

<!-- Summary for the owner's dashboard. Agents: follow the Day-by-day table below and mark DONE there, not here. -->

Goal: Bring in search visitors with guides that fix real subtitle problems, and pass the AdSense review, toward 300 visits by 12-20.

Targets:
- Six new problem guides live, each at least 700 words (8 guides become 14)
- A contact page live and in the sitemap
- 39 tool pages with a tested before-and-after example (now 36)
- 140 visitors in the last 30 days by 11-26 (now 100)

| Run | In plain words |
|---|---|
| 1 | Add a contact page and one more before-and-after example |
| 2 | Guide: Premiere Pro won't import my SRT file |
| 3 | Guide: YouTube won't accept my subtitle file |
| 4 | Two more before-and-after examples, and link the two new guides from tool pages |
| 5 | Guide: Jellyfin subtitles show wrong letters or don't appear |
| 6 | Guide: subtitles go by too fast to read |
| 7 | Guide: turning a subtitle file into a clean transcript |
| 8 | A "common problems" list on the home page that points to the guides |
| 9 | Guide: Samsung or LG TV won't show subtitles from a USB stick |
| 10 | Check every new guide: word counts, links, titles, phone layout |
| 11 | Two short answers on each of the four most visited tool pages |
| 12 | Link the new guides from the older guides and the matching tool pages |
| 13 | Finish anything left over, then work down the backlog |
| 14 | Finish anything left over, then work down the backlog |

## Money picture

Spent so far (cash, ops/costs.json in both repos):
- SubFixer: $18.20 ($8.20 subfixer.app domain, $10.00 OpenRouter credit shared by both ventures).
- Stayfile: $8.20 (stayfile.app domain).
- Both ventures: $26.40 spent, $0.00 earned. OpenRouter credit used is about $0.39 of $10; daily runs are on free models and the credit has not moved since 11-11-2026.

Monthly costs from now on:
- subfixer.app renews at $14.20 a year: $1.18 a month. stayfile.app about the same: $1.18 a month.
- API: $0 to $0.50 a month on free models. Hosting (Cloudflare Pages), email routing and CI cost nothing.
- SubFixer about $1.70 a month. Both ventures about $2.90 a month.

Where revenue comes from, in order:
1. AdSense. Applied 11-09-2026 for both sites, one account. On 11-18-2026 Google marked stayfile.app "Low value content". SubFixer has not had a verdict yet, and the same reviewer standard applies, so this week keeps adding original pages and the pages Stayfile needed to fix (a contact page; SubFixer already has the ads and cookies paragraph on /privacy/ and a full /about/). The 20 thinnest converter pages are already noindexed (src/noindex.mjs). Roadmap trigger to show ads: about 300 visits in 30 days. AdSense pays out only at a $100 balance.
2. SubFixer Pro (batch fixing and saved presets, about $4 a month or $24 a year, checkout through Polar once the owner creates it). Trigger: 1,000 visits in 30 days. Saved presets are built behind `?pro=1`. Pricing stays hidden.

Break-even, assumptions stated:
- Ads: conservative page RPM of $1.50 and 1.3 pages per visit, so about $2.00 per 1,000 visits. SubFixer alone ($1.70 a month) needs about 850 visits a month. Both ventures ($2.90) need about 1,450 a month combined.
- Pro: 0.2% of monthly visitors subscribe. One subscriber (about $3.40 net after Polar's fee) covers either venture's monthly costs, which needs about 500 visits a month.

Where we are: 100 visits in the 30 days since 11-09 (ops/metrics.csv: 40, 20, 0, 10, 10, 0, 0, 10, 10, blank). 40 in the last 7 days. That is 33% of the ads trigger and 10% of the Pro trigger. Search Console (issue #9) shows 34 pages indexed with no errors, so the gap is ranking, not indexing. A `site:subfixer.app` web search on 11-19-2026 still returned nothing from the site, which is lag on the search side.

CEO goal: 300 visitors in a 30-day window by 12-20-2026. That window is 11-21 to 12-20, so the site needs about 10 visits a day on average, against 5.7 now. Traffic has to roughly double, and only new search entry points can do that. Hence guides for problem searches, one per run.

This week's targets (checked by the planner at the next session):
1. Six new guides in `GUIDES` (count goes from 8 to 14), each 700+ words. Check: `grep -c "{ slug: '" src/site.ts` near GUIDES, `npm run build`, then `grep -c '/guides/' dist/sitemap-0.xml` is at least 15 (index plus 14).
2. /contact/ is live: `ls dist/contact/index.html` and `grep -c '/contact/' dist/sitemap-0.xml` prints 1.
3. 39 example blocks: `grep -c "example: {" src/site.ts` prints 39, and `npm test` passes.
4. Outside the agents' control: 140 visitors in the last 30 days in ops/metrics.csv by 11-26-2026.

## Last week

- Shipped: all 14 rows and the whole backlog in the first four runs (11-16 to 11-18). 6 guides, a /guides/ index, 36 tested example blocks, FAQs on the top pages, saved presets behind `?pro=1`, and 20 thin converter pages noindexed.
- Then the plan ran out. Two runs asked the boss for work, and three of the last four runs ended in error after about an hour.
- Why they failed (run logs): the 11-20 02:17 run lost about 15 minutes to "overloaded" (529) API retries, then one Read call hung for 9+ minutes and the run hit the cap with nothing shipped. The 11-19 14:17 run shipped nothing. The 11-19 02:17 run shipped the noindex work but was marked failed.
- The three examples the boss assigned on 11-20 (change-subtitle-frame-rate, shift-subtitles-from-a-line, srt-to-csv) were not done. They are in rows 1 and 4.
- Data: traffic is flat at about 5 a day. The site is indexed but ranks for nothing yet; format-name pages ("srt to vtt") face sites with years of links.

## Research done for you (use these facts; don't invent others)

The daily runs can't search the web. Everything below was checked on 11-19-2026. These are user reports and help pages, not official promises, so write "a common cause is", not "the cause is". Never name a competitor site in copy. Every claim about what SubFixer does must be checked in the code first (src/lib/subs.ts, src/lib/formats.ts, src/lib/tidy.ts, src/lib/export.ts).

What SubFixer's code does (verified by the boss, still check before you quote it):
- SRT and VTT output uses Windows line endings (CRLF): src/lib/subs.ts line 188.
- The validator (`srt-validator`, issue kinds in src/lib/subs.ts around line 408) flags: empty lines, zero-length lines, lines that end before they start, too-short lines, overlaps, and lines out of order.
- Reading speed (`subtitle-reading-speed`, src/lib/tidy.ts) measures characters per second, rewraps long lines into two rows and stretches fast lines where there is room.
- CSV export has a BOM so Excel opens it as UTF-8 (src/lib/export.ts line 28). SRT output: check yourself whether it writes a BOM before you say anything about BOMs.
- Whether a dot instead of a comma in an SRT timestamp (`00:00:05.000`) is accepted and fixed: check by running `parse` and `build` on a two-cue sample in a /tmp script. Write only what the output shows.

Premiere Pro (phrases: "premiere pro srt import error", "the importer reported a generic error srt", "premiere pro captions won't import"):
- Normal path: File > Import (Ctrl+I or Cmd+I), pick the .srt. Premiere 2021 and later puts it on a captions track above the video tracks.
- "The importer reported a generic error" is the message people hit. Reported causes: a malformed timestamp (one beta showed "Parse Error: Invalid time stamp: 5.0 on line 2"), dots instead of commas in times, Mac-style line endings, a blank line at the top, characters outside the expected encoding (one report with Ukrainian text), and files from YouTube with a different time layout.
- Import stops at the first bad line, so a file that imports only half the captions has an error where the captions stop.
- Old captions from an earlier failed try can stay in the media cache; clearing it helped some users.
- If captions start at 00:00 instead of the video time, the captions panel has Import Settings for start time.
- Fix with SubFixer: run the file through /srt-validator/, then save it from any SRT tool (clean numbering, comma times, CRLF), /fix-subtitle-encoding/ for odd letters, /vtt-to-srt/ if it's really a VTT renamed to .srt.

YouTube (phrases: "youtube subtitles upload failed", "youtube studio srt invalid file", "youtube sbv format"):
- Upload path: YouTube Studio > Subtitles > pick the video > Add language or the language row > Upload file > "With timing" > pick the file.
- Common causes: a VTT or ASS file renamed to .srt (the inside is still the old format; a file that starts with `WEBVTT` or `[Script Info]` is not SRT), a .txt extension, dots in times, missing blank lines between cues, numbering that skips.
- SBV is YouTube's own simple format: no numbers, times like `0:00:01.000,0:00:04.000`. Download path (from the SBV pages): the options menu (three dots) on the language row > Download, which offers .sbv, .srt and .vtt, only for channels you can sign into.
- Fix with SubFixer: /srt-validator/, /vtt-to-srt/, /ass-to-srt/, /srt-to-sbv/, /sbv-to-srt/.

Jellyfin (phrases: "jellyfin subtitles wrong encoding", "jellyfin subtitles not showing", "jellyfin external subtitles"):
- Wrong letters: the external .srt is in an old encoding (Windows-1250/1252/1251, ISO-8859-2), not UTF-8. Forum fix is to save it as UTF-8. Boxes or question marks can also mean the font lacks the letters.
- Naming (jellyfin.org docs "External files"): the subtitle must start with the exact video file name, then an ISO language code: `Atomic Blonde.mkv` and `Atomic Blonde.en.srt`. Without a code the track shows as "Undefined". Flags: `Movie.en.forced.srt`; hearing-impaired tags `sdh`, `cc`, `hi` (10.9 and later), but `hi` alone reads as Hindi, so write `Movie.en.hi.srt`. Extra release tags in the name can stop the match. After renaming, rescan the library or refresh that item's metadata.
- Sync: the web player has a subtitle offset for text subtitles (SRT, VTT), but it is per client and not saved in the file. Picture subtitles (PGS) can't be offset. A permanent fix is to shift the file.
- Fix with SubFixer: /fix-subtitle-encoding/, /shift-subtitle-timing/, /sup-to-srt/ for picture subtitles. Link the Plex guide and the weird-characters guide.

Subtitles too fast (phrases: "subtitles too fast", "subtitles too fast to read", "subtitle reading speed"):
- Reading speed is measured in characters per second (CPS). Common guidance: 15 to 20 CPS is comfortable, about 21 CPS is a usual upper limit for Latin-alphabet languages. Children's content goes lower.
- Fixes in order: give the line more time (extend its end into a gap), shorten the text, merge with a neighbour. Extending one line can squeeze the next, so check neighbours.
- Different problem: if every line is early or late, or drift grows through the film, it's sync, not speed. Link /guides/subtitles-out-of-sync/ and /guides/23976-vs-25-fps-subtitles/.
- Fix with SubFixer: /subtitle-reading-speed/ (check `cps` in src/lib/tidy.ts for the default limit before quoting a number), /fix-subtitle-timing/.

Subtitle to transcript (phrases: "srt to text without timestamps", "convert srt to transcript", "srt to word"):
- Tools: /srt-to-txt/, /vtt-to-txt/, /srt-to-word/, /srt-to-csv/. Read their presets in src/site.ts and the TXT/Word builders in src/lib/formats.ts and src/lib/export.ts before describing the options (joining lines, removing tags, keeping times or not).
- Cross-link to Stayfile where a reader wants it: "To share the transcript as a PDF, paste it into Stayfile's free text to PDF tool" linking https://stayfile.app/text-to-pdf/, and for a spreadsheet of lines https://stayfile.app/csv-to-excel/. These are the only two outside links this week. No growth brief exists yet (ops/growth-brief.md is missing), so use exactly these.

Samsung and LG TVs (phrases: "samsung tv subtitles not showing usb", "lg tv srt subtitles not working"):
- The .srt must be in the same folder as the video with exactly the same base name: `Movie.mp4` and `Movie.srt`. Windows hides extensions, so a file can really be `Movie.srt.srt` or `Movie.srt.txt`; turn on "File name extensions" in File Explorer's View menu to check.
- Turn subtitles on in the TV's playback options; re-open the folder or replug the stick after copying files.
- A USB stick often works where a network share (DLNA) does not, with the same files. With Plex or Serviio as the server, users set the TV's profile in the server's settings.
- Picture subtitles (PGS, VobSub) usually don't show; convert to SRT. Embedded subtitles in MP4 often fail where MKV works.
- Garbled letters: LG's own help page recommends ANSI encoding for its TVs. Older TVs may not read UTF-8 well; say "try the other encoding if one fails". Check what encodings /fix-subtitle-encoding/ can save to before you promise one.
- Fix with SubFixer: /sup-to-srt/, /fix-subtitle-encoding/, /vtt-to-srt/, /ass-to-srt/ (TVs read SRT most reliably).

## Day-by-day

Every guide copies the structure of `src/pages/guides/plex-subtitles-out-of-sync/index.astro`: `Base` with `ogType="article"` and an `Article` jsonld, one h1 and a lede, 4 to 7 h2 sections, links to 3 or more tool pages, a "See also" link to another guide. Title at most 60 characters, description at most 160. At least 700 words of real text: the problem, how to tell the causes apart, the fix step by step, then the tool. Add `{ slug, title }` to the end of `GUIDES` in src/site.ts only when the guide builds and passes 700 words. Set `guide: '<slug>'` on the named tool page only if that page has no `guide` yet.

Each row is sized to finish in 40 minutes. Commit after each item, with explicit paths.

| # | Run (PT) | Start (UTC) | Items |
|---|---|---|---|
| 1 | Fri 11-20 morning | 11-20-2026 14:17 | (a) AdSense: new page `src/pages/contact/index.astro`, path /contact/, title "Contact | SubFixer", h1 "Contact". Text: who runs it (copy the tone of /about/), email `hello@subfixer.app` as a mailto link, what to include in a bug report (browser, the format, a short sample with private lines removed), that files are never uploaded so we can't see yours, and that we reply within a few days. Add a Contact link in the footer of `src/layouts/Base.astro` line 93 next to About. Done = `dist/contact/index.html` exists and `/contact/` is in dist/sitemap-0.xml. Commit (a) before starting (b); (a) needs no edit to src/site.ts. Foreman 11-20-2026: do (a) first because it is the AdSense item. **DONE 11c1de2** (b) `example` on change-subtitle-frame-rate: 23.976 to 25, times at 00:10:00 and 01:30:00, generated by running the real code in /tmp, plus a specific test in test/core.test.ts. Done = 37 example blocks, `npm test` passes. |
| 2 | Fri 11-20 evening | 11-21-2026 02:17 | Guide: slug `premiere-pro-srt-import-error`, title "Premiere Pro won't import your SRT? How to fix it". Use the Premiere facts. Sections: the generic error and what it usually means; check the file (validator); the common causes (times, line endings, blank top line, encoding, renamed VTT); half-imported captions; captions at the wrong start time; clearing the cache. Run the dot-vs-comma check in /tmp first. Set `guide` on srt-validator. |
| 3 | Sat 11-21 morning | 11-21-2026 14:17 | Guide: slug `youtube-subtitle-upload-error`, title "YouTube won't accept your subtitle file: the fixes". Use the YouTube facts. Sections: the upload path; how to see what format the file really is (first line); renamed VTT/ASS; times and blank lines; SBV, YouTube's own format; after the upload (check timing in the preview). Set `guide` on srt-to-sbv. |
| 4 | Sat 11-21 evening | 11-22-2026 02:17 | (a) `example` on shift-subtitles-from-a-line (cues 1 and 2 stay, cue 3 moves 2 s later) and on subtitle-reading-speed (a fast line before and after), each with a specific test. If either mode can't take a static example, use srt-to-csv instead. Done = 39 example blocks, `npm test` passes. (b) Set `guide: 'youtube-subtitle-upload-error'` on sbv-to-srt if it has no guide. |
| 5 | Sun 11-22 morning | 11-22-2026 14:17 | Guide: slug `jellyfin-subtitles-fix`, title "Jellyfin subtitles: wrong letters, missing or out of sync". Use the Jellyfin facts. Sections: wrong letters (encoding); a table of file names that work and ones that don't; forced and SDH names; out of sync (offset vs fixing the file); picture subtitles. Link the weird-characters and Plex guides. |
| 6 | Sun 11-22 evening | 11-23-2026 02:17 | Guide: slug `subtitles-too-fast`, title "Subtitles too fast to read? Check the reading speed". Use the reading-speed facts. Sections: what CPS is with a worked example (count a real line); comfortable limits; three fixes; when it's sync, not speed; check a whole file in one go. Set `guide` on subtitle-reading-speed. |
| 7 | Mon 11-23 morning | 11-23-2026 14:17 | Guide: slug `subtitles-to-transcript`, title "Turn a subtitle file into a clean transcript". Use the transcript facts and the two Stayfile links. Sections: why strip times; to plain text; to Word; to a spreadsheet; tidy it first (remove hearing-impaired tags, find and replace); share it as a PDF (Stayfile link). Set `guide` on srt-to-txt. |
| 8 | Mon 11-23 evening | 11-24-2026 02:17 | Home page: add a section "Fix a common problem" in `src/pages/index.astro`, below the tool list, with one line per problem guide (Plex, VLC, Jellyfin, Premiere, YouTube, weird letters, too fast, drift), each a link with the problem in the visitor's words ("Subtitles out of sync in Plex"). Build it from `GUIDES` if that is simpler. Done = build clean, every link resolves (`node scripts/check-links.mjs` if it runs), home page has one h1. |
| 9 | Tue 11-24 morning | 11-24-2026 14:17 | Guide: slug `tv-subtitles-not-showing-usb`, title "TV won't show subtitles from USB? Samsung and LG fixes". Use the TV facts. Sections: name and folder (with the hidden-extension trap); turn them on; USB vs network; picture and embedded subtitles; garbled letters. |
| 10 | Tue 11-24 evening | 11-25-2026 02:17 | QA on the six new guides and /contact/: banned-word and dash scan, one h1 each, titles at most 60 and descriptions at most 160 characters, every internal href resolves, sitemap count, 700+ words each, `<pre>` and tables wrapped for 360px. Fix what fails, one commit per fix. |
| 11 | Wed 11-25 morning | 11-25-2026 14:17 | Two FAQs each, verified in code, on srt-validator, subtitle-reading-speed, fix-subtitle-encoding and vtt-to-srt. Each answers a question from the guides above in two sentences and links its guide. Done = tests and build pass, slug count still 70. |
| 12 | Wed 11-25 evening | 11-26-2026 02:17 | Link each new guide from one matching paragraph in the older guides: Premiere and YouTube from srt-vtt-ass; Jellyfin from plex-subtitles-out-of-sync and subtitles-weird-characters; too fast from subtitles-out-of-sync; TV from sup-to-srt-guide. One sentence each, in context, not a list. |
| 13 | Thu 11-26 morning | 11-26-2026 14:17 | Finish anything not DONE above, oldest first. Then the backlog in order. |
| 14 | Thu 11-26 evening | 11-27-2026 02:17 | Finish anything not DONE above. Then the backlog in order. |

## Backlog (in order, for runs that finish early)

Take one item, finish it, commit, then the next. Don't ask the boss for work until all of these are DONE.

1. Pull the next guide row forward (the rows are independent). This beats any other backlog item.
2. Guide: slug `burn-subtitles-vs-soft-subtitles`, title "Soft vs burned-in subtitles: which one you have". How to tell (can you turn them off), why burned-in can't be fixed with a file, picture vs text tracks. Links /sup-to-srt/, /srt-vtt-ass/ guide, /preview-subtitles-with-video/. Use only facts you can check in this repo's guides and code.
3. Guide: slug `remove-sdh-from-subtitles`, title "Remove [music] and speaker names from subtitles". Built around /remove-hearing-impaired-subtitles/: read its options in code and show a before and after generated by the real code.
4. `example` blocks, in order: srt-to-csv, srt-to-word (only if its output is text you can show), batch-convert-subtitles (skip if it can't take one).
5. FAQ on srt-to-csv: "The CSV opens in one column in Excel" with a link to https://stayfile.app/guides/csv-opens-in-one-column-in-excel/. Check first that the CSV has a BOM and commas (src/lib/export.ts).
6. Pro readiness, behind the flag only: in batch-convert-subtitles, when `?pro=1` is set, offer the saved preset from `subfixer.presets`. Unit-test the part that picks the preset. No pricing, no checkout.

## Cut this week, and why

- New converter (X-to-Y) pages: CEO order, and they raise the AdSense thin-content risk. Slug count stays 70.
- DaVinci Resolve SRT guide: sources disagree about what Resolve imports by version, and wrong facts in a guide cost trust. Dropped until the boss can verify it.
- Kodi subtitle offset guide: no clear answer on saving the offset; not enough facts.
- More example blocks beyond 39: done enough for the review; each one moves no search traffic.
- Hire requests: the CEO's worker budget is 0.

## Guardrails (seen this week)

- Foreman 11-20-2026: three of the last four runs failed (a 9-minute hung Read of src/site.ts, API overload). Before any Read of src/site.ts, Grep -n for the line, then Read at most 40 lines with offset and limit. Commit after every item so a timeout loses nothing.
- Find your row by Pacific date and hour. The 11-21-2026 02:17 UTC run is row 2, "Fri 11-20 evening".
- Ship first, in small commits. Runs die at the cap and lose anything uncommitted. Commit each finished item at once, with explicit paths (`git add src/site.ts test/core.test.ts`), never `git add -A` or `.`.
- Never Read all of src/site.ts. It is 1,400+ lines; use Grep with `-n` to find the slug, then Read with offset and limit (about 40 lines). A long Read hung for 9 minutes on 11-20.
- If the API says "overloaded" again and again, keep going with the smallest item in your row; don't restart the row.
- Write a guide in one go: draft the whole .astro file with Write, then build, then count words. Don't make many small Edits to a new file.
- Don't ask the boss for work while the backlog has items. Ask only when something is blocked or unclear, at most twice per run.
- Web search, WebFetch and headless browsers are blocked for daily runs. The facts you need are above. If a fact you need is missing, leave the claim out.
- `rm` is blocked. Put probes in /tmp, never in the repo.
- Don't edit ops/metrics.csv, ops/costs.json, ops/roadmap.md, src/noindex.mjs or anything in .github/.
- If an Edit to src/site.ts fails twice, run `git checkout -- src/site.ts`, note it in the row and move on.
- Never claim a feature the code doesn't have. Run the code in /tmp to check outputs; never type a "before and after" by hand.
- A half-written guide must not go into `GUIDES`. Add it only when it builds and has 700+ words.
- Metrics: sum the visitors column for 30 days, blanks count as 0. No decision issue unless 300 (ads) or 1,000 (Pro) is reached.
