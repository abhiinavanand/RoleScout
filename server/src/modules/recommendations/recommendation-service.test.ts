import { describe, expect, it, vi } from "vitest";
import { RecommendationService } from "./recommendation-service.js";

const profile = {
  id: "profile_1", userId: "user_1", headline: "Backend Developer", summary: null, location: "Raipur",
  email: null, phone: null, yearsOfExperience: 2, education: [], skills: ["Node.js"],
  experience: [{ name: "Backend Developer", description: "", technologies: [], company: "", role: "Backend Developer", location: "", startDate: "", endDate: "" }],
  projects: [], certifications: [], links: [], createdAt: new Date(), updatedAt: new Date(),
};

function job(id: string, title: string, postedAt: Date | null = null) {
  return { id, title, location: "Raipur", workplaceType: "onsite", employmentType: "full-time", description: "2 years experience. Node.js.", salaryMin: null, salaryMax: null, salaryCurrency: null, rawData: null, postedAt };
}

function service() {
  return new RecommendationService(
    { getProfile: vi.fn().mockResolvedValue(profile) },
    { listForRecommendations: vi.fn().mockResolvedValue([job("job_1", "Backend Engineer"), job("job_2", "Graphic Designer")]) },
    { listJobIdsForUser: vi.fn().mockResolvedValue(["job_1"]) },
    { listStatusesForUser: vi.fn().mockResolvedValue([{ jobId: "job_1", status: "INTERVIEW" }]) },
  );
}

describe("RecommendationService", () => {
  it("ranks persisted jobs and attaches saved/application state", async () => {
    const result = await service().listForUser("user_1", 1, 20);
    expect(result.recommendations[0].job.id).toBe("job_1");
    expect(result.recommendations[0].state).toEqual({ saved: true, applicationStatus: "INTERVIEW" });
    expect(result.recommendations[1].state).toEqual({ saved: false, applicationStatus: null });
  });

  it("rejects missing or insufficient profiles", async () => {
    const missing = new RecommendationService({ getProfile: vi.fn().mockResolvedValue(null) }, { listForRecommendations: vi.fn() }, { listJobIdsForUser: vi.fn() }, { listStatusesForUser: vi.fn() });
    await expect(missing.listForUser("user_1", 1, 20)).rejects.toMatchObject({ code: "PROFILE_INCOMPLETE" });
    const incomplete = new RecommendationService({ getProfile: vi.fn().mockResolvedValue({ ...profile, headline: null, skills: [], experience: [] }) }, { listForRecommendations: vi.fn() }, { listJobIdsForUser: vi.fn() }, { listStatusesForUser: vi.fn() });
    await expect(incomplete.listForUser("user_1", 1, 20)).rejects.toMatchObject({ code: "PROFILE_INCOMPLETE" });
  });

  it("paginates ranked results and returns a valid empty page", async () => {
    const empty = new RecommendationService({ getProfile: vi.fn().mockResolvedValue(profile) }, { listForRecommendations: vi.fn().mockResolvedValue([]) }, { listJobIdsForUser: vi.fn() }, { listStatusesForUser: vi.fn() });
    await expect(empty.listForUser("user_1", 1, 20)).resolves.toMatchObject({ recommendations: [], total: 0, totalPages: 0 });
    await expect(service().listForUser("user_1", 2, 1)).resolves.toMatchObject({ page: 2, pageSize: 1, total: 2, recommendations: [{ job: { id: "job_2" } }] });
  });
});
