// Starts the ventures' daily-agent workflows on time. GitHub's own cron ran hours late.
// Secret GH_TOKEN: fine-grained token, Actions read/write on the venture repos only.
const REPOS = { 17: "stevenlutsky-oss/subfixer", 47: "stevenlutsky-oss/stayfile" };

function laHour(date) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(date));
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
    const hour = laHour(when);
    if (hour !== 6 && hour !== 18) return; // the other UTC hour of the DST pair
    const repo = REPOS[when.getUTCMinutes()];
    if (repo) await dispatch(repo, hour === 6 ? "morning" : "evening", env.GH_TOKEN);
  },
};
