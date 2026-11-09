// Daily business report. Deterministic: numbers come from APIs and files, not the model.
// Usage: node scripts/report.mjs [--dry-run]
// Env: OPENROUTER_API_KEY (spend), GH_TOKEN (to post the issue). Revenue sources get added as they go live.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dry = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);
const csvPath = 'ops/metrics.csv';

const ord = (d) => (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
const nice = (iso) => {
  const d = new Date(iso + 'T12:00:00Z');
  const day = d.getUTCDate();
  return `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${day}${ord(day)}`;
};
const usd = (n) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

// --- spend ---
async function llmSpendTotal() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const r = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) return null;
  const j = await r.json();
  return Number(j?.data?.usage ?? 0); // lifetime USD on this key
}
// ops/costs.json: monthly = recurring charges; purchases = one-off cash out
// (domains, API credit top-ups). AI usage draws down prepaid credit, so it is
// tracked in metrics.csv but not counted again as cash spend.
const costsFile = JSON.parse(readFileSync('ops/costs.json', 'utf8'));
const recurring = Object.values(costsFile.monthly ?? {}).reduce((a, b) => a + b, 0);
const purchases = costsFile.purchases ?? [];
const boughtOn = (pred) => purchases.filter((p) => pred(p.date)).reduce((a, p) => a + p.usd, 0);

// --- revenue (add Gumroad / AdSense / affiliate fetchers here as each goes live) ---
async function madeToday() {
  return 0;
}

// --- history ---
const rows = readFileSync(csvPath, 'utf8').trim().split('\n').slice(1).filter(Boolean).map((l) => {
  const [date, spent, made, visitors] = l.split(',');
  return { date, spent: +spent, made: +made, visitors: visitors === '' ? null : +visitors };
});
const statePath = 'ops/.llm_usage_total';
const prevLlm = existsSync(statePath) ? +readFileSync(statePath, 'utf8') : null;
const llmTotal = await llmSpendTotal();
const llmToday = llmTotal != null && prevLlm != null ? Math.max(0, llmTotal - prevLlm) : 0;
const aiToday = +llmToday.toFixed(4); // stored in metrics.csv spent_usd
const spentToday = boughtOn((d) => d === today);
const made = await madeToday();

const without = rows.filter((r) => r.date !== today);
without.push({ date: today, spent: aiToday, made, visitors: null });
const hist = without.slice(-90);

if (!dry) {
  writeFileSync(csvPath, 'date,spent_usd,made_usd,visitors\n' + hist.map((r) => `${r.date},${r.spent},${r.made},${r.visitors ?? ''}`).join('\n') + '\n');
  if (llmTotal != null) writeFileSync(statePath, String(llmTotal));
}

// --- chart: cumulative made vs spent, last 30 days ---
const last = hist.slice(-30);
let cs = 0, cm = 0;
const cumS = [], cumM = [];
for (const r of hist) { cm += r.made; }
let m0 = cm - last.reduce((a, r) => a + r.made, 0);
for (const r of last) { m0 += r.made; cumS.push(+(recurring + boughtOn((d) => d <= r.date)).toFixed(2)); cumM.push(+m0.toFixed(2)); }
const top = Math.max(1, ...cumS, ...cumM);
const chart = [
  '```mermaid',
  'xychart-beta',
  '  title "Last 30 days, running total (USD)"',
  `  x-axis [${last.map((r) => `"${nice(r.date)}"`).join(', ')}]`,
  `  y-axis "USD" 0 --> ${Math.ceil(top * 1.2)}`,
  `  line [${cumM.join(', ')}]`,
  `  line [${cumS.join(', ')}]`,
  '```',
].join('\n');

// --- month to date ---
const month = today.slice(0, 7);
const mtd = hist.filter((r) => r.date.startsWith(month));
const mtdSpent = recurring + boughtOn((d) => d.startsWith(month));
const aiUsedAll = hist.reduce((a, r) => a + r.spent, 0);
const credit = purchases.filter((p) => p.kind === 'api credits').reduce((a, p) => a + p.usd, 0);
const mtdMade = mtd.reduce((a, r) => a + r.made, 0);

// --- decisions from open issues labelled `decision` ---
let decisions = [];
try {
  const out = execFileSync('gh', ['issue', 'list', '--label', 'decision', '--state', 'open', '--json', 'number,title,url'], { encoding: 'utf8' });
  decisions = JSON.parse(out);
} catch { /* gh not available locally */ }

const next = existsSync('ops/next.md') ? readFileSync('ops/next.md', 'utf8').trim() : '- (none written)';

const body = `${chart}

The first line is money made and the second is cash spent (domains, credits, plans), both as running totals.

| | Today | This month | Cap |
|---|---|---|---|
| Spent | ${usd(spentToday)} | ${usd(mtdSpent)} | $50.00 |
| Made | ${usd(made)} | ${usd(mtdMade)} | |
| Net | ${usd(made - spentToday)} | ${usd(mtdMade - mtdSpent)} | |

LLM spend today: ${llmTotal == null ? 'not available (no key yet)' : usd(llmToday)}${credit && llmTotal != null ? ` (from prepaid credit: ${usd(aiUsedAll)} of ${usd(credit)} used)` : ''}.

### Next steps
${next}

### Needs you
${decisions.length ? decisions.map((d) => `- [ ] [${d.title}](${d.url})`).join('\n') : 'Nothing today.'}
`;

const title = `Daily report: ${nice(today)}${decisions.length ? ` (${decisions.length} need${decisions.length === 1 ? 's' : ''} you)` : ''}`;

if (dry) {
  console.log(title + '\n\n' + body);
} else {
  // One issue per day: update today's if it already exists.
  const existing = JSON.parse(execFileSync('gh', ['issue', 'list', '--label', 'report', '--state', 'open', '--search', `"Daily report: ${nice(today)}" in:title`, '--json', 'number'], { encoding: 'utf8' }));
  if (existing.length) execFileSync('gh', ['issue', 'edit', String(existing[0].number), '--title', title, '--body', body], { stdio: 'inherit' });
  else execFileSync('gh', ['issue', 'create', '--title', title, '--label', 'report', '--body', body], { stdio: 'inherit' });
  // Close older reports so only the latest stays open.
  const old = JSON.parse(execFileSync('gh', ['issue', 'list', '--label', 'report', '--state', 'open', '--json', 'number,title'], { encoding: 'utf8' })).filter((i) => !i.title.includes(nice(today)));
  for (const i of old) execFileSync('gh', ['issue', 'close', String(i.number)]);
}
