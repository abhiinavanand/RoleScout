import { describe, expect, it } from "vitest";
import { MATCH_WEIGHT_TOTAL, MATCH_WEIGHTS } from "./matching.constants.js";
import { calculateMatch } from "./matching.engine.js";
import type { MatchingCandidate, MatchingJob } from "./matching.types.js";

const candidate: MatchingCandidate = {
  headline: "Backend Developer",
  location: "Raipur",
  yearsOfExperience: 2,
  skills: ["JavaScript", "React.js", "Node", "Postgres", "TypeScript"],
  experience: [{ name: "Backend Developer", role: "Node.js Developer", description: "", technologies: [], company: "", location: "", startDate: "", endDate: "" }],
};

function job(overrides: Partial<MatchingJob> = {}): MatchingJob {
  return {
    title: "Backend Engineer",
    location: "Raipur",
    workplaceType: "onsite",
    employmentType: "full-time",
    description: "2-4 years experience. JavaScript, Node.js, PostgreSQL, Docker and Redis.",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    rawData: null,
    ...overrides,
  };
}

describe("calculateMatch", () => {
  it("normalizes aliases and reports matched and missing skills", () => {
    const result = calculateMatch(candidate, job());
    expect(result.breakdown.skills.matched).toEqual(["JavaScript", "Node.js", "PostgreSQL"]);
    expect(result.breakdown.skills.missing).toEqual(["Docker", "Redis"]);
  });

  it("handles a perfect skill match and experience match", () => {
    const result = calculateMatch(candidate, job({ description: "2-4 years experience. JavaScript, Node.js, PostgreSQL, TypeScript." }));
    expect(result.breakdown.skills.score).toBe(100);
    expect(result.breakdown.experience.score).toBe(100);
    expect(result.score).toBeGreaterThan(80);
  });

  it("scores an experience mismatch lower without inventing experience", () => {
    const result = calculateMatch(candidate, job({ description: "5+ years experience. JavaScript." }));
    expect(result.breakdown.experience.score).toBe(25);
    expect(calculateMatch({ ...candidate, yearsOfExperience: null }, job()).breakdown.experience.available).toBe(false);
  });

  it("recognizes entry-level and unrelated roles", () => {
    expect(calculateMatch({ ...candidate, yearsOfExperience: 0 }, job({ title: "Junior Backend Developer", description: "Entry-level role. JavaScript." })).breakdown.experience.score).toBe(100);
    expect(calculateMatch(candidate, job({ title: "Graphic Designer", description: "2 years experience. Photoshop." })).breakdown.role.score).toBe(0);
  });

  it("scores location compatibility and remote work", () => {
    expect(calculateMatch(candidate, job()).breakdown.location.score).toBe(100);
    expect(calculateMatch(candidate, job({ location: "Bengaluru", workplaceType: "onsite" })).breakdown.location.score).toBe(25);
    expect(calculateMatch({ ...candidate, location: "Remote" }, job({ location: null, workplaceType: "remote" })).breakdown.location.score).toBe(100);
  });

  it("does not penalize unavailable optional dimensions", () => {
    const result = calculateMatch(candidate, job({ location: null, workplaceType: null, employmentType: null, salaryCurrency: null }));
    expect(result.breakdown.employmentType.available).toBe(false);
    expect(result.breakdown.salary.available).toBe(false);
    expect(result.score).toBeGreaterThan(0);
  });

  it("uses structured raw skill requirements when available", () => {
    const result = calculateMatch(candidate, job({ rawData: { requiredSkills: ["TS", "Docker"] }, description: "2 years experience." }));
    expect(result.breakdown.skills.matched).toEqual(["TypeScript"]);
    expect(result.breakdown.skills.missing).toEqual(["Docker"]);
  });

  it("is deterministic and clamps scores", () => {
    const first = calculateMatch(candidate, job());
    expect(calculateMatch(candidate, job())).toEqual(first);
    expect(first.score).toBeGreaterThanOrEqual(0);
    expect(first.score).toBeLessThanOrEqual(100);
  });

  it("keeps centralized weights valid", () => {
    expect(MATCH_WEIGHT_TOTAL).toBe(100);
    expect(Object.values(MATCH_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });
});
