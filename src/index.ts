import { Hono } from "hono";
import { getJobs, setJob, deleteJob } from "./lib/kv";
import type { Job } from "./lib/kv";
import { fetchTimeout } from "./lib/utils";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/jobs", async (c) => {
  const jobs = await getJobs(c.env.CRONY_KV);
  return c.json(jobs);
});

app.post("/api/jobs", async (c) => {
  const job = await c.req.json();
  await setJob(c.env.CRONY_KV, job);
  return c.json({ message: "Job added successfully" });
});

app.delete("/api/jobs", async (c) => {
  const job = await c.req.json();
  await deleteJob(c.env.CRONY_KV, job.url);
  return c.json({ message: "Job deleted successfully" });
});

function filterJobs(jobs: Job[], timestamp: number): Job[] {
  return jobs.filter((job) => {
    if (!job.enabled) return false;

    if (job.interval <= 1) return true;

    const date = new Date(timestamp);
    const utcMinutesOfDay = date.getUTCHours() * 60 + date.getUTCMinutes();
    return utcMinutesOfDay % job.interval === 0;
  });
}

async function runJob(job: Job): Promise<void> {
  const { url } = job;
  console.log(`fetch: ${url}`);

  if (url.startsWith("/")) {
    await app.request(url);
  } else {
    await fetchTimeout(url, 1000).catch(_ => { });
  }
}

async function runJobs(env: CloudflareBindings, timestamp: number): Promise<void> {
  const jobs = await getJobs(env.CRONY_KV);
  const filteredJobs = filterJobs(jobs, timestamp);
  await Promise.all(filteredJobs.map(runJob));
}

export default {
  fetch: app.fetch,
  scheduled(event, env, ctx) {
    ctx.waitUntil(runJobs(env, event.scheduledTime));
  },
} satisfies ExportedHandler<CloudflareBindings>;
