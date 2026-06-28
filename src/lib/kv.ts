type Job = {
  url: string;
  interval: number;
  enabled: boolean;
};

const JOBS_KEY = "jobs:v1";

export const getJobs = async (KV_BINDING: KVNamespace): Promise<Job[]> => {
  const value = await KV_BINDING.get(JOBS_KEY, "json");
  if (!Array.isArray(value)) {
    return [];
  }
  return value as Job[];
};

export const setJob = async (KV_BINDING: KVNamespace, job: Job) => {
  const jobs = await getJobs(KV_BINDING);
  const existingJobIndex = jobs.findIndex((j) => j.url === job.url);
  if (existingJobIndex !== -1) {
    jobs[existingJobIndex] = { ...jobs[existingJobIndex], ...job };
  } else {
    jobs.push(job);
  }
  return KV_BINDING.put(JOBS_KEY, JSON.stringify(jobs));
};

export const deleteJob = async (KV_BINDING: KVNamespace, jobUrl: string) => {
  const jobs = await getJobs(KV_BINDING);
  const updatedJobs = jobs.filter((job) => job.url !== jobUrl);
  return KV_BINDING.put(JOBS_KEY, JSON.stringify(updatedJobs));
};
