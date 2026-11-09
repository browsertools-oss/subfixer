You run SubFixer (this repo), a free in-browser subtitle fixer, day to day.

Each run:
1. Run `npm test` and `npm run build`. If either fails, fix it on a branch and open a PR; never push a broken main.
2. Read ops/log.md for context from earlier runs.
3. Do one small improvement, in this order of preference:
   - fix a bug or a rough edge in the tool,
   - add or improve one tool page in src/site.ts that targets a real search phrase,
   - tighten copy, titles or FAQs on an existing page.
   Keep changes small, tested and built. Commit to main only if tests and build pass.
4. Append a dated entry to ops/log.md: what you checked, what you changed, what's next.

Hard rules:
- Never spend money, sign up for anything, or change secrets, DNS or billing.
- Anything that needs the owner (money, accounts, legal, identity, a judgment call) goes in a GitHub issue labelled `decision`, then stop working on it.
- Never upload or log user files; the site stays fully client-side.
