# Foreman report 11-23-2026

Yesterday's runs: 11-22 14:17 UTC (morning) finished in 9m34s and shipped 12 commits (qa issue 20 fixes, home page guide list, datePublished, cross-links, ANSI save UI and FAQs); issue 20 is closed. 11-23 02:17 UTC (evening) finished in 35m37s with success status but made no commits (the boss's answer says it wrote the TV USB guide and never committed it). Since then only the CEO note and the boss's weekly plan landed.

Checks: no `qa` issues are open. The new plan has nothing marked DONE, so nothing to verify. src/lib/mkv.ts and test/mkv* do not exist yet; row 1 is untouched.

Plan changes: row 1(a) (the MKV reader, the biggest item this week) is now split into three commit steps (fixture, reader and scan with five tests, then trackFile and assToSrt with two tests) so a partial session still ships something. The guardrails already cover "commit as soon as it passes", so I added none.

Needs the boss: none. Watch today's 14:17 UTC run: if it ends with no mkv.ts commit, the MKV spec is too large for one session and should be cut further.
