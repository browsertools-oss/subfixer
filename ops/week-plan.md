# Week plan: 11-21-2026 (Sat) to 11-29-2026 (Sun morning), replan of 11-20-2026

Written by the boss (Opus) on 11-20-2026 (Pacific) after the CEO's 11-20-2026 replan order. Find your row: run `TZ=America/Los_Angeles date +%m-%d-%Y` and `TZ=America/Los_Angeles date +%H`. Before 12 is the morning run, otherwise the evening run. Evening runs start at 02:17 UTC on the next UTC date. When you finish an item, add `DONE <hash>` at the end of that item in its row. Don't otherwise rewrite this file.

Note on dates and run count: the order said "today is Sunday", but 11-20-2026 is a Friday and the Friday evening run (02:17 UTC 11-21) has already finished. The CEO ordered work through Sunday 11-29, so this plan has 16 rows (Sat 11-21 morning to Sat 11-28 evening). The Sun 11-29 morning run takes the backlog. If a Sunday 11-22 planner runs, it should keep this plan unless the data changes.

## At a glance

<!-- Summary for the owner's dashboard. Agents: follow the Day-by-day table below and mark DONE there, not here. -->

Goal: Publish twelve more guides that answer real subtitle problems, so search visitors arrive by 12-20 and the AdSense review sees solid content.

Targets:
- 25 guides live, each at least 750 words (13 now)
- Quality issues 16 and 17 fixed and closed
- Every guide linked from the home page and a matching tool page
- 160 visitors in the last 30 days by 11-28 (110 now)

| Run | In plain words |
|---|---|
| 1 | Fix the contact page and transcript guide notes, add a common problems list to the home page |
| 2 | Guide: TV won't show subtitles from a USB stick; rename the Blu-ray subtitles guide |
| 3 | Guides: VLC shows no subtitles, and Plex doesn't find my subtitle file |
| 4 | Check all guides for errors, add short answers to four busy tool pages |
| 5 | Guides: subtitles don't show when casting to Chromecast, and subtitles on a web page video |
| 6 | Link new guides from older guides, add the three Stayfile links |
| 7 | Guides: subtitles go out of sync halfway through, and Kodi subtitles out of sync |
| 8 | Guides: subtitles show twice, and odd codes like {\an8} in subtitles |
| 9 | Guide: MX Player subtitles out of sync, plus two before and after examples |
| 10 | Guides: soft versus burned-in subtitles, and removing [music] and speaker names |
| 11 | Check the newest guides, link each from its tool page |
| 12 | Group the guides page by player and problem |
| 13 | Guide: subtitle lines overlap or flash on screen |
| 14 | Guide: join CD1 and CD2 subtitles into one file |
| 15 | Guide: subtitle numbers skipped or out of order |
| 16 | Finish anything left over, then work down the backlog |

## Money picture

Spent so far (ops/costs.json in both repos): SubFixer $18.20 ($8.20 domain, $10.00 OpenRouter credit shared by both ventures). Stayfile $8.20 (domain). Both: $26.40 spent, $0.00 earned.

Monthly costs going forward:
- Domains: subfixer.app renews at $14.20 a year, $1.18 a month; stayfile.app about the same. $2.36 a month for both.
- API: the owner's model test (11-20 to 11-27) lets the crews spend up to $1 a day on a paid model ($0.25 cap per run, .github/agent/models.json). If that continued, it would be about $30 a month across both ventures. On free models it is about $0. The credit left is about $9.60, so at $1 a day it runs out around 11-29 or 11-30.
- Hosting, email routing, CI: $0.
- So: about $2.40 a month on free models, about $32 a month if the paid model stays.

Where revenue comes from, in order:
1. AdSense. Applied 11-09-2026, no verdict for SubFixer yet (Stayfile was flagged "Low value content" on 11-18). Needs original pages, clear navigation, contact, privacy and about pages (all live). Ads show only after approval; payout at a $100 balance. Roadmap trigger to show ads: about 300 visits in 30 days.
2. SubFixer Pro (batch fixing, saved presets, about $4 a month or $24 a year, Polar checkout once the owner creates it). Trigger: 1,000 visits in 30 days. Built behind `?pro=1`, pricing hidden.

