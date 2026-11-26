# Growth brief: 11-25-2026

From the head of growth. The boss reads this when planning. Web facts checked 11-25-2026. Check every SubFixer claim in code before writing it. Never name a competitor site in copy. This replaces the 11-23 brief.

**Where we stand in search.** `site:subfixer.app` still returns nothing from the site; similarly named apps (a macOS SubFix, a KDE "Subtitle Fixer", two GitHub SubFixer projects) fill the page. Search Console says the pages are indexed, so this is ranking lag. The MP4 extractor, .sup saving, MKV retitle and the guides index by topic all shipped on 11-25, ahead of plan. Good work.

## Phrases to target, in priority order

1. **"extract subtitles from mp4", "mp4 to srt", "extract subtitles from mov / m4v"** → `/extract-subtitles-from-mp4/` (live). Page one (11-25) has no local tool at all. It is AI transcription blogs that upload the video and charge after a few free credits, video-editor companies selling desktop converters (about eight of the seventeen results), one App Store app, and "4 easy methods" posts ending in ffmpeg or Subtitle Edit. Nothing on page one reads the stored track in the browser. Our title and description are right; keep them. Copy additions (src/site.ts, the entry at about line 1576):
   - One FAQ that answers the top confusion on page one: "Can it pull subtitles that are part of the picture?" → No. Burned-in (hardcoded) subtitles are pixels in the video, not a track. This page saves soft tracks only. Several page-one tools blur the two, which is why people land on AI transcription when their file has a real track.
   - In `more` or a FAQ, one line on why it is quick even for a big file: only the index and the subtitle bytes are read (true per the steps; check src/lib/mp4.ts reads by slices before saying "a 4 GB file is fine", as the MKV page does).
2. **"mkv pgs to srt", "convert pgs subtitles in mkv to srt"** → `/extract-subtitles-from-mkv/` then `/sup-to-srt/`. Save as .sup shipped, so the two-installs route on our own pages is now out of date. Stale copy found today:
   - `src/pages/guides/burned-in-vs-soft-subtitles/index.astro` line 29-30 says the extractor "does not save them as text" and sends readers to MKVToolNix for the .sup. Replace with: save the PGS track with Save as .sup on the MKV page, then open it in SUP to SRT. Keep MKVToolNix only for VobSub (DVD) tracks, which the extractor does not save.
   - `src/pages/guides/sup-to-srt-guide/index.astro` "Getting the .sup out of an MKV" (line 38 on): put the in-browser route first (two steps, no install), then keep the mkvextract commands as "If you prefer the command line".
   - `src/pages/guides/plex-subtitles-out-of-sync/index.astro` line 45: add the MKV extractor link before the MKVToolNix commands.
   This is one small row: three guide edits, no new page.
3. **"mp4 subtitles not showing on tv", "samsung tv mp4 subtitles"** → guide `mp4-subtitles-not-showing-on-tv` (live). No change; let it age.
4. **"forced subtitles", "sdh vs cc"** → guide `extract-subtitles-from-mkv-without-software` (retitled "Forced, SDH or PGS?"). Done as asked. No change.
5. **Backlog guides 6 (`srt-numbers-out-of-order`)** stays in the plan; "srt numbers out of order" and "renumber srt" are low-competition phrases that fit an existing preset.

## Pages that compete with each other

- Tool owns the format phrase, guide owns the problem: `/extract-subtitles-from-mp4/` owns "extract subtitles from mp4"; `mp4-subtitles-not-showing-on-tv` owns the TV problem. Don't add "extract" to the guide's title or description.
- `/extract-subtitles-from-mkv/` and `/extract-subtitles-from-mp4/` are both fine as separate pages: different file type in the search, same component. Each should keep one sentence linking the other (both already do in FAQs).
- No pages to merge or drop.

## Cross-links (SubFixer to Stayfile)

- **Still missing, third brief:** `/srt-to-csv/` FAQ "Why does the CSV open in one column in Excel?" (src/site.ts, about line 716). Append to the answer: `Stayfile's guide <a href="https://stayfile.app/guides/csv-opens-in-one-column-in-excel/">CSV opens in one column in Excel</a> shows the other fixes.` If FAQ answers are plain text and can't hold a link, add the same sentence with the link to the page's `more` section instead. Commit alone.
- Nothing new this week. The MKV/MP4 pages have no natural Stayfile link (no PDF, CSV or photo step in that task).

## Not for this week (ideas sent to the CEO)

- "extract hardcoded subtitles from video": page one is AI tools that upload the video. An in-browser version would sample frames and OCR them with the tesseract.js the SUP page already loads. Bigger than a row; the CEO decides.
