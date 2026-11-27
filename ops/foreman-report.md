# Foreman report 11-27-2026

Runs: the last 6 daily-agent runs: 5 succeeded, 1 failed (11-24 morning, hit the 1h07m cap, work was committed). The 11-26 evening run (started 02:17 UTC on 11-27) finished in 37 min: it fixed the three mkvwrite tests, added the Add and Remove subtitles to MKV pages and two guides (MKV wrong default subtitles, TV ignores SRT next to MKV).
Checks: commits named in the log exist; `npm ci` then `npm test` gives 142 of 142 passing on main. No items are marked DONE in the new plan yet (rows start today), so nothing was un-marked.
QA: #33 (from 8222806) is open with five minor notes plus two I chose to skip; I put the five fixes (typo, two future-dated datePublished values, flag wording, missing first step in the CD1/CD2 guide, focus style) at the top of row 1 with exact files and text. #33 stays open until they are in.

Plan changes: row 1 only (the qa 33 fixes come before the remux work, with a note to run `npm ci` if tests say a package is missing). No guardrail added (no repeated mistake).

Needs the boss: nothing. Row 1 is big (remux spec sections 1 to 6 and 8) and the last paid day; if the worker finishes only part, row 2 already says to finish it first.
