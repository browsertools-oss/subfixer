# Week plan: 11-15-2026 (Sun) to 11-22-2026 (Sun)

Written by the weekly planner on 11-15-2026. Daily runs: find your row in the table below by the Pacific date and run (`TZ=America/Los_Angeles date +%m-%d-%Y`, morning or evening). The UTC column is for reference. When you finish an item, add `DONE <hash>` at the end of that row's cell. Don't otherwise rewrite this file.

## At a glance

<!-- Summary for the owner's dashboard. Agents: follow the Day-by-day table below and mark DONE there, not here. -->

Goal: Give Google pages worth indexing: six real guides and tested before-and-after examples on 15 popular tools, with no new converter pages.

Targets:
- Six new guides, each at least 700 words
- 15 tool pages show a tested before-and-after example
- No new converter pages (stays at 70)
- At least one page in Google and 120 visitors in 30 days (needs your Search Console step)

| Run | In plain words |
|---|---|
| 1 | Add before-and-after examples to the SRT and VTT pages, and fix the YouTube wording on the SBV pages |
| 2 | Guide 1: turning Blu-ray subtitles (SUP) into SRT |
| 3 | Examples on three more pages, plus a page that lists every guide |
| 4 | Guide 2: fixing Plex subtitles that are out of sync |
| 5 | Examples on the four timing tools |
| 6 | Guide 3: subtitles that show odd symbols instead of letters |
| 7 | Examples on four cleanup and import pages |
| 8 | Guide 4: why subtitles drift between 23.976 and 25 fps |
| 9 | Examples on four more pages |
| 10 | Guide 5: saving a VLC subtitle delay into the file |
| 11 | Examples on three pages, and link the new guides from the older ones |
| 12 | Guide 6: showing two subtitle languages at once |
| 13 | Check every guide and example: word counts, links, phone layout |
| 14 | Finish anything left over, then work down the backlog |

## Money picture

**Spent so far (cash, from ops/costs.json):**
- SubFixer: $18.20 ($8.20 subfixer.app domain + $10.00 OpenRouter credit that both ventures share).
- Stayfile: $8.20 (stayfile.app domain).
- Both ventures: **$26.40 spent, $0.00 earned.**
- OpenRouter credit used so far: about $0.38 of the $10 (SubFixer $0.17, Stayfile $0.22). Daily runs now use free models, so the credit is barely moving.

**Monthly costs from now on:**
- subfixer.app renews at $14.20 a year, so **$1.18 a month**. I assume stayfile.app renews at about the same price: $1.18 a month.
- API: $0 to $0.50 a month while runs stay on free models.
- Hosting (Cloudflare Pages) and CI (public repo) cost nothing.
- **SubFixer: about $1.70 a month. Both ventures: about $2.90 a month.**

**Where revenue comes from, in order:**
1. **AdSense.** We applied on 11-09-2026 and are waiting on Google's review. The roadmap's trigger for showing ads is about 300 visits a month and most tool pages indexed. Google won't approve a site it sees as thin: 53 of our 70 tool pages are converter pages built from one template, with about 150 to 250 words that differ from page to page. Note: AdSense pays out only once the balance reaches $100, so the first *cash* from ads will be slow even after approval.
2. **SubFixer Pro** (batch fixing and saved presets, about $4 a month or $24 a year, sold through Lemon Squeezy). The trigger is 1,000 visits in 30 days. After Lemon Squeezy's fee (5% + $0.50) one sale nets about $3.30 a month, or $22.30 for a yearly plan. **One subscriber covers SubFixer's running costs, which makes Pro the fastest path to cash** once the trigger is hit.

**Break-even, with the assumptions stated:**
- **Ads:** I assume a conservative page RPM of $1.50 and 1.3 pages per visit, which works out to about $2.00 per 1,000 visits.
  - SubFixer alone ($1.70 a month): about **850 visits a month**.
  - Both ventures ($2.90 a month): about **1,450 visits a month** combined.
  - Also earning back the $26.40 already spent within 12 months: about **2,550 visits a month** combined.
- **Pro:** I assume 0.2% of monthly visitors subscribe. **One subscriber** covers either venture's monthly costs. That needs about 500 visitors a month, so the 1,000-visit trigger is a reasonable gate.

