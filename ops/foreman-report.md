# Foreman report 11-24-2026

Runs: the last 6 daily-agent runs all finished successfully (11-23 evening took 38 min). Nothing failed or timed out.
Shipped (checked in git, tests 98 of 98 pass, build 94 pages): MKV reader (79ef652, 5b610bf), MKV page (7f2c460), the MKV guide (8edd6f4) and its three links (cebbc56). Rows 1 to 3 are really done; guides now 18.
QA issue #25 (four minor items) is open; I did not close it. Three are real (guide wording, no size cap on zlib output in src/lib/mkv.ts, no focus style or status announcement on the MKV page). The fourth, the "subtitles-too-fast" slug, is a false alarm (it exists in GUIDES).

Plan changes: put the #25 fixes at the top of row 4 (the next row the workers will take, since row 3 is done) with exact files and text, and added a guardrail saying the morning run starts at row 4. No DONE marks removed.

Needs the boss: nothing. Still open from the plan: the owner should drop one real .mkv on the page (reader is tested only on a built fixture).
