import { Hono } from "hono";
import { getJobs, setJob, deleteJob, getActionText, setActionText } from "./lib/kv";
import type { Job } from "./lib/kv";
import { fetchTimeout, ntfyNotify } from "./lib/utils";
import jpy from "./api/jpy";
import freeios from "./api/freeios";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// --- Actions API ---
for (const [name, callback] of Object.entries({ jpy, freeios })) {
  app.get(`/${name}`, async (c) => {
    const lastText = await getActionText(c.env.CRONY_KV, name);
    const { update_text, needs_update } = await callback(lastText || "");
    if (needs_update) {
      await setActionText(c.env.CRONY_KV, name, update_text);
      await ntfyNotify(c.env, update_text);
    }
    return c.text(update_text || "");
  });
}

// --- Jobs Management API ---
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

async function runJob(env: CloudflareBindings, job: Job): Promise<void> {
  const { url } = job;
  console.log(`fetch: ${url}`);

  if (url.startsWith("/")) {
    await app.request(url, undefined, env);
  } else {
    await fetchTimeout(url, 1000).catch(_ => { });
  }
}

async function runJobs(env: CloudflareBindings, timestamp: number): Promise<void> {
  const jobs = await getJobs(env.CRONY_KV);
  const filteredJobs = filterJobs(jobs, timestamp);
  await Promise.all(filteredJobs.map((job) => runJob(env, job)));
}

export default {
  fetch: app.fetch,
  scheduled(event, env, ctx) {
    ctx.waitUntil(runJobs(env, event.scheduledTime));
  },
} satisfies ExportedHandler<CloudflareBindings>;
