import { z } from "zod";

export const resumeJobPayloadSchema = z.object({ resumeId: z.string().min(1) });
export const jobDiscoveryPayloadSchema = z.object({ searchId: z.string().min(1) });
export type ResumeJobPayload = z.infer<typeof resumeJobPayloadSchema>;
export type JobDiscoveryPayload = z.infer<typeof jobDiscoveryPayloadSchema>;
