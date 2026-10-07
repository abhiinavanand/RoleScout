import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { QUEUE_NAMES } from "./queue-names.js";

export const bullRedisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
export function createBullRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
}
export const queueOptions = {
  connection: bullRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 2_000 },
    removeOnComplete: { age: 86_400, count: 1000 },
    removeOnFail: { age: 604_800, count: 1000 },
  },
};

export const resumeQueue = new Queue(QUEUE_NAMES.RESUME_PROCESSING, queueOptions);
export const jobDiscoveryQueue = new Queue(QUEUE_NAMES.JOB_DISCOVERY, queueOptions);

export async function closeQueues(): Promise<void> {
  await Promise.all([resumeQueue.close(), jobDiscoveryQueue.close()]);
}