**Where we are:** 80 visits in the last 30 days (ops/metrics.csv: 40, 20, 0, 10, 10, 0, blank). That is 27% of the ads trigger and 8% of the Pro trigger. A web search for `site:subfixer.app` and `site:stayfile.app` on 11-15-2026 returned **no pages** for either site. Both domains have a google-site-verification TXT record, so Search Console is verified by DNS, but nothing is ranking yet. Until pages are indexed, adding more pages adds nothing.

**This week's targets (checked next Sunday):**
1. **Six new guides** live under /guides/, each with at least 700 words of its own text, listed in `GUIDES` and in the sitemap. Agents check this with `npm run build`, then `node scripts/wordcount.cjs` and `grep -c guides dist/sitemap-0.xml`.
2. **At least 15 high-demand tool pages** get a real before-and-after example block (the new `example` field), and a test proves each example's "after" is what the tool actually outputs. Check: `grep -c "example: {" src/site.ts` is at least 15, and `npm test` passes.
3. **No new converter (X-to-Y) pages.** Check: `grep -cE "^\s+slug: '" src/site.ts` stays at 70.
4. **Outside the agents' control, checked by the planner next Sunday:** at least 1 page shows for `site:subfixer.app` (it depends on the owner's Search Console step in the decision issue), and 30-day visitors are at least 120.

## Last week

- **Shipped:** 187 commits in 8 days. Tool pages went from about 25 to 70, and 45 of the 70 are converter pages. Also: 2 guides, a 404 page (live and returning status 404), fixes to the about and privacy pages, a series of fixes for copy that claimed things the code doesn't do (good work), and a footer fold for phones.
- **Runs:** 14 scheduled runs, about 36 to 40 minutes each. Two were marked failed (11-12-2026 14:17 and 11-15-2026 14:17 UTC), but the commit step still saved their work. The 11-13-2026 02:17 run spent its whole budget reading files and shipped nothing.
- **Slipped:** the SBV YouTube Studio check, the render check of the phone fold and checking whether pages are indexed. All three needed web or browser access the agents don't have. I've done the SBV research below. Drop the render check; it can't be done from this environment.
- **What the data says:** traffic is flat at about 10 visits a day with no search presence. A long tail of template converter pages (stl-to-txt, smi-to-txt and the like) doesn't bring visitors to an unindexed site, and it raises the risk of a "low value content" verdict in AdSense review. This week's effort goes into fewer, deeper pages.

## Research done for you (use these facts; don't invent others)

Competitors for the main phrases: subtitletools.com (its free plan allows only 2 SUP OCR conversions a day), kapwing, matesub, and many new *.pages.dev subtitle clones (subtitletoolkit, subtitle-toolset, softsubs). Generic phrases like "srt to vtt" and "sync subtitles" are crowded. The gaps:
- **free, unlimited SUP OCR in the browser** (our real edge),
- **player-specific problems** (Plex, VLC) that forum threads ask about constantly and tool sites don't answer,
- **plain answers to "why"** (frame rates, encodings).
Don't name competitors in copy.

- **SUP / PGS:** Blu-ray subtitles stored as pictures, one image per line, so OCR is needed. To get a .sup out of an MKV: run `mkvmerge -i movie.mkv` to list the track IDs, then `mkvextract tracks movie.mkv 3:subs.sup` (3 is the track ID). Both tools come with MKVToolNix, which is free. SubFixer does **not** read DVD .sub/.idx (VobSub); say so plainly, and mention that the free desktop app Subtitle Edit can OCR those. Check `src/lib/ocr.ts` and `OCR_LANGS` for the OCR library name and the 24 languages before you write about them.
- **Plex** (support.plex.tv "Subtitle offsets"):
  - The offset setting works only for external, text-based subtitles such as .srt. It doesn't work for subtitles embedded in the video or for picture-based subtitles.
  - The support article lists Fire TV, Android (mobile) and Android TV. Users report it in Plex Web too, and report that older Roku apps lacked it.
  - Users complain that the offset moves in small 50 ms steps.
  - The offset lives in the app. The file stays wrong for other devices and other users.
  - Sidecar naming: `Movie Name (Year).en.srt` next to the video file, then "Refresh Metadata" on that item.
