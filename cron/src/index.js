// Starts the ventures' daily-agent workflows on time. GitHub's own cron ran hours late.
// Secret GH_TOKEN: fine-grained token, Actions read/write on the venture repos only.
// cron/schedule.json is the one schedule: this Worker and the bb Ventures page both read it.
// If you change a minute there, add it to the crons in wrangler.toml too.
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
  if (res.status !== 204) throw new Error(`${repo} ${run}: ${res.status} ${await res.text()}`);
  console.log(`dispatched ${repo} ${run || workflow}`);
}

export default {
  async scheduled(event, env) {
    const when = new Date(event.scheduledTime);
    const minute = when.getUTCMinutes();
    // Sunday planner (Opus, owner's Claude account) runs before the 6am daily run.
    const weekly = schedule.weekly;
    if (weekly && localDay(when) === weekly.day && localHour(when) === weekly.hour) {
      for (const [repo, m] of Object.entries(schedule.repos)) {
        if (m === minute) await dispatch(repo, null, env.GH_TOKEN, weekly.workflow);
      }
      return;
    }
    const run = schedule.hours[localHour(when)];
    if (!run) return; // the other UTC hour of the daylight-saving pair
    for (const [repo, m] of Object.entries(schedule.repos)) {
      if (m === minute) await dispatch(repo, run, env.GH_TOKEN);
    }
  },
};
