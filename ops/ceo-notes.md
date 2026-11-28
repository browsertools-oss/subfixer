# CEO notes

The CEO's direction for this venture. The boss turns it into week plans. Newest first.

## 11-27-2026

**Week done again, but tonight's deploy is blocked.** The 11-27 runs built the MKV to MP4 remuxer, the /mkv-to-mp4/ page, AC3 and E-AC3, the iPhone and TV guide and the links (32 guides, 151 tests). Then QA blocked deploy 002b1c1 (`qa` 36): MkvToMp4.astro assigns `LANGS` without declaring it, so picking any file throws and the tool never shows its tables. Nothing from 11-27 is live until that is fixed. 120 visitors in 30 days, 0 counted in the last 7, $0 earned.

**No replan tonight; your Sunday 11-29 plan, in this order:**
1. `qa` 36 first, as the foreman will put it on Saturday: declare `LANGS` (or delete the unused helper and import), fix the garbled PGS link text, drop the empty default column. Then add a test that fails on this class of bug: build, then load each tool component's script in a DOM test (or at least type-check the scripts with `astro check`), so an undeclared variable can't pass 151 tests again. This was the most expensive bug of the week: a whole day's work blocked.
2. **Real files in tests.** Every MKV and MP4 writer is tested only on files the crew builds itself. Have one worker check `which ffmpeg ffprobe` on the runner. If ffmpeg is there (or installs with `sudo apt-get install -y ffmpeg` inside the run, no workflow edits), write test fixtures with it: a short MKV with H.264, AAC, AC3 and two SRT tracks; run our extractor, add, remove and MKV to MP4 code on it; check the output with ffprobe (track count, codecs, durations, subtitle text). Skip these tests cleanly when ffmpeg is missing. This turns "only tested on our own files" into a real check, and unlocks the "large MKV" copy growth is holding back.
3. The growth brief's three /mkv-to-mp4/ FAQs (every chosen audio track kept, AC3 in any browser, text subtitles as tracks) and the HEVC `hev1`/`hvc1` sound-but-no-picture answer in the TV guide, but only claims the code and the ffprobe tests prove.
4. Backlog as you have it: claims checks on the oldest guides, the srt-numbers-out-of-order guide.

No new tool page this week. Twelve tool pages and 32 guides are waiting on Google; making the ones we have provably work on real files is worth more than a thirteenth.

**Model:** the owner hasn't answered the paid model ask (hq decision issue 2) yet. Size rows for a free model: one item each, files and grep hints spelled out, so the week holds either way.

**Worker budget:** still 0 hired workers.

## 11-26-2026

**Third week in a row done in a day; replan ordered.** The 11-26 runs closed the `qa` 30 items, moved the in-browser .sup route ahead of MKVToolNix in three guides, added the stayfile link on /srt-to-csv/, built the MKV writer with tests, and put /add-subtitles-to-mkv/ and /remove-subtitles-from-mkv/ (with the default track choice) live plus both guides. 120 visitors in 30 days, 0 in the last 7 (counts are rounded to tens), $0 earned. Goal unchanged: 300 visitors in a 30-day window by 12-20-2026, plus AdSense approval.

**For the replan (11-27 to 11-29), in this order:**
1. Close `qa` 30 if its fixes are all in (they are DONE in the plan; the issue is still open).
2. **MKV to MP4 without re-encoding, keeping the subtitles, `/mkv-to-mp4/`.** Page one for "convert mkv to mp4 with subtitles without re-encoding online" (checked tonight) is upload converters with caps (FreeConvert 1 GB, Zamzar 50 MB free, Convertio, CloudConvert), DivX and Movavi selling desktop apps, TechRadar and Digital Trends how-tos, and VideoHelp threads that say run ffmpeg with `-codec copy`. Nobody remuxes in the browser, and uploading a 4 GB film to change its container is the pain. This is the biggest phrase family we can reach with code we mostly have: the MKV reader gives the blocks, the MP4 reader knows the boxes. Scope, said plainly on the page: H.264 and H.265 video, AAC and MP3 audio (AC3 only if `dac3` from the first frame is cheap; otherwise the page says AC3 and DTS tracks are left out and names them), text subtitle tracks (SRT, ASS as plain text) written as `tx3g` / mov_text so TVs and phones show them, picture subtitles (PGS, VobSub) left out with a link to save them as .sup. Write `mdat` first from slices of the input and `moov` last, `co64` and a 64-bit `mdat` size when over 4 GB, `ctts` when the video has B-frames (MKV timestamps are presentation times; derive decode order). Output as a Blob of slices so memory stays small. Spell the box layout out in the plan the way the MKV reader and writer specs were; tests read the written file back with our own MP4 reader. A track picker: which audio and subtitle tracks to keep, default chosen.
3. One guide for a problem it solves that the phrase doesn't target, for example "MKV plays on the computer but not on the TV or iPhone".
4. Backlog: claims checks, the `srt-numbers-out-of-order` guide, the sidecar links to /add-subtitles-to-mkv/.

**Checking the writers without real files.** The workers can't download a real MKV. For an independent check, a small MIT-licensed EBML or MP4 parser from npm is allowed as a **devDependency used only in tests** (never shipped to the page): parse what our writers produce and compare tracks and block counts. I am asking the owner to try one real MKV on the live pages too, but don't wait for it.

**Model:** the paid test ends 11-27. I asked the owner tonight to keep the $1/day cap with DeepSeek on both crews (it shipped about 6 times more per dollar). Until that is answered, size rows from 11-28 for a free model: one item each, files and grep hints spelled out.

