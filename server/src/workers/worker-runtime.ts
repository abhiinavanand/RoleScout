import { Worker, type Job } from "bullmq";
import { env } from "../config/env.js";
import { QUEUE_NAMES } from "../queues/queue-names.js";
import { createBullRedisConnection } from "../queues/queue-config.js";
import { processResumeJob } from "../processors/resume-processor.js";
import { processJobDiscovery } from "../processors/job-discovery-processor.js";
import { prisma } from "../config/database.js";
import { ResumeRepository } from "../repositories/resume-repository.js";
import { JobRepository } from "../repositories/job-repository.js";
import { incrementMetric, observeDuration } from "../observability/metrics.js";

function recordQueueDuration(job: Job | undefined, jobType: string): void {
  if (job?.processedOn && job.finishedOn) {
    observeDuration("rolescout_queue_job_duration_seconds", job.finishedOn - job.processedOn, { job_type: jobType });
  }
}

function isFinalAttempt(job: Job): boolean {
  return job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
}

function isPermanentFailure(error: Error): boolean {
  return error.name === "UnrecoverableError";
}

export function createWorkers() {
  const resumeWorker = new Worker(QUEUE_NAMES.RESUME_PROCESSING, processResumeJob, {
    connection: createBullRedisConnection(),
    concurrency: env.WORKER_CONCURRENCY,
  });
  const discoveryWorker = new Worker(QUEUE_NAMES.JOB_DISCOVERY, processJobDiscovery, {
    connection: createBullRedisConnection(),
    concurrency: env.WORKER_CONCURRENCY,
  });

  resumeWorker.on("failed", async (job, error) => {
    recordQueueDuration(job, "resume_processing");
    incrementMetric("rolescout_queue_jobs_failed_total", { job_type: "resume_processing" });
    console.error(JSON.stringify({ event: "queue_job_failed", queue: QUEUE_NAMES.RESUME_PROCESSING, jobId: job?.id, attempt: job?.attemptsMade, message: error.message }));
    if (job && (isFinalAttempt(job) || isPermanentFailure(error)) && typeof job.data.resumeId === "string") {
      await new ResumeRepository(prisma).markFailed(job.data.resumeId, "RESUME_PROCESSING_FAILED");
    }
  });
  discoveryWorker.on("failed", async (job, error) => {
    recordQueueDuration(job, "job_discovery");
    incrementMetric("rolescout_queue_jobs_failed_total", { job_type: "job_discovery" });
    console.error(JSON.stringify({ event: "queue_job_failed", queue: QUEUE_NAMES.JOB_DISCOVERY, jobId: job?.id, attempt: job?.attemptsMade, message: error.message }));
    if (job && (isFinalAttempt(job) || isPermanentFailure(error)) && typeof job.data.searchId === "string") {
      await new JobRepository(prisma).markSearchFailed(job.data.searchId, "JOB_DISCOVERY_FAILED");
    }
  });
  resumeWorker.on("completed", (job) => {
    recordQueueDuration(job, "resume_processing");
    incrementMetric("rolescout_queue_jobs_processed_total", { job_type: "resume_processing" });
    console.info(JSON.stringify({ event: "queue_job_completed", queue: QUEUE_NAMES.RESUME_PROCESSING, jobId: job.id }));
  });
  discoveryWorker.on("completed", (job) => {
    recordQueueDuration(job, "job_discovery");
    incrementMetric("rolescout_queue_jobs_processed_total", { job_type: "job_discovery" });
    console.info(JSON.stringify({ event: "queue_job_completed", queue: QUEUE_NAMES.JOB_DISCOVERY, jobId: job.id }));
  });
  return { resumeWorker, discoveryWorker };
}

export async function closeWorkers(workers: ReturnType<typeof createWorkers>): Promise<void> {
  await Promise.all([workers.resumeWorker.close(), workers.discoveryWorker.close()]);
}
