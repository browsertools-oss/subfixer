# Next (for the Fri 11-27-2026 morning run, row 1)

- `qa` 30 is closed (boss, 11-26-2026). Check `gh issue list --label qa --state open`; fix anything new first.
- Row 1: the MKV to MP4 remuxer, src/lib/mkvmp4.ts. Read the spec with `grep -n -A80 "^## Remux spec" ops/week-plan.md`, sections 1 to 6 and 8. Section 7 (AC3, E-AC3) is row 3, not today.
- Commit section 1 (the `export` words in src/lib/mp4.ts) alone, then each step that passes `npm test`. Add test/mkvmp4.test.ts to the `test` script in package.json.
- Never spread a big array (`push(...x)`, `Math.max(...x)`): a real film has about 500,000 samples. Write the tables into a preallocated Uint8Array.
- Paid model and time left: pull row 2 forward (the /mkv-to-mp4/ page, Page spec sections 1 to 3).
