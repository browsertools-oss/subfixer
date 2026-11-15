#!/usr/bin/env node
// Ask the boss (Claude Opus, see scripts/boss.mjs) a question about the week plan.
// Usage: node scripts/ask-boss.mjs "Row 3 says X but Y is missing. What should I do?"
// Prints the answer. Do what it says.
const question = process.argv.slice(2).join(" ").trim();
if (!question) {
  console.error('Usage: node scripts/ask-boss.mjs "<question>"');
  process.exit(2);
}
try {
  const res = await fetch("http://127.0.0.1:8788/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(15 * 60_000),
  });
  console.log(await res.text());
} catch (e) {
  console.log(`The boss is not reachable (${e.message}). Take the next unfinished item in ops/week-plan.md, then the backlog in order.`);
}
