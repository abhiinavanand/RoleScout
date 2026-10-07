import { Job } from "bullmq";
import { resumeQueue } from "../queues/queue-config.js";
import { resumeJobPayloadSchema, type ResumeJobPayload } from "./job-payloads.js";
import { getResumeQueueJobId } from "./job-ids.js";

export async function enqueueResumeProcessing(payload: ResumeJobPayload): Promise<Job<ResumeJobPayload>> {
  const validPayload = resumeJobPayloadSchema.parse(payload);
  return resumeQueue.add("process-resume", validPayload, { jobId: getResumeQueueJobId(validPayload.resumeId) });
}