- **VLC:**
  - The G and H keys change the subtitle delay in 50 ms steps on Windows and Linux. On a Mac the keys are H and J. Which key goes which way differs between versions and sources, so tell the reader to press one and watch the on-screen "Subtitle delay" message.
  - For an exact value: Tools > Track Synchronization (Windows/Linux) or Window > Track Synchronization (Mac).
  - VLC doesn't save the delay into the file. A positive delay shows the subtitles later, so if VLC needed +2.5 s, the subtitles were 2.5 s too early: pick "Too early", 2.5 seconds, on /shift-subtitle-timing/.
- **Frame rates:**
  - 25 / 23.976 = 1.0427, a 4.3% difference.
  - A subtitle timed for a 25 fps (PAL) copy runs early on a 23.976 fps copy, by about 2.46 s more every minute: roughly 4 minutes off by the end of a 100-minute film.
  - 24 vs 23.976 is a 0.1% difference: about 3.6 s per hour.
  - To find a video's frame rate: MediaInfo (free) shows it, or VLC Tools > Codec Information.
  - Releases labeled PAL or European DVD are usually 25 fps; BluRay and WEB-DL releases are usually 23.976.
- **Encoding:**
  - "Ã©" is é saved as UTF-8 but read as Windows-1252.
  - Central European text is usually Windows-1250, Cyrillic Windows-1251, Korean EUC-KR.
  - Boxes in VLC can also mean the font has no such letters (VLC Preferences > Subtitles/OSD has the font and default encoding settings).
  - Plex, Emby and Jellyfin read UTF-8 most reliably.
  - Read `repairDoubleUtf8` and `REPAIR_UTF8` in src/lib/subs.ts before describing the "repaired" option.
- **YouTube SBV:**
  - YouTube Studio > Subtitles > pick the video. On the language row, open the options menu (three dots) and choose Download. YouTube offers .sbv, .srt and .vtt.
  - Only works for videos on a channel you can sign into.
  - This is consistent across several third-party guides but isn't official, so keep "options menu (three dots)" and avoid stating more exact labels.

## Day-by-day

Each guide copies the structure of `src/pages/guides/subtitles-out-of-sync/index.astro`:
- `Base` with `ogType="article"` and an `Article` jsonld,
- an h1 and a lede, then h2 sections,
- links to 3 or more tool pages and a "See also" to another guide.

Then add `{ slug, title }` to `GUIDES` in src/site.ts. Title at most 60 characters, description at most 160. At least 700 words of body text (check with `node scripts/wordcount.cjs` after the build). Follow the copy-style rules in the daily prompt. Every claim about what SubFixer does must be checked in the code first.

**Example block spec (row 1 builds it; later rows fill it in):**
- In `ToolPage`, add `example?: { before: string; after: string; note: string }` and `guide?: string` (a guide slug).
- In `src/components/ToolPage.astro`, after "How it works", render a section: h2 "What changes in your file", `<p>{note}</p>`, then two labelled `<pre class="sample">` blocks, "Before" and "After". Add CSS: monospace, `overflow-x:auto`, small type, same block style. If `guide` is set, render a "Read the guide: <title>" link under the FAQ. Record this in ops/design.md.
- Examples are 2 or 3 cues long.
- Test in test/core.test.ts: import `PAGES` from `../src/site.ts`. For every page with `example` and mode `convert`, assert `build(parse(p.example.before).captions, p.preset.out).trim() === p.example.after.trim()`. Pass `{ name: 'x.<ext>' }` to parse if detection needs it. For non-convert pages, add one specific test per page using `retime`/`shiftFn`/`fpsFn`/`fixCommon` + `build`.
- Never type the "after" by hand. Generate it by running the code, then paste it in.

