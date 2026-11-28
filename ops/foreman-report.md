# Foreman report 11-28-2026

Runs: the last 6 daily-agent runs all succeeded (8 to 52 min). The 11-27 evening run (8 min) did rows 4 and 5 and backlog items 2 and 4; 151 tests, 112 pages, no duplicate-key warning. Commits for every DONE item exist (cea707a, b9327f0, 2404e7f, 583ebf2, 4fdd6af), and I spot-checked the guide, the two sidecar links, the dual-language key and the dac3/dec3 code in the files.
Problem: the two last deploys (002b1c1, ea0057e) were blocked by the quality checker (`qa` 36 and 37). src/components/MkvToMp4.astro assigns `LANGS` without declaring it, so picking any file throws and /mkv-to-mp4/ shows no tracks and no Save button. Tests and build don't catch this. Nobody has run the page in a browser.
QA: closed #33 (all fixes verified in the code). #36 and #37 stay open.

Plan changes: added row 0 at the top of today's morning run with the exact fixes for #36 and #37 (declare LANGS, PGS link text, remove the empty column, delete unused englishName). Row 3 was already done, so without this the run would have skipped to backlog. Added a guardrail: declare every variable when copying a component.

Needs the boss: the plan is nearly empty after row 5 (only row 6 and backlog items 3, 5 to 7 are left), and Sunday's replan should add a real-browser check of /mkv-to-mp4/ by the owner, since no worker can run one.
