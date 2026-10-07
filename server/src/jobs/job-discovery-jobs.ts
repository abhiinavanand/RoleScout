import { Job } from "bullmq";
import { jobDiscoveryQueue } from "../queues/queue-config.js";
import { jobDiscoveryPayloadSchema, type JobDiscoveryPayload } from "./job-payloads.js";
import { getSearchQueueJobId } from "./job-ids.js";

export async function enqueueJobDiscovery(payload: JobDiscoveryPayload): Promise<Job<JobDiscoveryPayload>> {
  const validPayload = jobDiscoveryPayloadSchema.parse(payload);
  return jobDiscoveryQueue.add("discover-jobs", validPayload, { jobId: getSearchQueueJobId(validPayload.searchId) });
}
