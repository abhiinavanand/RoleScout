import type { ApplicationStatus } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import { ApplicationRepository } from "../repositories/application-repository.js";
import { JobRepository } from "../repositories/job-repository.js";

export type ApplicationStore = Pick<ApplicationRepository, "findByUserAndJob" | "create" | "findByUser" | "findByIdForUser" | "updateForUser" | "deleteForUser">;
export type JobStore = Pick<JobRepository, "findById">;

export class ApplicationService {
  constructor(private readonly applications: ApplicationStore, private readonly jobs: JobStore) {}

  async create(userId: string, input: { jobId: string; status: ApplicationStatus; appliedAt?: Date | null; notes?: string | null }) {
    if (!await this.jobs.findById(input.jobId)) throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
    if (await this.applications.findByUserAndJob(userId, input.jobId)) throw new AppError(409, "APPLICATION_EXISTS", "You are already tracking this job.");
    try {
      return await this.applications.create(userId, { jobId: input.jobId, status: input.status, ...normalizeApplicationInput(input) });
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new AppError(409, "APPLICATION_EXISTS", "You are already tracking this job.");
      throw error;
    }
  }

  async list(userId: string, filters: { status?: ApplicationStatus; page: number; pageSize: number }) {
    const [items, total] = await this.applications.findByUser(userId, filters);
    return { items, page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.ceil(total / filters.pageSize) };
  }

  async get(userId: string, id: string) {
    const application = await this.applications.findByIdForUser(id, userId);
    if (!application) throw new AppError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    return application;
  }

  async update(userId: string, id: string, data: { status?: ApplicationStatus; appliedAt?: Date | null; notes?: string | null }) {
    const existing = await this.applications.findByIdForUser(id, userId);
    if (!existing) throw new AppError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    const application = await this.applications.updateForUser(id, userId, normalizeApplicationInput({ ...data, currentAppliedAt: existing.appliedAt }));
    if (!application) throw new AppError(404, "APPLICATION_NOT_FOUND", "Application not found.");
    return application;
  }

  async delete(userId: string, id: string) {
    if (!await this.applications.deleteForUser(id, userId)) throw new AppError(404, "APPLICATION_NOT_FOUND", "Application not found.");
  }

}

function normalizeApplicationInput(input: {
  status?: ApplicationStatus;
  appliedAt?: Date | null;
  notes?: string | null;
  currentAppliedAt?: Date | null;
}) {
  const normalizedNotes = input.notes === undefined ? undefined : input.notes?.trim() || null;
  const appliedAt = input.appliedAt == null && input.status === "APPLIED" && !input.currentAppliedAt
    ? new Date()
    : input.appliedAt;
  return {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(appliedAt !== undefined ? { appliedAt } : {}),
    ...(normalizedNotes !== undefined ? { notes: normalizedNotes } : {}),
  };
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