Break-even (assumptions: page RPM $1.50, 1.3 pages a visit, so about $2 per 1,000 visits; Pro nets about $3.40 a subscriber a month, 0.2% of monthly visitors subscribe):
- On free models: ads cover SubFixer's $1.20 a month at about 600 visits a month, both ventures at about 1,200. One Pro subscriber covers either venture (about 500 visits a month at 0.2%).
- With the paid model kept on: $32 a month needs about 16,000 visits a month from ads, or about 10 Pro subscribers (about 5,000 visits a month). For the CEO: the paid model shipped seven rows in one run, which is worth it this week while pages need time to rank, but it can't be a monthly cost before revenue exists.

Where we are: 110 visitors in the 30 days to 11-20 (ops/metrics.csv: 40, 20, 0, 10, 10, 0, 0, 10, 10, 0, 10; 11-20 not counted yet), 30 in the last 7 days. That is 37% of the ads trigger and 11% of the Pro trigger. Counts come in steps of 10 (sampling). 34 pages are indexed (Search Console, issue #9) but rank for nothing yet; a `site:subfixer.app` search on 11-20 returned nothing. The 70 visits from 11-09 to 11-13 drop out of the window around 12-09, so the CEO goal of 300 by 12-20 needs about 10 visits a day from search by early December. Only new problem guides can do that, and the ones live this week have three to four weeks to rank.

This week's targets (the planner checks them next session):
1. 25 entries in `GUIDES`: `sed -n '/export const GUIDES/,/^];/p' src/site.ts | grep -c "slug: '"` prints 25, and after `npm run build`, `grep -c '/guides/' dist/sitemap-0.xml` is at least 26.
2. Issues 16 and 17 closed with a comment naming the fix commits.
3. Every guide slug appears in dist/index.html, and `grep -c "guide: '" src/site.ts` is at least 28 (20 now).
4. Outside the agents' control: 160 visitors in the last 30 days in ops/metrics.csv by 11-28-2026.

## Last week in five lines

- Shipped 11-20 and 11-21: /contact/, five guides (Premiere, YouTube, Jellyfin, too fast, transcript), two examples (38 now). Old rows 1 to 7 are done.
- Slipped: old rows 8 to 12 (home page list, TV guide, QA, FAQs, cross-links) and the reading-speed example.
- Runs: the 11-21 02:17 UTC run on the paid model did seven rows in 40 minutes. The four runs before it, on free models, failed at the time cap, three with nothing shipped.
- Quality: issues 16 and 17 found dashes on /contact/, stray markup and a wrong sentence in the transcript guide, long descriptions. Small, but AdSense reads these pages.
- Data: 30 visitors in the last 7 days, flat. Indexed, not ranking. Forum threads and thin articles rank for our problem phrases, so complete guides can win.

## Facts for this week (checked by the boss in code and on the web on 11-20-2026)

The daily runs can't search the web. The facts below are the only outside facts to use. User reports and help pages are not promises, so write "a common cause is". Never name a competitor site in copy. If a fact you need is not here or in the code, leave the claim out.

SubFixer code facts (verified 11-20-2026; still look at the line before you quote it):
- `parse` in src/lib/subs.ts (line 132) detects the format from the file's content, not its name. So a VTT or ASS file renamed to .srt still opens in any SubFixer tool, and saving it as SRT gives a real SRT.
- `stripTags` (src/lib/subs.ts line 116) removes HTML-style tags like `<i>` and `<font color="...">` and ASS override tags like `{\an8}` and `{\i1}`. The cleaner (/subtitle-cleaner/) has a "tags" option that runs it (src/components/Tool.astro line 885, `removeTags: on('tags')`). So the tags guide is a go.
- SRT and VTT output use CRLF line endings (src/lib/subs.ts line 189). VTT output drops `{\...}` tags and keeps only `<i>`, `<b>`, `<u>` tags (line 183).
- Downloads are made with `new Blob([...])` from a JavaScript string (src/components/Tool.astro line 1217), and browsers encode string Blobs as UTF-8. So SRT and VTT downloads are UTF-8. Say "saved as UTF-8".
- /fix-subtitle-encoding/ reads a file in a chosen or guessed encoding and saves it as UTF-8 (src/lib/flow.ts line 82).
- The validator (/srt-validator/) flags empty lines, zero-length lines, lines that end before they start, too-short lines, overlaps, and lines out of order.
- Tool pages that exist: /srt-validator/, /fix-subtitle-encoding/, /vtt-to-srt/, /ass-to-srt/, /srt-to-vtt/, /srt-to-ttml/, /preview-subtitles-with-video/, /shift-subtitles-from-a-line/, /sync-subtitles/, /shift-subtitle-timing/, /fix-subtitle-timing/, /remove-duplicate-subtitles/, /merge-subtitles/ (dual-language, or join CD1 and CD2 with an offset), /subtitle-cleaner/, /remove-hearing-impaired-subtitles/, /renumber-srt/, /sup-to-srt/, /srt-to-csv/, /srt-to-word/, /srt-to-txt/. Check any other slug with `grep -n "slug: '<slug>'" src/site.ts` before linking it.

The guide facts for VLC, Plex, Chromecast, HTML5, out of sync partway, Kodi, showing twice, tags and MX Player are in ops/growth-brief.md (11-20-2026), numbered 1 to 9. Use them as written there. Extra facts per guide are in its row below.

## Day-by-day

How to write a guide (every guide row): copy the structure of `src/pages/guides/plex-subtitles-out-of-sync/index.astro`: `Base` with `ogType="article"`, an `Article` jsonld with `datePublished` set to today's date in YYYY-MM-DD, one h1 from the title and a lede, 4 to 7 h2 sections, links to 3 or more tool pages, a "See also" link to another guide. Title at most 60 characters, description 120 to 155 characters. 750+ words of real text (`node scripts/wordcount.cjs` or `sed 's/<[^>]*>//g' <file> | wc -w`): the symptom, how to tell the causes apart, the fix step by step, then the tool. Indent consistently (two spaces per level, like the Plex guide), end the file with a newline, no em or en dashes (`grep -n "—\|–" <file>` prints nothing). Write the whole file with one Write, then build, then count. Add `{ slug, title }` to the end of `GUIDES` in src/site.ts only when it builds and passes 750 words. Set `guide: '<slug>'` on a named tool page only if it has no `guide` yet. Run `npm test`, `npm run build` and `node scripts/check-links.mjs` before each commit. One commit per guide.

Two or three items a run while the paid model lasts. Each item is sized to finish and commit in 20 minutes. If the run is on a free model (slow, or the paid cap was hit), do item (a) only, commit, and leave (b) for the next run.

| # | Run (PT) | Start (UTC) | Items |
|---|---|---|---|
| 1 | Sat 11-21 morning | 11-21-2026 14:17 | (a) Issue 16, /contact/ (src/pages/contact/index.astro): line 36 "10 to 20 lines"; line 45 "Licensing, attribution, or anything else: just ask."; `ogType="website"`; jsonld becomes a `ContactPage` (no Organization); add links to /about/ and /privacy/; next to the sample request add "A sample you choose to email is shared with us; files you open in the tools never leave your device." Close 16 with `gh issue close 16 --comment "Fixed in <hash>"`. (b) Issue 17, all bullets: in subtitles-to-transcript remove the stray `</p>`, show the find-and-replace patterns in `<code>`: `\{[^}]*\}` for ASS tags and `<[^>]+>` for HTML tags, mention the "Word as a table" export (check its label in src/lib/export.ts first), delete the "only two outside links" sentence, fix indentation and the trailing newline; in premiere-pro-srt-import-error rename the bullet to "Line feed only line endings" and fix indentation; in jellyfin-subtitles-fix add `datePublished` and a link to https://jellyfin.org/docs/general/server/media/external-files/ beside the naming rules; trim every guide description over 155 characters. Close 17 the same way. (c) Home page: section "Fix a common problem" in src/pages/index.astro below the tool list, built from `GUIDES` (so new guides appear by themselves), each link text the guide title. Done = one h1, check-links passes. |
| 2 | Sat 11-21 evening | 11-22-2026 02:17 | (a) Guide `tv-subtitles-not-showing-usb`, title "TV won't show subtitles from USB? Samsung and LG fixes". Facts: the TV section of last week's plan (in git: `git show 8eca2b1:ops/week-plan.md \| grep -A8 "Samsung and LG"`). Sections: name and folder (hidden-extension trap: `Movie.srt.txt`); turn them on in playback options; USB vs network share; picture and embedded subtitles; garbled letters (UTF-8 is what our tools save; "try the other encoding if one fails" only as advice). Tools: /sup-to-srt/, /fix-subtitle-encoding/, /vtt-to-srt/, /ass-to-srt/. (b) Retitle the SUP guide: in `GUIDES` change the sup-to-srt-guide title to "PGS subtitles won't show? Convert them to SRT" and change its description in src/pages/guides/sup-to-srt-guide/index.astro to start with the problem (a TV or player that won't show Blu-ray picture subtitles). Keep the URL. Done = the built page's `<title>` and h1 show the new title. |
| 3 | Sun 11-22 morning | 11-22-2026 14:17 | (a) Guide `vlc-subtitles-not-showing`, title "VLC not showing subtitles? Check these five things" (brief item 1). Links: /guides/vlc-subtitle-delay/, /guides/subtitles-weird-characters/, /srt-validator/, /fix-subtitle-encoding/, /vtt-to-srt/. Add the fact that a renamed VTT or ASS still opens in our tools (code fact 1). (b) Guide `plex-subtitles-not-showing`, title "Plex not finding your SRT? Fix the name and the file" (brief item 2). Links: /guides/plex-subtitles-out-of-sync/, /guides/jellyfin-subtitles-fix/, /srt-validator/, /ass-to-srt/, /vtt-to-srt/, /fix-subtitle-encoding/. Include a small table: file names that match and ones that don't. |
| 4 | Sun 11-22 evening | 11-23-2026 02:17 | (a) QA pass on every guide made since 11-20 plus /contact/: dash scan, one h1, title 60 and description 155 limits, datePublished present, check-links passes, 750+ words, `<pre>` and tables inside a wrapper that scrolls at 360px (copy how the Plex guide does it). One commit per fix. (b) Two FAQs each on srt-validator, subtitle-reading-speed, fix-subtitle-encoding and vtt-to-srt in src/site.ts. Each answers a question from a guide in two sentences, is true in code, and names its guide. Done = tests and build pass, `grep -cE "^\s+slug: '" src/site.ts` unchanged. |
| 5 | Mon 11-23 morning | 11-23-2026 14:17 | (a) Guide `chromecast-subtitles-not-showing`, title "Chromecast not showing subtitles? Use WebVTT" (brief item 3). Say our SRT to VTT output is UTF-8 (code fact 4). Links: /srt-to-vtt/, /srt-to-ttml/, /fix-subtitle-encoding/, /guides/srt-vtt-ass/. (b) Guide `add-subtitles-to-html5-video`, title "Add subtitles to an HTML5 video: SRT to track" (brief item 4). The `<video>` sample goes in a `<pre><code>` block with `&lt;` escapes; check the built page shows it as text. Links: /srt-to-vtt/, /preview-subtitles-with-video/, /guides/srt-vtt-ass/. |
| 6 | Mon 11-23 evening | 11-24-2026 02:17 | (a) Cross-links, one sentence each inside a fitting paragraph, not a list: Premiere and YouTube guides from srt-vtt-ass; Jellyfin and Plex-not-showing from plex-subtitles-out-of-sync; too fast from subtitles-out-of-sync; TV from sup-to-srt-guide; VLC-not-showing from vlc-subtitle-delay; Chromecast from srt-vtt-ass. (b) Stayfile links from the growth brief: link 1 as a new FAQ on srt-to-csv ("The CSV opens in one column in Excel", check the BOM at src/lib/export.ts line 28 first); link 3 in srt-to-word's `more` text only if it reads naturally. Link 2 (weird-characters guide to stayfile.app/guides/csv-garbled-characters-excel/) only if `curl -s -o /dev/null -w "%{http_code}" https://stayfile.app/guides/csv-garbled-characters-excel/` prints 200; if it doesn't or curl is blocked, write "link 2 waiting" in this row and move on. |
| 7 | Tue 11-24 morning | 11-24-2026 14:17 | (a) Guide `subtitles-out-of-sync-partway`, title "Subtitles fine at first, then out of sync? The fix" (brief item 5). Core: a sudden jump means a different cut, a steady growth means frame rate (link /guides/23976-vs-25-fps-subtitles/, don't repeat it). Walk through /shift-subtitles-from-a-line/ step by step (read its options in src/site.ts first). Links: /sync-subtitles/, /guides/subtitles-out-of-sync/. (b) Guide `kodi-subtitles-out-of-sync`, title "Kodi subtitles out of sync? Fix the file once" (brief item 6). Only the brief's facts; describe menus in words. Links: /shift-subtitle-timing/, /sync-subtitles/, /guides/subtitles-out-of-sync-partway/, /guides/23976-vs-25-fps-subtitles/. |
| 8 | Tue 11-24 evening | 11-25-2026 02:17 | (a) Guide `subtitles-showing-twice`, title "Subtitles showing twice? Two tracks or repeated lines" (brief item 7). Show a before and after from /remove-duplicate-subtitles/ generated by running `fixCommon` with `removeDuplicates: true` in a /tmp script. Links: /remove-duplicate-subtitles/, /srt-validator/, /guides/dual-language-subtitles/. (b) Guide `remove-tags-from-subtitles`, title "Subtitles show {\an8} or font tags? Remove them" (brief item 8, a go: code fact 2). Before and after generated by `fixCommon` with `removeTags: true` in /tmp, on a cue with `{\an8}` and one with `<font color="#ffff00">`. Say that `<i>` is removed too when the option is on. Links: /subtitle-cleaner/, /ass-to-srt/, /guides/srt-vtt-ass/. Set `guide` on subtitle-cleaner if empty. |
| 9 | Wed 11-25 morning | 11-25-2026 14:17 | (a) Guide `mx-player-subtitle-sync`, title "MX Player subtitles out of sync? Fix the file" (brief item 9). Describe menus loosely ("the subtitle menu has a sync setting"). Core: fix the file once so it plays right everywhere. Links: /shift-subtitle-timing/, /sync-subtitles/, /guides/subtitles-out-of-sync/. (b) `example` on subtitle-reading-speed (one fast line before and after) and on srt-to-csv (if the CSV is text), each generated by the real code in /tmp, each with a specific test in test/core.test.ts. Done = `grep -c "example: {" src/site.ts` prints 40. |
| 10 | Wed 11-25 evening | 11-26-2026 02:17 | (a) Guide `burned-in-vs-soft-subtitles`, title "Soft vs burned-in subtitles: which one you have". How to tell (can you turn them off, do they show in the track menu), why burned-in text can't be fixed with a file, picture vs text tracks. Facts only from this repo's guides and code. Links: /sup-to-srt/, /guides/srt-vtt-ass/, /preview-subtitles-with-video/. (b) Guide `remove-sdh-from-subtitles`, title "Remove [music] and speaker names from subtitles". Read the options of /remove-hearing-impaired-subtitles/ in code (`removeBrackets`, `removeSpeakers`, `removeMusic`, src/lib/subs.ts line 330) and show a before and after from `fixCommon` in /tmp. Links: /remove-hearing-impaired-subtitles/, /subtitle-cleaner/, /guides/subtitles-to-transcript/. |
| 11 | Thu 11-26 morning | 11-26-2026 14:17 | (a) QA pass on the guides from rows 5 to 10, the same checks as row 4. (b) `guide` fields, only where empty: srt-to-vtt or srt-to-ttml gets chromecast (first one without a guide), preview-subtitles-with-video gets add-subtitles-to-html5-video, shift-subtitles-from-a-line gets subtitles-out-of-sync-partway, remove-duplicate-subtitles gets subtitles-showing-twice, remove-hearing-impaired-subtitles gets remove-sdh-from-subtitles. Done = `grep -c "guide: '" src/site.ts` at least 28. |
| 12 | Thu 11-26 evening | 11-27-2026 02:17 | (a) /guides/ index (src/pages/guides/index.astro): group the list under h2s "Plex, Jellyfin, Kodi and VLC", "TVs, Chromecast and phones", "Editing and uploading", "Fixing the file". Add an optional `topic` field to the `GUIDES` entries if that is simpler; every guide appears exactly once (add a test). (b) Stayfile link 2 if row 6 left it waiting (same curl check). |
| 13 | Fri 11-27 morning | 11-27-2026 14:17 | (a) Guide `subtitles-overlapping-lines`, title "Subtitle lines overlap or flash? Find and fix them". Built only on code: what the validator's overlap, zero-length and too-short checks mean (read the issue kinds near src/lib/subs.ts line 408), then what /fix-subtitle-timing/ changes (read its options). Before and after generated in /tmp. Links: /srt-validator/, /fix-subtitle-timing/, /guides/subtitles-too-fast/. |
| 14 | Fri 11-27 evening | 11-28-2026 02:17 | (a) Guide `join-cd1-cd2-subtitles`, title "Join CD1 and CD2 subtitles into one file". Read the merge mode in src/components/Tool.astro and the merge-subtitles page in src/site.ts first: how the offset for the second file is set. Before and after from the real code in /tmp. Links: /merge-subtitles/, /shift-subtitle-timing/, /guides/dual-language-subtitles/. |
| 15 | Sat 11-28 morning | 11-28-2026 14:17 | The model test ends 11-27; expect a free model. (a) Guide `srt-numbers-out-of-order`, title "SRT numbers skipped or out of order? Renumber it". Built on /renumber-srt/ (preset `clean: 'renumber'`, src/site.ts line 818) and the validator's out-of-order check. Mention that Premiere and YouTube imports can fail on bad numbering, linking those guides. Links: /renumber-srt/, /srt-validator/, /guides/youtube-subtitle-upload-error/. |
| 16 | Sat 11-28 evening | 11-29-2026 02:17 | Finish anything not DONE above, oldest first. Then the backlog in order. |

## Backlog (in order, for runs that finish early)

Take one item, finish it, commit, then the next. Don't ask the boss for work until all of these are DONE.

1. Pull the next guide row forward (rows are independent). This beats every other item.
2. `example` blocks: srt-to-word (only if its output is text you can show), batch-convert-subtitles (skip if it can't take one). One test each.
3. Pro readiness, behind the flag only: in batch-convert-subtitles, when `?pro=1` is set, offer the saved preset from `subfixer.presets`. Unit-test the part that picks the preset. No pricing, no checkout.
4. A "Related guides" line at the bottom of each guide: two links to guides in the same `topic` (needs row 12). Built in one shared component, not by hand per page.
5. Re-read the five oldest guides (subtitles-out-of-sync, srt-vtt-ass, sup-to-srt-guide, plex-subtitles-out-of-sync, subtitles-weird-characters) for claims not backed by code or by the facts in this plan; fix or remove each, one commit per guide.

## Cut, and why

- New converter pages: CEO order; 70 is enough until they earn. Slug count stays 70.
- DaVinci Resolve guide: sources disagree by version; still no verified facts.
- A separate "subtitles drift" guide: the 23.976 and out-of-sync guides own that phrase (growth brief).
- More examples beyond 40: they don't bring search visitors.
- Hire requests: the CEO's worker budget is 0.
- Free directory listings (VideoHelp, AlternativeTo): need the owner's email; the growth brief leaves them to the CEO, so no decision issue from me.
- Roadmap: no change. 110 visits in 30 days gives no case to move the ads or Pro triggers.

## Guardrails (seen this week)

- Start every run with `gh issue list --label qa --state open`. Fix open `qa` items before the row's guide, one commit each.
- Before any Read of src/site.ts, Grep -n for the line, then Read at most 40 lines with offset and limit. Never Read the whole file (1,600+ lines; a long Read hung for 9 minutes on 11-20).
- Commit after every item, explicit paths only (`git add src/site.ts src/pages/guides/<slug>/index.astro`), never `git add -A` or `.`. Runs die at the cap and lose anything uncommitted.
- Check every claim about SubFixer in code; run the real code in /tmp for every before and after. Never type one by hand. The quality checker reads every deploy.
- No em or en dashes, no "seamless", "effortless", "powerful" or similar, in any copy. Run the dash grep before committing.
- Guide descriptions: 120 to 155 characters. Titles: at most 60.
- Escape `<` as `&lt;` inside code samples in .astro files, and check the built HTML.
- If the API says "overloaded" again and again, keep going with the smallest item in your row; don't restart the row.
- Web search, WebFetch and headless browsers are blocked for daily runs. The facts you need are above and in ops/growth-brief.md. If a fact is missing, leave the claim out.
- `rm` is blocked. Put probes in /tmp, never in the repo.
- Don't edit ops/metrics.csv, ops/costs.json, ops/roadmap.md, src/noindex.mjs or anything in .github/.
- If an Edit to src/site.ts fails twice, run `git checkout -- src/site.ts`, note it in the row and move on.
- A half-written guide must not go into `GUIDES`.
- Metrics: sum the visitors column for 30 days, blanks count as 0. No decision issue unless 300 (ads) or 1,000 (Pro) is reached.
- Ask the boss only when blocked or unclear, at most twice a run, and never for work while the backlog has items.
