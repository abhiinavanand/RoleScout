import { z } from "zod";

export const applicationStatusSchema = z.enum(["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

const appliedAtSchema = z.string().datetime().nullable().optional();
export const createApplicationSchema = z.object({
  jobId: z.string().trim().min(1).max(100),
  status: applicationStatusSchema.default("SAVED"),
  appliedAt: appliedAtSchema,
  notes: z.string().trim().max(10000).nullable().optional(),
});
export const updateApplicationSchema = z.object({
  status: applicationStatusSchema.optional(),
  appliedAt: appliedAtSchema,
  notes: z.string().trim().max(10000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export const applicationListSchema = z.object({
  status: applicationStatusSchema.optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export const applicationIdSchema = z.object({ id: z.string().trim().min(1).max(100) });
