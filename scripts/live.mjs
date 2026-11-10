#!/usr/bin/env node
// Live feed of a daily-agent run, for the Ventures page in bb.
//
// Claude Code writes its session transcript to ~/.claude/projects as it works.
// `watch` (started in the background before the agent step) turns that into a
// short list of what the agent is doing and keeps a GitHub check run named
// "Agent live" up to date with it every few seconds. The check run's
// external_id is the Actions run id, and its output.text is JSON:
//   { updatedAt, phase, todos: [{content, status}], events: [{t, kind, text}] }
//
//   node scripts/live.mjs watch &            before the agent step
//   node scripts/live.mjs phase "<text>"     a step marks what the run is on
//   node scripts/live.mjs finish             last step, if: always()
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { GITHUB_TOKEN, GITHUB_REPOSITORY: repo, GITHUB_SHA: sha, GITHUB_RUN_ID: runId } = process.env;
const dir = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "agent-live");
fs.mkdirSync(dir, { recursive: true });
const file = (name) => path.join(dir, name);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_EVENTS = 80;
const TICK_MS = 6_000;

async function api(method, url, body) {
  const res = await fetch(`https://api.github.com/repos/${repo}/${url}`, {
    method,
    headers: { authorization: `Bearer ${GITHUB_TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const clip = (s, n = 280) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const rel = (p) => String(p ?? "").replace(/^.*?\/work\/[^/]+\/[^/]+\//, "");

function describe(name, input = {}) {
  switch (name) {
    case "Read": return `Reading ${rel(input.file_path)}`;
    case "Edit": case "MultiEdit": return `Editing ${rel(input.file_path)}`;
    case "Write": return `Writing ${rel(input.file_path)}`;
    case "Bash": return `Running ${clip(String(input.command ?? "").split("\n")[0], 140)}`;
    case "Grep": return `Searching for ${clip(input.pattern, 80)}`;
    case "Glob": return `Listing ${clip(input.pattern, 80)}`;
    case "TodoWrite": return "Updating its to-do list";
    case "WebFetch": return `Fetching ${clip(input.url, 120)}`;
    default: return name;
  }
}

/** The newest top-level transcript written since the watcher started. */
function transcript(since) {
  const roots = [process.env.CLAUDE_CONFIG_DIR, path.join(os.homedir(), ".claude")].filter(Boolean).map((r) => path.join(r, "projects"));
  let best = null;
  for (const root of roots) {
    let projects = [];
    try { projects = fs.readdirSync(root); } catch { continue; }
    for (const p of projects) {
      let names = [];
      try { names = fs.readdirSync(path.join(root, p)); } catch { continue; }
      for (const n of names) {
        if (!n.endsWith(".jsonl")) continue;
        const f = path.join(root, p, n);
        const m = fs.statSync(f).mtimeMs;
        if (m >= since && (!best || m > best.m)) best = { f, m };
      }
    }
  }
  return best?.f ?? null;
}

function readLines(f) {
  try {
    return fs.readFileSync(f, "utf8").split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  } catch { return []; }
}

function build(since) {
  const events = [];
  let todos = [];
  const pending = new Map();
  const f = transcript(since);
  for (const line of f ? readLines(f) : []) {
    const t = line.timestamp ?? new Date().toISOString();
    const content = Array.isArray(line.message?.content) ? line.message.content : [];
    if (line.type === "assistant") {
      for (const c of content) {
        if (c.type === "text" && c.text?.trim()) events.push({ t, kind: "say", text: clip(c.text) });
        if (c.type === "tool_use") {
          if (c.name === "TodoWrite" && Array.isArray(c.input?.todos)) {
            todos = c.input.todos.map((x) => ({ content: clip(x.content, 160), status: x.status }));
          }
          const e = { t, kind: "tool", text: describe(c.name, c.input) };
          pending.set(c.id, e);
          events.push(e);
        }
      }
    } else if (line.type === "user") {
      for (const c of content) {
        if (c.type === "tool_result" && c.is_error && pending.has(c.tool_use_id)) {
          const e = pending.get(c.tool_use_id);
          e.kind = "error";
          const out = Array.isArray(c.content) ? c.content.map((x) => x.text ?? "").join(" ") : c.content;
          e.text = `${e.text} (failed: ${clip(out, 120)})`;
        }
      }
    }
  }
  for (const p of readLines(file("phases.jsonl"))) events.push({ t: p.t, kind: "phase", text: p.text });
  for (const p of readLines(file("notes.jsonl"))) events.push({ t: p.t, kind: "note", text: p.text });
  events.sort((a, b) => a.t.localeCompare(b.t));
  const phases = events.filter((e) => e.kind === "phase");
  const phase = phases.at(-1)?.text ?? (f ? "Agent working" : "Starting the agent");
  const model = [...events].reverse().find((e) => e.kind === "note" && e.text.startsWith("Using "))?.text.slice(6) ?? null;
  return { phase, model, todos, events: events.slice(-MAX_EVENTS), started: Boolean(f) };
}

function output(state, done) {
  const recent = state.events.slice(-15).reverse().map((e) => `- ${e.t.slice(11, 16)} UTC · ${e.text.replace(/\n/g, " ")}`).join("\n");
  return {
    title: done ? "Run finished" : state.phase,
    summary: `${done ? "Finished." : `Now: ${state.phase}`}\n\n${recent || "Nothing yet."}`.slice(0, 60_000),
    text: JSON.stringify({ updatedAt: new Date().toISOString(), phase: done ? "Finished" : state.phase, model: state.model, todos: state.todos, events: state.events }).slice(0, 65_000),
  };
}

async function watch() {
  const since = Date.now() - 5_000;
  const check = await api("POST", "check-runs", {
    name: "Agent live",
    head_sha: sha,
    external_id: String(runId),
    status: "in_progress",
    output: output(build(since), false),
  });
  fs.writeFileSync(file("id"), String(check.id));
  let last = "";
  const deadline = Date.now() + 100 * 60_000;
  while (!fs.existsSync(file("stop")) && Date.now() < deadline) {
    await sleep(TICK_MS);
    const out = output(build(since), false);
    if (out.text.replace(/"updatedAt":"[^"]+"/, "") === last) continue;
    last = out.text.replace(/"updatedAt":"[^"]+"/, "");
    await api("PATCH", `check-runs/${check.id}`, { output: out }).catch((e) => console.error(e.message));
  }
  await api("PATCH", `check-runs/${check.id}`, {
    status: "completed",
    conclusion: "neutral",
    output: output(build(since), true),
  }).catch((e) => console.error(e.message));
  fs.writeFileSync(file("done"), "1");
}

async function finish() {
  if (!fs.existsSync(file("id"))) return;
  fs.writeFileSync(file("stop"), "1");
  for (let i = 0; i < 40 && !fs.existsSync(file("done")); i++) await sleep(500);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "watch") await watch();
else if (cmd === "phase") fs.appendFileSync(file("phases.jsonl"), `${JSON.stringify({ t: new Date().toISOString(), text: rest.join(" ") })}\n`);
else if (cmd === "finish") await finish();
else {
  console.error("usage: live.mjs watch | phase <text> | finish");
  process.exit(1);
}
