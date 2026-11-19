#!/usr/bin/env node
// Quality gate, part 2: before each deploy, a reviewer (Claude, owner's account) reads what
// changed on the site since the last successful deploy. Serious problems block the deploy;
// minor ones go to a `qa` issue for the foreman to schedule. If the reviewer can't run,
// the deploy goes ahead (the link check and tests still guard it).
// Env: CLAUDE_CODE_OAUTH_TOKEN, GH_TOKEN, QA_MODEL (default claude-sonnet-5-5).
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";

const sh = (...a) => execFileSync(a[0], a.slice(1), { encoding: "utf8" }).trim();
const SITE = /^(src|public)\/|^astro\.config/;

let base = "";
try { base = sh("gh", "run", "list", "--workflow", "deploy.yml", "--status", "success", "--limit", "1", "--json", "headSha", "--jq", ".[0].headSha"); } catch {}
try { if (base) sh("git", "cat-file", "-e", base); } catch { base = ""; }
if (!base) { try { base = sh("git", "rev-parse", "HEAD~1"); } catch { console.log("qa: no earlier commit, skipping"); process.exit(0); } }

const changed = sh("git", "diff", "--name-only", `${base}..HEAD`).split("\n").filter((f) => SITE.test(f));
if (!changed.length) { console.log("qa: no site files changed, nothing to review"); process.exit(0); }
let diff = sh("git", "diff", `${base}..HEAD`, "--", ...changed);
if (diff.length > 60000) diff = diff.slice(0, 60000) + "\n[diff cut at 60,000 characters; read the files for the rest]";

const prompt = fs.readFileSync(".github/agent/qa.md", "utf8") + `\n\nChanged files:\n${changed.join("\n")}\n\nThe diff:\n${diff}`;
const env = { ...process.env };
for (const k of ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY"]) delete env[k];
const r = spawnSync("claude", ["-p", prompt, "--model", process.env.QA_MODEL || "claude-sonnet-5-5", "--max-turns", "40", "--allowedTools", "Read,Grep,Glob"], { env, encoding: "utf8", timeout: 12 * 60_000, maxBuffer: 10e6 });
const out = (r.stdout || "").trim();
const m = out.match(/\{[\s\S]*"verdict"[\s\S]*\}/);
let v = null;
try { v = m && JSON.parse(m[0]); } catch {}
if (!v) { console.log(`qa: reviewer gave no verdict (exit ${r.status}); deploying anyway.\n${(r.stderr || out).slice(0, 500)}`); process.exit(0); }

const fmt = (xs) => xs.map((p) => `- ${p.file ? `\`${p.file}\`: ` : ""}${p.problem}${p.fix ? ` Fix: ${p.fix}` : ""}`).join("\n");
const blocking = v.blocking || [], minor = v.minor || [];
const head = sh("git", "rev-parse", "--short", "HEAD");
if (blocking.length || minor.length) {
  try { sh("gh", "label", "create", "qa", "--color", "FBCA04"); } catch {}
  const body = [
    blocking.length ? `Deploy of ${head} was blocked. Fix these first; the next push deploys once they pass.\n\n${fmt(blocking)}` : `Deployed ${head}. Fix these in the next runs.`,
    minor.length ? `\nMinor:\n\n${fmt(minor)}` : "",
    "\nThe foreman puts these into the plan and closes this issue when they are fixed.",
  ].join("\n");
  fs.writeFileSync("/tmp/qa-issue.md", body);
  try { sh("gh", "issue", "create", "--label", "qa", "--title", `QA ${blocking.length ? "blocked" : "notes"}: ${head}`, "--body-file", "/tmp/qa-issue.md"); } catch (e) { console.log("qa: could not open the issue", e.message); }
}
console.log(`qa: ${blocking.length} blocking, ${minor.length} minor`);
if (blocking.length) { console.log(fmt(blocking)); process.exit(1); }
