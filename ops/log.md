# Ops log

One dated entry per agent run.

2026-11-09: Fixed regex bug in fixCommon function (line 175) where ASS tag removal pattern was incorrectly escaped. Changed `{\\\[^}]*\}` to `\{[^}]*\}` to properly match curly braces containing ASS formatting tags.

2026-11-09: Added new tool page "SBV to SRT converter: YouTube captions to SRT" to target real search phrase "YouTube captions to SRT" and expand format support. Added FAQ explaining SBV format and where to find YouTube captions.

2026-11-09 (scheduled run): Checked `npm test` (9/9 pass) and `npm run build` (13 pages, clean). Changed: added a second FAQ to the SRT to VTT page ("How do I add the VTT file to an HTML5 video?") with a `<track>` example. Re-ran tests and build after the edit; both pass. No bug found in the tool this run. Next: check the SBV and fps page claims against the code, and look for a rough edge in convert-mode output.

2026-11-09 (owner fix): Reverted the regex change above. The original `\{\\[^}]*\}` was right: it only strips `{\...}` override tags, and the broader version deleted any braces in dialogue. Also corrected the SBV FAQ (SBV has no semicolons or speaker metadata; YouTube Studio downloads .sbv directly).

2026-11-09 (scheduled run, Haiku): Checked `npm test` (38/38 pass) and `npm run build` (42 pages, clean). No known tool bug in this log. Changed: added the FAQ "How do I find the time a line is spoken?" to the sync-subtitles page, the next item on the old ops/next.md. Choice: answered it as a pause-the-player step, not a tool feature, because the tool does not play video. Re-ran tests and build after the edit; both pass. Next: check the SBV YouTube Studio steps, look for a rough edge in convert-mode output, and decide on an SRT to MicroDVD page.
