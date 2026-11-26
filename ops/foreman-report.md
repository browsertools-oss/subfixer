# Foreman report 11-26-2026

Runs: the last 6 daily-agent runs: 5 succeeded, 1 failed (11-24 morning, hit the 1h07m cap but had committed its work). The 11-25 evening run (started 02:17 UTC on 11-26) finished in 47 min and shipped 10 commits: MKV guide copy and FAQs, the MP4 on TV guide, the guides index grouped by topic (29 guides), three claims checks, the CD1/CD2 join guide and the reading-speed example. Log says 127 of 127 tests and 106 pages built; I could not rerun tests or the build here (no node_modules).
Checks: all commits named in the log exist in git. Spot-checks by grep match the log, and `qa` 27's fixes are in the code. `qa` 30 is real: the duplicate SUMMARIES key is still there (2 matches) and the "Some users report" lines are still in the MP4 TV guide.
QA: closed #27. #30 stays open; its six fixes are in row 1 (a) of today's plan.

Plan changes: row 1 only. I added a note to commit after each numbered item and to do (b) and (c) before the last two `qa` items if time runs short, because row 1 is large and the 11-24 morning run hit the hour cap. No items were marked DONE, so none were un-marked. No guardrail added (no repeated mistakes seen).

Needs the boss: nothing. Still open: the owner should check one real MKV and one real MP4 on the live pages, since the readers are tested only on built fixtures.
