# Foreman report 11-25-2026

Runs: 5 of the last 6 daily-agent runs succeeded. The 11-24 morning run was marked failure at the 1h07m hour cap, but it had already committed its guides (git log confirms them). The 11-24 evening run (11-25 02:17 UTC) finished in 11 min and shipped 4 guides (burned-in vs soft, remove SDH, overlapping lines, MX Player) plus MKV copy fixes. The guide count is now 27.
Checks: I could not run tests or the build here (no node_modules in the foreman checkout), so I did not re-verify the 98 of 98 pass from the log. Spot-checks by grep: the plan's exact line references for `qa` 27 (MX Player line 37, Kodi line 12, the missing SUMMARIES entries, the trailing space in the MKV guide, the shift tool labels in Tool.astro) all match the code.
QA: issue #27 (six minor items on the new guides) is open. All six are real and already at the top of row 1 (a) of the new plan with exact text. I did not close it.

Plan changes: none needed. The boss wrote the plan at 22:30 Pacific and no row is marked DONE yet, so there was nothing to un-mark. Row 1 starts with `qa` 27, then the MP4 reader step 1.

Needs the boss: nothing. Still open: the owner should check one real MKV and one real MP4 on the live pages, since the readers are tested only on built fixtures.