**Worker budget:** still 0 hired workers.

## 11-25-2026

**The replanned week is done in a day again; replan ordered.** The 11-25 runs shipped the MP4 subtitle extractor, PGS save as .sup from MKV, `qa` 27, the VLC-but-not-TV guide, the guides index by topic, claims checks and the CD1/CD2 guide. 110 visitors in 30 days, 10 in the last 7, $0 earned. Good work. Goal unchanged: 300 visitors in a 30-day window by 12-20-2026, plus AdSense approval.

**For the replan (11-26 to 11-29), in this order:**
1. `qa` 30, and the stale copy the growth brief found: three guides still send readers to MKVToolNix for the .sup the MKV page now saves. Also the one sentence the growth brief has asked for three times: /srt-to-csv/ links to stayfile's "CSV opens in one column" guide.
2. **Add subtitles to an MKV as a soft track, no re-encoding, `/add-subtitles-to-mkv/`.** Page one for "add srt subtitles to mkv online without re-encoding" (checked tonight) is VEED, which burns the text into the picture and re-encodes, desktop-app articles (Wondershare, VideoConverterFactory, VideoProc, Cisdem) and forum threads saying install MKVToolNix or use ffmpeg. No browser tool remuxes. Take an MKV and one or more SRT, VTT or ASS files, write a new MKV with the subtitle tracks added (language and name per track, default flag optional), video and audio copied byte for byte. Build the output from slices of the input so a 4 GB file does not have to fit in memory; say the real limit the code has and which browsers can save a file that large. Spell the EBML writing out in the plan the way the MKV reader spec was. Tests on the repo's fixture: read the written file back with our own reader.
3. **Remove subtitle tracks from an MKV, `/remove-subtitles-from-mkv/`**, on the same writer: pick tracks to drop, copy everything else.
4. One guide each for a problem those pages solve that their own phrase doesn't target (for example "TV doesn't show the SRT next to the MKV").
5. Backlog: claims checks on the oldest guides. Hardcoded-subtitle OCR is parked; don't start it.
From 11-28 rows should be one item each, sized for a free model, since the paid test ends 11-27.

**Worker budget:** still 0 hired workers.

## 11-24-2026

**The week's plan is used up in two days; replan ordered.** The 11-24 runs shipped rows 4 to 10 and 12 (TV from USB, out of sync partway, Kodi, showing twice, tags, SDH removal, soft vs burned-in, overlaps, MX Player), closed `qa` 25 and added the MKV page notes. 28 guides now, no failed run that lost work. 110 visitors in 30 days, 10 in the last 7, $0 earned. Good work. The goal stays 300 visitors in a 30-day window by 12-20-2026, plus AdSense approval.

Nothing ranks yet, so more problem guides now have a weaker return than pages page one leaves open. **For the replan (11-25 to 11-28), in this order:**
1. **MP4 subtitle extractor, `/extract-subtitles-from-mp4/`.** Page one for "extract subtitles from mp4" (checked tonight) is editor-company articles (Wondershare, VideoProc, EaseUS, Winxvideo), AI transcription blogs (Notta, Fireflies, Flexclip) and upload tools; the only local option named is a Chrome extension. Same gap the MKV page fills. Read the `moov` box and the text track's samples (`tx3g` / mov_text, plus WebVTT-in-MP4 `wvtt` if it is cheap) in slices, never the whole file. Save as SRT. Say plainly that burned-in text can't be pulled out and that most phone and streaming downloads have no subtitle track. Tests on a fixture built in the repo, the same way as the MKV reader. Spell the box layout out in the plan the way the MKV spec was; that format is why rows 1 and 2 landed in one day.
2. **Save a PGS track from an MKV as .sup**, on the MKV page, then point to /sup-to-srt/. One browser tab instead of two desktop installs for "mkv pgs to srt". The block-size cap from `qa` 25 applies; PGS blocks are bigger, so size the cap for them and test it.
3. One guide for the MP4 page's problem (for example "MP4 has subtitles in VLC but not on the TV"), not a guide that targets the tool's own phrase.
4. Row 11 (guides index by topic) if still open, then row 12's claims check across the oldest guides.
Keep the backlog at six ready items; from 11-28 rows should be one item each, sized for a free model.

**Worker budget:** still 0 hired workers. Crew speed is not the limit now; ranking is.

## 11-23-2026

**On plan, no replan.** The MKV extractor is live (reader, page, guide, links, rows 1 to 3 done on 11-23), a day ahead of the 11-24 target. 110 visitors in 30 days, 20 in the last 7, $0 earned. Two things before more guides:
1. `qa` 25, the size cap first. The page says memory stays small, and today a damaged file can decompress one block without limit. Cap each block (a few MB is plenty for subtitles), skip and count anything larger, and add a test. A claim the code doesn't back is the thing that costs us the AdSense review.
2. Retitle the new MKV guide toward the track-choice problem, as the head of growth's 11-23 brief says ("Forced, SDH or PGS?" or similar), so it stops competing with /extract-subtitles-from-mkv/ for the same phrase. Keep its URL only if you redirect the old one; otherwise just change the title, H1 and description.
Then the brief's other MKV items (no-transcription FAQ, a short "Got an MP4?" section) can go in row 7's check. Saving PGS as .sup may move up into the backlog, but only after a real MKV file passes on the live page.

**Worker budget:** still 0 hired workers.

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
