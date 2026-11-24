# Growth brief: 11-23-2026

From the head of growth. The boss reads this when planning. Web facts checked 11-23-2026. Check every SubFixer claim in code before writing it. Never name a competitor site in copy. This replaces the 11-20 brief; its guide list is already in the week plan (keep that order).

**Where we stand in search.** `site:subfixer.app` and a search for "subfixer.app" still return nothing from the site (similarly named apps and GitHub projects fill the page). 19 guides and the MKV page are live; none show yet. No change on page one for the VLC and out-of-sync phrases since 11-20: forum threads and editor-company articles still hold them.

## Phrases to target, in priority order

1. **"extract subtitles from mkv", "mkv to srt", "extract srt from mkv online"** → tool page `/extract-subtitles-from-mkv/` (live). Page one (11-23) is two kinds of page: online tools that upload the movie (one well-known converter caps free files at 50 MB; others cap uploads at 300 MB or bill by hour) or that transcribe the audio with AI instead of reading the track, and desktop-editor articles that end in "install MKVToolNix or Subtitle Edit". One big video-editor site promises "free, online, no software" but uploads the file and re-transcribes when no text track exists. Our angle is the only true one: the original track, word for word with its timing, from a file of any size, nothing uploaded. Copy additions (the page entry in src/site.ts around line 1533):
   - Add one FAQ: "Does it transcribe the audio?" → No. It copies the subtitle text already stored in the file, so words and timing match the release exactly. If the file has no text track, nothing is invented.
   - The FAQ already says it reads WebM. Add "WebM" to the description (not the title) so "extract subtitles from webm" can match.
   - Keep "a 4 GB movie is fine" only if a test reads a file larger than the 1 MB slice size across many slices (the reader test with the big video block does this; keep it).
2. **"mkv pgs subtitles to srt", "convert pgs track in mkv to srt"** → the backlog item "save a PGS track as .sup" on the MKV page, then hand it to `/sup-to-srt/`. Move it up to the first item after the extractor passes QA. Every page-one answer for this needs two desktop installs (MKVToolNix, then Subtitle Edit OCR); we would do it in one browser tab. When it ships, replace the MKVToolNix instructions in the FAQs of both pages with the in-browser route.
3. **"what are forced subtitles", "mkv forced subtitles", "sdh vs cc subtitles"** → see "Pages that compete" below: retitle the MKV guide to own this. Facts: a forced track holds only the lines for foreign-language speech or on-screen signs, so it looks "almost empty" when saved; SDH adds speaker names and sounds such as [door slams]; MKV flags tracks as default and forced (our reader reads `isDefault` and `forced` in src/lib/mkv.ts; check the page shows them before saying so). Link /remove-hearing-impaired-subtitles/ for SDH.
4. **"extract subtitles from mp4"**: no tool. Page one is the same mix (editors, transcription, upload sites) plus an ffmpeg article. Don't write a separate guide while we can't read MP4. Add one short section to the MKV guide, "Got an MP4 instead?": MP4 files can carry a text track (mov_text), many downloaded MP4s have none because the subtitles are burned into the picture, and the free command `ffmpeg -i movie.mp4 -map 0:s:0 subs.srt` saves the first text track. MP4 reading is an idea for the CEO, not this week.
5. **Row 4 (TV won't show subtitles from USB):** add the MKV case. A common cause is an MKV whose only subtitle track is PGS, which some TVs don't show; another is an ASS track styled the TV can't draw. Fix: save the text track as SRT next to the video with the same name (link `/extract-subtitles-from-mkv/`), or for PGS go through `/sup-to-srt/`. Phrases: "samsung tv mkv subtitles not showing", "lg tv subtitles usb not working".

Then the week plan's guide rows as written (partway, Kodi, showing twice, tags, MX Player).

## Pages that compete with each other

- `/guides/extract-subtitles-from-mkv-without-software/` ("Extract subtitles from an MKV without installing anything") targets the same phrase as the tool page `/extract-subtitles-from-mkv/`, the same clash we fixed for SUP. Keep the URL. Change the guide's title and h1 to the track-choice problem, for example "Forced, SDH or PGS? Which MKV subtitle track to save", put phrase 3 facts in it, and keep the step-by-step short with a link to the tool. "extract subtitles from mkv" belongs to the tool page.
- The SUP guide retitle is done ("PGS subtitles won't show?"). Good; no change.

## Links to and from Stayfile (stayfile.app)

Live and kept: transcript guide → text-to-pdf and csv-to-excel; weird-characters guide → Stayfile garbled-CSV guide. Stayfile links back from its garbled-CSV guide and its "are converters safe" guide.

Still open from 11-20, add it now: on `/srt-to-csv/`, one FAQ: q "Why does the CSV open in one column in Excel?", a: one or two plain sentences (Excel in some regions expects semicolons), ending with a link to `https://stayfile.app/guides/csv-opens-in-one-column-in-excel/`, anchor "why a CSV opens in one column". Check the URL returns a page first.

Nothing new this time: the MKV page has no natural Stayfile link. No footer lists.

## For the owner, not the workers

AlternativeTo and VideoHelp listings are in review. When VideoHelp approves, the listing text should mention the MKV extractor (VideoHelp readers are exactly the MKVToolNix crowd). The owner can edit the listing; I'll say when.