| # | Run (PT) | Start (UTC) | Items |
|---|---|---|---|
| 1 | Sun 11-15 evening | 11-16-2026 02:17 | (a) Build the example block + `guide` field + generic convert test (spec above). Fill `example` for **srt-to-vtt** and **vtt-to-srt**. Done = tests pass, the built srt-to-vtt page shows Before/After. (b) Fix the SBV download wording on sbv-to-srt, sbv-to-vtt, sbv-to-txt and srt-to-sbv with the YouTube facts above. |
| 2 | Mon 11-16 morning | 11-16-2026 14:17 | Guide 1: slug `sup-to-srt-guide`, title "How to convert Blu-ray SUP subtitles to SRT for free". Phrases: "sup to srt", "pgs to srt", "convert sup to srt". Sections: what SUP/PGS is; why it needs OCR; step by step on /sup-to-srt/; fixing OCR mistakes (Check and edit, plus Find and replace for a repeated error such as l read as I); getting the .sup out of an MKV (mkvextract); DVD .sub/.idx isn't supported; then converting on to VTT/ASS (/sup-to-vtt/, /sup-to-ass/). Set `guide: 'sup-to-srt-guide'` on the sup-to-srt page. |
| 3 | Mon 11-16 evening | 11-17-2026 02:17 | (a) `example` for **ass-to-srt**, **sbv-to-srt**, **txt-to-srt**. (b) New `src/pages/guides/index.astro`: h1 "Subtitle guides", one line per guide with a one-sentence summary, path /guides/. Link it from the footer guides heading and the home Guides section. Done = /guides/ is in the sitemap. |
| 4 | Tue 11-17 morning | 11-17-2026 14:17 | Guide 2: slug `plex-subtitles-out-of-sync`, title "Plex subtitles out of sync: fix the file for good". Phrase: "plex subtitles out of sync". Use the Plex facts above. Sections: why Plex's offset isn't enough; tell the three kinds of sync error apart (link the out-of-sync guide); fix the .srt (/shift-subtitle-timing/, /convert-25-fps-to-23976/, /shift-subtitles-from-a-line/); name and place the fixed file, then Refresh Metadata; embedded subtitles (extract first; picture ones need the SUP guide). Set `guide` on shift-subtitle-timing. |
| 5 | Tue 11-17 evening | 11-18-2026 02:17 | `example` for **shift-subtitle-timing** (2.5 s later), **convert-25-fps-to-23976** (show times at 00:10:00 and 01:30:00 moving), **sync-subtitles**, **fix-subtitle-timing**. Each gets a specific test. |
| 6 | Wed 11-18 morning | 11-18-2026 14:17 | Guide 3: slug `subtitles-weird-characters`, title "Subtitles show Ã© or boxes instead of letters: the fix". Phrases: "subtitles weird characters", "srt encoding fix", "subtitles showing symbols". Use the encoding facts. Include a small table of symptom → likely encoding. Link /fix-subtitle-encoding/. Set `guide` on fix-subtitle-encoding and add an `example` there (a Windows-1252 é shown wrong and then right; test via `decode` or `repairDoubleUtf8`). |
| 7 | Wed 11-18 evening | 11-19-2026 02:17 | `example` for **remove-hearing-impaired-subtitles** (a line with [DOOR SLAMS] and JOHN:), **subtitle-cleaner**, **xml-to-srt**, **dfxp-to-srt**. |
| 8 | Thu 11-19 morning | 11-19-2026 14:17 | Guide 4: slug `23976-vs-25-fps-subtitles`, title "23.976 vs 25 fps: why subtitles drift, and the fix". Phrases: "subtitles drift out of sync", "25 fps to 23.976 subtitles". Use the frame-rate facts, including the worked numbers (2.46 s per minute, about 4 min at 100 min). How to find the fps (MediaInfo, VLC). MicroDVD .sub stores frames, so link /microdvd-sub-to-srt/. Set `guide` on convert-25-fps-to-23976 and change-subtitle-frame-rate. |
| 9 | Thu 11-19 evening | 11-20-2026 02:17 | `example` for **srt-to-txt**, **ttml-to-srt**, **smi-to-srt**, **merge-subtitles** (stack mode; verify the output in code first). |
| 10 | Fri 11-20 morning | 11-20-2026 14:17 | Guide 5: slug `vlc-subtitle-delay`, title "VLC subtitle delay: save the fix into the file". Phrases: "vlc subtitle delay", "vlc subtitles out of sync". Use the VLC facts: keys, Track Synchronization, the sign of the delay → Too early/Too late, drift means frame rate (link guide 4). Set `guide` on shift-subtitle-timing only if guide 2 isn't already set there; otherwise on sync-subtitles. |
| 11 | Fri 11-20 evening | 11-21-2026 02:17 | `example` for **srt-to-ass**, **ass-to-vtt**, **srt-to-sbv**. Then add a link to each new guide from the matching paragraph of the older guides (srt-vtt-ass, subtitles-out-of-sync). |
| 12 | Sat 11-21 morning | 11-21-2026 14:17 | Guide 6: slug `dual-language-subtitles`, title "How to show two subtitle languages at once". Phrases: "dual subtitles", "merge two srt files", "two languages subtitles at the same time". Read the merge `stack` and `parts` code first: what goes on top, which players honor {\an8} (VLC, mpv; others stack both at the bottom), joining CD1 and CD2. Language learners are the audience. Link /merge-subtitles/ and set `guide` there. |
| 13 | Sat 11-21 evening | 11-22-2026 02:17 | QA sweep across all guides and example blocks: banned-word and dash scan, one h1 per page, every internal href resolves, sitemap count, `node scripts/wordcount.cjs` (each guide 700+). Fix what fails. Read every guide at 360px width in the built HTML for long `<pre>` or table overflow. |
| 14 | Sun 11-22 morning | 11-22-2026 14:17 | Finish anything marked not done above. If all done, take from the backlog in order. Morning metrics check as usual. |

