# Ops log

One dated entry per agent run.

2026-11-09: Fixed regex bug in fixCommon function (line 175) where ASS tag removal pattern was incorrectly escaped. Changed `{\\\[^}]*\}` to `\{[^}]*\}` to properly match curly braces containing ASS formatting tags.

2026-11-09: Added new tool page "SBV to SRT converter: YouTube captions to SRT" to target real search phrase "YouTube captions to SRT" and expand format support. Added FAQ explaining SBV format and where to find YouTube captions.
