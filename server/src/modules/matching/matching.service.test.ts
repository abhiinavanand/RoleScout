import { describe, expect, it, vi } from "vitest";
import { MatchingService } from "./matching.service.js";

describe("MatchingService", () => {
  const profile = {
    id: "profile_1",
    userId: "user_1",
    headline: "Backend Developer",
    summary: null,
    location: "Raipur",
    email: null,
    phone: null,
    yearsOfExperience: 2,
    education: [],
    skills: ["Node.js"],
    experience: [{ name: "Backend Developer", description: "", technologies: [], company: "", role: "Backend Developer", location: "", startDate: "", endDate: "" }],
    projects: [],
    certifications: [],
    links: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const job = {
    id: "job_1",
    title: "Backend Engineer",
    location: "Raipur",
    workplaceType: "onsite",
    employmentType: "full-time",
    description: "2 years experience. Node.js.",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    rawData: null,
  };

  it("loads only the authenticated user's profile and requested job", async () => {
    const getProfile = vi.fn().mockResolvedValue(profile);
    const findById = vi.fn().mockResolvedValue(job);
    const result = await new MatchingService({ getProfile }, { findById }).matchJob("user_1", "job_1");
    expect(getProfile).toHaveBeenCalledWith("user_1");
    expect(findById).toHaveBeenCalledWith("job_1");
    expect(result.score).toBeGreaterThan(0);
  });

  it("rejects matching when no profile exists", async () => {
    const service = new MatchingService({ getProfile: vi.fn().mockResolvedValue(null) }, { findById: vi.fn().mockResolvedValue(job) });
    await expect(service.matchJob("user_1", "job_1")).rejects.toMatchObject({ code: "PROFILE_NOT_FOUND", statusCode: 404 });
  });
});
