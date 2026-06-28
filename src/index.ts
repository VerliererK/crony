import { Hono } from "hono";
import { getJobs, setJob, deleteJob } from "./lib/kv";

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

export default app;
