#!/usr/bin/env node
// The boss: answers the daily agent's questions with Claude Opus on the owner's Claude account.
//
// The Sunday planner (weekly-plan.yml) writes ops/week-plan.md; the free-model daily agent
// follows it, and when the plan is unclear, blocked or used up it runs
//   node scripts/ask-boss.mjs "<question>"
// which posts here. This server runs in its own background step, so the OAuth token
// (CLAUDE_CODE_OAUTH_TOKEN) never enters the agent's environment. Each answer is
// appended to ops/boss-answers.md so the Sunday planner sees what came up.
//
//   node scripts/boss.mjs &        before the agent step (needs `claude` on PATH)
import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";

const PORT = 8788;
const MAX = Number(process.env.BOSS_MAX_QUESTIONS || 6);
const MODEL = process.env.BOSS_MODEL || "claude-opus-5-5";
const TIMEOUT_MS = 6 * 60_000;
const LOG = "ops/boss-answers.md";
let asked = 0;
let busy = Promise.resolve();

const PROMPT = (q) => `You are the boss of this venture. On Sunday you wrote ops/week-plan.md, the plan for the week, aimed at revenue first and foremost. A daily agent running on a free model is executing that plan right now and has stopped to ask you something. It will do exactly what you say, and it is weaker than you, so be concrete: name the file, the change, the exact text or values when they matter, and what done looks like (a test, a build, a grep). Judge every answer by what earns revenue soonest. If it is blocked, give the workaround or the next item to take instead. If what it asks is something it may not do (spending money, accounts, secrets, DNS, billing, workflows, anything a git revert cannot undo), say no and give it the next item.

You take direction from the company's CEO, who writes it in ops/ceo-notes.md; your answers must fit it. Read ops/week-plan.md first, then ops/ceo-notes.md if it exists, then only the files you need. Don't edit files. Answer in 200 words or fewer, as plain instructions.

The agent's question:
${q}`;

function ask(question) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    for (const k of ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY"]) delete env[k];
    const child = spawn("claude", [
      "-p", PROMPT(question),
      "--model", MODEL,
      "--max-turns", "30",
      "--allowedTools", "Read,Grep,Glob,WebSearch,WebFetch,Bash(git log*),Bash(git show*),Bash(git diff*)",
    ], { env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), TIMEOUT_MS);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 && out.trim() ? out.trim() : `The boss could not answer (exit ${code}). ${err.trim().slice(0, 300)} Take the next item in ops/week-plan.md instead.`);
    });
  });
}

function record(question, answer) {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, "# Questions the daily agents asked the boss\n\nThe Sunday planner reads this to make next week's plan clearer.\n");
  fs.appendFileSync(LOG, `\n## ${stamp}\n\n**Q:** ${question.trim()}\n\n**A:** ${answer}\n`);
}

http.createServer((req, res) => {
  if (req.method === "GET") return res.end("boss ready\n");
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    let question = "";
    try { question = String(JSON.parse(body).question || ""); } catch { /* empty */ }
    if (!question.trim()) { res.statusCode = 400; return res.end("Ask a question.\n"); }
    if (asked >= MAX) return res.end(`You have used all ${MAX} questions for this run. Decide using ops/week-plan.md: take the next unfinished item in your row, then the backlog in order.\n`);
    asked++;
    // One question at a time, so answers stay in order and quota use stays predictable.
    busy = busy.then(async () => {
      const answer = await ask(question);
      record(question, answer);
      res.end(answer + "\n");
    });
  });
}).listen(PORT, "127.0.0.1", () => console.log(`boss listening on ${PORT}, ${MAX} questions per run, model ${MODEL}`));