## Backlog (in order, for runs that finish early)

1. More `example` blocks, in this order: ssa-to-ass, microdvd-sub-to-srt, lrc-to-srt, stl-to-srt, renumber-srt, remove-duplicate-subtitles, find-and-replace-subtitles.
2. Two FAQs each, verified in code, on the top pages: sup-to-srt, shift-subtitle-timing, srt-to-vtt.
3. scripts/report.mjs prints "Visitors yesterday: undefined" when yesterday's visitors cell is blank. Print "not counted yet" instead. It's a script, not a workflow, so you may edit it, but don't touch .github/.
4. Saved presets, behind a flag (the first Pro feature): store the last mode and its settings in localStorage under `subfixer.presets`, read them only when `?pro=1` is in the URL, and show no pricing. Unit-test the serialize/parse functions. Only start this after targets 1 and 2 are met.

## Cut this week, and why

- **New converter (X-to-Y) pages:** there are 45 already, and nothing is indexed. More template pages raise AdSense's thin-content risk and earn nothing until indexing starts.
- **Render or emulator checks of the footer fold:** headless Chromium can't run here. Three runs tried and none could finish.
- **Re-checking SBV menus:** done by the planner above.
- **Paid-tier checkout or pricing:** the trigger is at 8%. Only backlog item 4 is allowed, and only late.
- **Owner questions about the 404 page and scratch files:** closed. /nonexistent/ returns the custom 404 with status 404. Leave scripts/wordcount.cjs (it's useful) and test/scratch-ssa.ts in place, and don't spend time on them.

## Guardrails (seen this week)

- **Match rows by UTC.** Evening runs start at 02:17 UTC on the next UTC date (the 11-16-2026 02:17 run is "Sun 11-15 evening").
- **Web search, WebFetch and headless browsers are blocked** for daily runs. Don't try them, and don't log "blocked again". The facts you need are in this file.
- **`rm` is blocked.** Don't try to delete files. Put probes in /tmp, never in the repo.
- **Stage with explicit paths only** (`git add src/site.ts test/core.test.ts`), never `git add -A` or `.`.
- **Don't edit** ops/metrics.csv, ops/costs.json, ops/roadmap.md or anything in .github/.
- **Don't spend a run only reading.** On 11-13-2026 a run read files for its whole budget. Read only the files your row names, start editing within 10 minutes, and commit after each item.
- **site.ts is 1,400+ lines.** Edit with a unique `old_string` (the slug line plus the next line). If an Edit fails twice, run `git checkout -- src/site.ts`, note it and move on.
- **Never claim a feature without checking the code.** Last week many copy fixes undid invented claims (folders, batch limits, offline use, every-player support). The same rule applies to the guides.
- **A half-written guide must not go into `GUIDES`.** Commit a guide only when it builds and meets 700 words.
- **Metrics:** sum the visitors column for 30 days and count blanks as 0. No decision issue unless 300 (ads) or 1,000 (Pro) is reached.
