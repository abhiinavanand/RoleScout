import { describe, expect, it, vi } from "vitest";
import { ApplicationService } from "./application-service.js";

describe("ApplicationService", () => {
  const jobRepository = { findById: vi.fn().mockResolvedValue({ id: "job_1" }) };
  const applicationRepository = {
    findByUserAndJob: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "application_1" }),
    findByUser: vi.fn().mockResolvedValue([[], 0]),
    findByIdForUser: vi.fn().mockResolvedValue(null),
    updateForUser: vi.fn(),
    deleteForUser: vi.fn().mockResolvedValue(true),
  };
  const service = new ApplicationService(applicationRepository, jobRepository);

  it("creates an application for an existing job", async () => {
    await service.create("user_1", { jobId: "job_1", status: "APPLIED" });
    expect(applicationRepository.create).toHaveBeenCalledWith("user_1", expect.objectContaining({ jobId: "job_1", status: "APPLIED", appliedAt: expect.any(Date) }));
  });

  it("defaults an application to SAVED without inventing an applied date", async () => {
    await service.create("user_1", { jobId: "job_1", status: "SAVED", notes: "  follow up  " });
    expect(applicationRepository.create).toHaveBeenLastCalledWith("user_1", { jobId: "job_1", status: "SAVED", notes: "follow up" });
  });

  it("returns a valid empty result for users with no applications", async () => {
    applicationRepository.findByUser.mockResolvedValueOnce([[], 0]);
    await expect(service.list("user_1", { page: 1, pageSize: 50 })).resolves.toEqual({
      items: [],
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0,
    });
  });

  it("sets an applied date when moving to APPLIED and preserves it later", async () => {
    applicationRepository.findByIdForUser.mockResolvedValueOnce({ id: "application_1", appliedAt: null });
    applicationRepository.updateForUser.mockResolvedValue({ id: "application_1", status: "APPLIED" });
    await service.update("user_1", "application_1", { status: "APPLIED" });
    const updateInput = applicationRepository.updateForUser.mock.calls.at(-1)?.[2];
    expect(updateInput.status).toBe("APPLIED");
    expect(updateInput.appliedAt).toBeInstanceOf(Date);

    const appliedDate = new Date("2026-01-02T00:00:00.000Z");
    applicationRepository.findByIdForUser.mockResolvedValueOnce({ id: "application_1", appliedAt: appliedDate });
    await service.update("user_1", "application_1", { status: "INTERVIEW" });
    expect(applicationRepository.updateForUser.mock.calls.at(-1)?.[2]).toEqual({ status: "INTERVIEW" });
  });

  it("rejects nonexistent jobs and duplicates", async () => {
    jobRepository.findById.mockResolvedValueOnce(null);
    await expect(service.create("user_1", { jobId: "missing", status: "APPLIED" })).rejects.toMatchObject({ statusCode: 404 });
    jobRepository.findById.mockResolvedValueOnce({ id: "job_1" });
    applicationRepository.findByUserAndJob.mockResolvedValueOnce({ id: "existing" });
    await expect(service.create("user_1", { jobId: "job_1", status: "APPLIED" })).rejects.toMatchObject({ statusCode: 409 });
  });

  it("enforces ownership for updates and deletes", async () => {
    applicationRepository.updateForUser.mockResolvedValueOnce(null);
    await expect(service.update("other_user", "application_1", { status: "INTERVIEW" })).rejects.toMatchObject({ statusCode: 404 });
    applicationRepository.deleteForUser.mockResolvedValueOnce(false);
    await expect(service.delete("other_user", "application_1")).rejects.toMatchObject({ statusCode: 404 });
  });
});
