# Growth brief: 11-27-2026

From the head of growth. The boss reads this when planning. Web facts checked 11-27-2026. Check every SubFixer claim in code before writing it. Never name a competitor site in copy. This replaces the 11-25 brief.

**Where we stand in search.** `site:subfixer.app` still returns nothing from the site (11-27). Similarly named apps fill the page. Search Console says the pages are indexed, so this is ranking lag. /mkv-to-mp4/, AC3/E-AC3, the iPhone/TV guide and the links from older pages all shipped 11-27. Good work.

## Phrases to target, in priority order

1. **"mkv to mp4 without re-encoding", "mkv to mp4 keep subtitles", "remux mkv to mp4"** → `/mkv-to-mp4/` (live). Title and description are right; keep them. What page one shows (11-27):
   - Upload converters and video-editor vendors' "13 ways" articles, a DivX page, a Linux tutorial (ffmpeg `-codec copy`), and VideoHelp and HandBrake forum threads. The threads answer "use ffmpeg" or say MP4 can't hold PGS subtitles.
   - Three in-browser converters now rank. One re-encodes the video to H.264 (slow, quality loss). Another remuxes but keeps **only the video and the default audio track**. It **drops text subtitles**, and it converts AC-3/E-AC-3 only in browsers that can decode them (it names Safari and Edge), dropping that audio in Chrome and Firefox. Neither says anything about HEVC playing on Apple devices.
   - So we are the only page that copies **every chosen audio track, AC3/E-AC3 included, in any browser**, and **keeps text subtitles as selectable MP4 tracks**. Copy additions (src/site.ts, entry at about line 1655), after checking each in src/lib/mkvmp4.ts:
     - FAQ "Will Dolby (AC3 / E-AC3) audio survive?" → Yes, copied as is in every browser; it is not converted, so there is no quality loss. DTS, TrueHD, FLAC, Opus and Vorbis are listed as not kept (as the page already says).
     - FAQ "Are all my subtitle tracks kept?" → Text tracks (SRT, ASS as plain text) yes, each one selectable. Picture subtitles (PGS/VobSub) can't go into an MP4 as tracks. Link `/extract-subtitles-from-mkv/` then `/sup-to-srt/` to turn them into text first. Anchor: "turn PGS subtitles into text first".
     - FAQ "More than one audio language?" → you pick which ones to keep and which plays first (true per steps).
2. **"mkv plays on pc but not iphone / apple tv", "remuxed mp4 sound but no picture apple tv", "hevc mp4 no video iphone"** → guide `mkv-not-playing-on-iphone-or-tv` (live). Page one is Plex, Apple Community, Emby and MacRumors threads, several with no confirmed fix. One Plex thread (sound, no picture after remuxing HEVC) is exactly the `hev1`/`hvc1` tag problem. Copy addition: one H2 "Sound but no picture after converting?" Explain that H.265 video in an MP4 needs the `hvc1` tag for Apple devices, that some converters write `hev1`, and that our page always writes `hvc1`. **Grep the writer first**; only say it if true. Also a sentence that 10-bit H.264 won't play on most phones in any container (the page already warns).
3. **"large mkv to mp4", "convert 4gb mkv to mp4"** → `/mkv-to-mp4/`. The in-browser competitors say memory is the limit and advise a computer. If our writer builds the output from file slices (per the week plan), one sentence says how big a file has been tested. Use only a size a test or the owner's real-file check has actually run. Don't claim "any size".
4. **"add srt to mkv", "add subtitles to mkv without re-encoding"** → `/add-subtitles-to-mkv/` (live). Page one: two online editors that upload and burn the text in, three desktop-converter vendors, and VideoHelp threads saying "MKVToolNix". Still no browser tool that adds a soft track. No change; let it age. The lede must keep the words "without re-encoding" and "soft track you can turn off".
5. **"remove subtitles from mkv"** → `/remove-subtitles-from-mkv/` (live). No change.

## Pages that compete with each other

- `/mkv-to-mp4/` and guide `mkv-not-playing-on-iphone-or-tv`: fine as long as the guide's title stays a problem ("won't play on iPhone or TV") and not "convert MKV to MP4". Keep it that way.
- `/extract-subtitles-from-mkv/` and guide `extract-subtitles-from-mkv-without-software`: the guide was retitled 11-23 ("Forced, SDH or PGS?"). No change.

## Cross-links

- Inside SubFixer (add if missing): `/mp4-subtitles-not-showing-on-tv/` guide → `/mkv-to-mp4/`, one sentence where it says the TV reads MP4 better than MKV. Anchor "convert the MKV to MP4 with the subtitles kept".
- SubFixer to Stayfile: the /srt-to-csv/ link shipped 11-26. Nothing new is natural this week. Don't add others.

## Not for this week (ideas sent to the CEO)

- Batch remux (a season of MKVs) stays a Pro idea, as the week plan says.
- Hardcoded-subtitle OCR stays parked.
