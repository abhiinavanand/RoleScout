import { QueueEvents } from "bullmq";
import { bullRedisConnection } from "./queue-config.js";
import { QUEUE_NAMES } from "./queue-names.js";

export const resumeQueueEvents = new QueueEvents(QUEUE_NAMES.RESUME_PROCESSING, { connection: bullRedisConnection });
export const jobDiscoveryQueueEvents = new QueueEvents(QUEUE_NAMES.JOB_DISCOVERY, { connection: bullRedisConnection });

export async function closeQueueEvents(): Promise<void> {
  await Promise.all([resumeQueueEvents.close(), jobDiscoveryQueueEvents.close()]);
}
