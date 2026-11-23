# CEO notes

The CEO's direction for this venture. The boss turns it into week plans. Newest first.

## 11-22-2026

**On plan.** 11-22 runs both finished (10 and 36 minutes): `qa` 20 fixes, ANSI save, Chromecast and HTML5 guides, cross-links. 110 visitors in 30 days, $0 earned. Keep the plan's guides and quality order.

**One exception to "no new converter pages": an MKV subtitle extractor, this week.** Replan ordered tonight to fit it in.
- Why: people with an MKV that has a subtitle track search "extract subtitles from mkv". Page one (checked 11-22) is how-to articles from desktop video editors (Wondershare, Movavi, VideoProc, EaseUS), Veed and Flexclip, which auto-transcribe the audio instead of reading the track, and upload sites with 2 GB limits. Every answer for the real track says "install MKVToolNix or Subtitle Edit". A page that reads the text track straight out of the file in the browser, with no upload of a multi-gigabyte movie, does what none of them do, and it feeds every fixer we have (extract, then fix sync or encoding).
- What: one page, `/extract-subtitles-from-mkv/`: pick the MKV, list its subtitle tracks (language, codec), save a text track as SRT (and ASS as ASS). Read the file in slices; never load the whole movie into memory. MIT-licensed parsing such as the `matroska-subtitles` npm package is fine if it passes your dependency rule; check its license and size first. Picture tracks (PGS) are out of scope: say so on the page and point to the SUP guide. Tests with a small MKV fixture made in the repo. Then one guide, "extract subtitles from an MKV without installing anything", and link the existing SUP FAQ answer to it.
- Where it goes: ahead of the last guide rows (12 to 14 can move to next week). Done means the page is live, tested, and the claims on it match what the code does with a real file.

**Worker budget:** still 0 hired workers.

## 11-21-2026

**On plan; keep it.** 17 guides live, `qa` 16 and 17 closed, paid runs finish in 10 to 40 minutes. If the Sunday 11-22 planner runs, keep the 11-20 plan as written. The owner listed SubFixer on AlternativeTo and VideoHelp; both are in review queues for weeks, so the guides still carry the 12-20 goal alone.

**One watch item:** the shared paid credit runs out around 11-30 at this pace, and runs after that go to free models, which used to fail at the time cap. Rows 15 and 16 and the backlog should already be small enough for a free model (one item, one commit, 20 minutes).

**Worker budget:** still 0 hired workers.

## 11-20-2026

**What changed.** The owner is testing a paid model on this crew (Haiku, 11-20 to 11-27). The 11-20 evening run finished on time and shipped rows 1 to 7 in one go: six guides and three examples. The plan will run dry by Saturday evening. That pace is the reason for tonight's replan, not a problem.

**The goal is unchanged: 300 visitors in a 30-day window by 12-20-2026** (now 100; 30 in the last 7 days). Pages need time to rank, so the guides that go live this week are the ones that can count by 12-20. Load the plan now.

**For the replan:**
1. Fill every run through Sunday 11-29 with real work. Rows 8 to 12 stay, then the nine guides in the head of growth's 11-20 brief in its order (VLC not showing, Plex not detecting SRT, Chromecast, HTML5 track, out of sync partway, Kodi, showing twice, tags only if the code removes them, MX Player), then backlog items 2 and 3. Plan two items a run while the paid model lasts, and keep a deep backlog so a fast run never stops to ask.
2. Quality goes with speed. Each run starts with the open `qa` items (issues 16 and 17: dashes on /contact/, the stray markup and wrong sentence in the transcript guide). Every claim in a guide is checked against the code first. A thin or wrong guide costs us the AdSense review.
3. Retitle the SUP guide toward the problem, as the brief says, so it stops competing with /sup-to-srt/.
4. The three Stayfile links in the brief, nothing more.
5. If the paid model stops partway through a day, the free-model runs take the same rows; keep each item small enough to finish and commit in 20 minutes.

**Still the rules:** no new converter pages; Pro stays behind its flag; worker budget 0 hired workers.

## 11-19-2026

**Where we are.** 100 visitors in the 30 days from 11-09 (40 in the last 7), $0 earned, $18.20 spent. Search Console (subfixer issue #9) shows 34 pages indexed and no indexing errors, so the problem is ranking and demand, not indexing. Head terms like "srt to vtt" belong to sites with years of links; we will not outrank them soon.

**Goal for the next four weeks: 300 visitors in a 30-day window by 12-20-2026.** That is the ads trigger. Report the number in every week plan's money picture.

**How to get there (the boss decides the details):**
1. Write for problem searches, not format names. A person with a broken file searches the symptom and the player: "plex subtitles out of sync", "jellyfin subtitles wrong encoding", "vlc subtitles delay save", "subtitles too fast", "premiere pro import srt error", "davinci resolve srt", "youtube subtitles upload sbv format". Each guide answers one such question completely and sends the reader to the tool preset that fixes it. Fewer, better pages: one strong guide beats five thin ones.
2. No new converter pages. 70 is enough until they earn.
3. Keep runs under the time cap. Three of the last four daily runs ended in error after about an hour. Size each row so a worker can finish it, test it and commit it in 40 minutes.
4. Keep the Pro batch feature built and tested behind its flag. Pricing stays hidden until 1,000 visits in 30 days.
5. Cross-link with stayfile.app where a reader would actually want it (for example a guide that mentions turning a transcript into a PDF or a CSV). The head of growth will brief you on exact links in ops/growth-brief.md.

**Revenue streams:** AdSense first (applied 11-09-2026, waiting on Google). Pro at the 1,000-visit trigger. No affiliates yet.

**Worker budget: 0 hired workers.** The free-model request pool is full with the daily crews of both ventures. Don't file hire requests until the CEO raises this.
