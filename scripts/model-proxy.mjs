#!/usr/bin/env node
// Local Anthropic Messages API proxy in front of OpenRouter, for the daily agent.
//
// Claude Code talks to http://127.0.0.1:8787 instead of OpenRouter. Each request
// goes to the best free model in .github/agent/models.json that isn't cooling
// down. A model that answers 429, 5xx or a stream error is benched for a while
// and the request is retried on the next one, so the run cycles through the
// free models until they are all used up.
//
// It also keeps the session to its budget: after AGENT_MINUTES or
// AGENT_REQUESTS it adds a wrap-up note to the agent's input, and a little
// later (or when OpenRouter's daily free quota is gone) it refuses further
// requests so the agent stops and the workflow commits what is done.
//
// Env: OPENROUTER_API_KEY, AGENT_MINUTES (default 10), AGENT_REQUESTS (default 240).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const KEY = process.env.OPENROUTER_API_KEY;
const PORT = Number(process.env.PROXY_PORT || 8787);
const MINUTES = Number(process.env.AGENT_MINUTES || 10);
const MAX_REQ = Number(process.env.AGENT_REQUESTS || 240);
const UPSTREAM = process.env.PROXY_UPSTREAM || "https://openrouter.ai/api/v1/messages";
const { models } = JSON.parse(fs.readFileSync(new URL("../.github/agent/models.json", import.meta.url), "utf8"));
const liveDir = path.join(process.env.RUNNER_TEMP || "/tmp", "agent-live");
fs.mkdirSync(liveDir, { recursive: true });

const started = Date.now();
const benched = new Map(); // model -> until (ms)
let used = 0;
let lastModel = null;
let quotaGone = false;
const stats = {}; // model -> { ok, failed }

function note(text) {
  console.log(new Date().toISOString(), text);
  try { fs.appendFileSync(path.join(liveDir, "notes.jsonl"), `${JSON.stringify({ t: new Date().toISOString(), text })}\n`); } catch {}
}
function saveStats() {
  try { fs.writeFileSync(path.join(liveDir, "models.json"), JSON.stringify({ used, quotaGone, stats }, null, 1)); } catch {}
}
const bump = (m, k) => { (stats[m] ??= { ok: 0, failed: 0 })[k]++; saveStats(); };
const bench = (m, ms, why) => {
  benched.set(m, Date.now() + ms);
  bump(m, "failed");
  note(`${m} unavailable (${why}); trying the next free model`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const minutes = () => (Date.now() - started) / 60_000;

function anthropicError(res, status, type, message) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify({ type: "error", error: { type, message } }));
}

const WRAP_UP =
  "[Run note: this session's time or request budget is nearly used. Finish the item you are on (test, build, commit), then do steps 4 and 5: the ops/log.md entry and ops/next.md. Don't start another item.]";

/** Add the wrap-up note to the newest user turn of the outgoing request only. */
function withWrapUp(body) {
  const last = body.messages?.at(-1);
  if (!last || last.role !== "user") return body;
  const content = typeof last.content === "string" ? [{ type: "text", text: last.content }] : [...last.content];
  content.push({ type: "text", text: WRAP_UP });
  return { ...body, messages: [...body.messages.slice(0, -1), { ...last, content }] };
}

function pickModel() {
  const now = Date.now();
  return models.find((m) => (benched.get(m) ?? 0) <= now) ?? null;
}

/** Read a streamed response until the first real event, so an early error can be retried elsewhere. */
async function firstEvent(reader) {
  const chunks = [];
  let text = "";
  const dec = new TextDecoder();
  while (text.length < 64_000) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
    text += dec.decode(value, { stream: true });
    if (/event: (message_start|error)/.test(text) || /"type"\s*:\s*"error"/.test(text)) break;
  }
  return { chunks, text, error: /event: error|"type"\s*:\s*"error"/.test(text) && !/event: message_start/.test(text) ? text.slice(0, 300) : null };
}

