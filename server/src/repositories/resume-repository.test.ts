import { describe, expect, it, vi } from "vitest";
import { ResumeRepository } from "./resume-repository.js";

describe("ResumeRepository.deleteForUser", () => {
  it("deletes only when both resume and user IDs match", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const repository = new ResumeRepository({ resume: { deleteMany } } as never);

    await expect(repository.deleteForUser("resume_a", "user_a")).resolves.toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "resume_a", userId: "user_a" } });
  });

  it("leaves another user's resume intact", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const repository = new ResumeRepository({ resume: { deleteMany } } as never);

    await expect(repository.deleteForUser("resume_b", "user_a")).resolves.toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "resume_b", userId: "user_a" } });
  });

  it("safely handles a nonexistent resume", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const repository = new ResumeRepository({ resume: { deleteMany } } as never);

    await expect(repository.deleteForUser("missing", "user_a")).resolves.toBe(false);
  });
});
