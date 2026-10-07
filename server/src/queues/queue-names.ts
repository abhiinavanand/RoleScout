export const QUEUE_NAMES = {
  RESUME_PROCESSING: "resume-processing",
  JOB_DISCOVERY: "job-discovery",
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