async function forward(req, res, raw) {
  let body;
  try { body = JSON.parse(raw); } catch { return anthropicError(res, 400, "invalid_request_error", "bad JSON"); }
  const counted = req.url.startsWith("/v1/messages") && !req.url.includes("count_tokens");
  if (counted) used++;

  if (quotaGone) return anthropicError(res, 400, "invalid_request_error", "Today's free model quota is used up. Stop here.");
  if (counted && (used > MAX_REQ + 30 || minutes() > MINUTES + 8)) {
    return anthropicError(res, 400, "invalid_request_error", "This session's budget is used up. Stop here.");
  }
  if (counted && (used >= MAX_REQ || minutes() >= MINUTES)) body = withWrapUp(body);

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!["host", "content-length", "authorization", "x-api-key", "connection", "accept-encoding"].includes(k)) headers[k] = v;
  }
  headers.authorization = `Bearer ${KEY}`;
  headers["content-type"] = "application/json";

  for (let waits = 0; waits < 4; ) {
    const model = pickModel();
    if (!model) {
      const soonest = Math.min(...models.map((m) => benched.get(m) ?? 0));
      waits++;
      await sleep(Math.min(70_000, Math.max(2_000, soonest - Date.now())));
      continue;
    }
    if (model !== lastModel) {
      note(`Using ${model}`);
      lastModel = model;
    }
    let up;
    try {
      up = await fetch(req.url.includes("count_tokens") ? `${UPSTREAM}/count_tokens` : UPSTREAM, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...body, model }),
        signal: AbortSignal.timeout(300_000),
      });
    } catch (e) {
      bench(model, 120_000, `network: ${e.message}`);
      continue;
    }
    if (!up.ok) {
      const text = (await up.text()).slice(0, 400);
      if (up.status === 429 && /per-day|per day|daily/i.test(text)) {
        quotaGone = true;
        note("Today's free model quota is used up; wrapping up");
        saveStats();
        return anthropicError(res, 400, "invalid_request_error", "Today's free model quota is used up. Stop here.");
      }
      if (up.status === 429) bench(model, 65_000, "rate limited");
      else if (up.status >= 500 || up.status === 408) bench(model, 180_000, `error ${up.status}`);
      else bench(model, 30 * 60_000, `error ${up.status}: ${text.slice(0, 120)}`);
      continue;
    }
    if (!body.stream || !up.body) {
      const text = await up.text();
      if (/"type"\s*:\s*"error"/.test(text.slice(0, 200))) { bench(model, 120_000, "error reply"); continue; }
      bump(model, "ok");
      res.writeHead(200, { "content-type": up.headers.get("content-type") ?? "application/json" });
      return res.end(text);
    }
    const reader = up.body.getReader();
    const { chunks, text: head, error } = await firstEvent(reader);
    if (error || chunks.length === 0) {
      reader.cancel().catch(() => {});
      bench(model, 120_000, error ? "stream error" : "empty reply");
      continue;
    }
    res.writeHead(200, { "content-type": up.headers.get("content-type") ?? "text/event-stream", "cache-control": "no-cache" });
    for (const c of chunks) res.write(c);
    let tail = head.slice(-2000);
    const dec = new TextDecoder();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        tail = (tail + dec.decode(value, { stream: true })).slice(-2000);
        res.write(value);
      }
    } catch (e) {
      tail += ` (read failed: ${e.message})`;
    }
    res.end();
    if (/message_stop/.test(tail)) bump(model, "ok");
    else bench(model, 120_000, "reply cut off");
    return;
  }
  anthropicError(res, 529, "overloaded_error", "All free models are busy; try again shortly.");
}

http
  .createServer((req, res) => {
    if (req.method === "GET") return res.end("ok");
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => forward(req, res, raw).catch((e) => {
      console.error(e);
      if (!res.headersSent) anthropicError(res, 529, "overloaded_error", String(e.message));
      else res.end();
    }));
  })
  .listen(PORT, "127.0.0.1", () => note(`Free model rotation ready: ${models.length} models, ${MINUTES} minutes, ${MAX_REQ} requests`));
