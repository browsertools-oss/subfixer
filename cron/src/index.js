// Starts the ventures' daily-agent workflows on time. GitHub's own cron ran hours late.
// Secret GH_TOKEN: fine-grained token, Actions read/write on the venture repos only.
// cron/schedule.json is the one schedule: this Worker and the bb Ventures page both read it.
// If you change a minute there, add it to the crons in wrangler.toml too.
import schedule from "../schedule.json";

function localHour(date) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: schedule.timeZone, hour: "numeric", hourCycle: "h23" }).format(date));
}

async function dispatch(repo, run, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/daily-agent.yml/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "venture-cron", "x-github-api-version": "2022-11-28" },
    body: JSON.stringify({ ref: "main", inputs: { run } }),
  });
  if (res.status !== 204) throw new Error(`${repo} ${run}: ${res.status} ${await res.text()}`);
  console.log(`dispatched ${repo} ${run}`);
}

export default {
  async scheduled(event, env) {
    const when = new Date(event.scheduledTime);
    const run = schedule.hours[localHour(when)];
    if (!run) return; // the other UTC hour of the daylight-saving pair
    const minute = when.getUTCMinutes();
    for (const [repo, m] of Object.entries(schedule.repos)) {
      if (m === minute) await dispatch(repo, run, env.GH_TOKEN);
    }
  },
};
