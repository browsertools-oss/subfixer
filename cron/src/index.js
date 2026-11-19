// Starts the ventures' agent workflows on time. GitHub's own cron ran hours late.
// Secret GH_TOKEN: fine-grained token, Actions read/write on the venture repos.
// cron/schedule.json is the one schedule: this Worker, the bb Ventures page and the
// hq provisioner (browsertools-oss/hq, scripts/provision.mjs) all read it, and the
// provisioner edits it when the CEO launches a venture or hires a worker.
// The Worker wakes at :17 and :47 every hour and dispatches whatever is due.
import schedule from "../schedule.json";

function localHour(date) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: schedule.timeZone, hour: "numeric", hourCycle: "h23" }).format(date));
}

function localDay(date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: schedule.timeZone, weekday: "short" }).format(date);
}

async function dispatch(repo, run, token, workflow = "daily-agent.yml") {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "venture-cron", "x-github-api-version": "2022-11-28" },
    body: JSON.stringify(run ? { ref: "main", inputs: { run } } : { ref: "main" }),
  });
  if (res.status !== 204) throw new Error(`${repo} ${run || workflow}: ${res.status} ${await res.text()}`);
  console.log(`dispatched ${repo} ${run || workflow}`);
}

/** Every [repo, run, workflow] due at this moment. Exported for the test. */
export function due(when) {
  const minute = when.getUTCMinutes();
  const hour = localHour(when);
  const out = [];
  // The CEO's nightly session in hq.
  const n = schedule.nightly;
  if (n && hour === n.hour && minute === n.minute) out.push([n.repo, null, n.workflow]);
  // Sunday planner (Opus, owner's Claude account) runs before the 6am daily run.
  const weekly = schedule.weekly;
  if (weekly && localDay(when) === weekly.day && hour === weekly.hour) {
    for (const [repo, m] of Object.entries(schedule.repos)) if (m === minute) out.push([repo, null, weekly.workflow]);
    return out;
  }
  const run = schedule.hours[String(hour)];
  for (const [repo, m] of Object.entries(schedule.repos)) {
    if (m !== minute) continue;
    if (run) out.push([repo, run, "daily-agent.yml"]);
    // Hired workers: an extra daily-agent run doing the job in that repo's ops/roles/<role>.md.
    const role = schedule.roles?.[repo]?.[String(hour)];
    if (role) out.push([repo, role, "daily-agent.yml"]);
  }
  return out;
}

export default {
  async scheduled(event, env) {
    const errors = [];
    for (const [repo, run, workflow] of due(new Date(event.scheduledTime))) {
      await dispatch(repo, run, env.GH_TOKEN, workflow).catch((e) => errors.push(e.message));
    }
    if (errors.length) throw new Error(errors.join("\n"));
  },
};
