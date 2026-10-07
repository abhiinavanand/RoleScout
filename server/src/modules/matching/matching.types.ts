import type { CandidateProfileData } from "../../types/profile.js";
import type { Job } from "@prisma/client";

export type MatchingCandidate = Pick<CandidateProfileData, "headline" | "location" | "yearsOfExperience" | "skills" | "experience">;
export type MatchingJob = Pick<Job, "title" | "location" | "workplaceType" | "employmentType" | "description" | "salaryMin" | "salaryMax" | "salaryCurrency" | "rawData">;

export type MatchDimension = {
  score: number | null;
  weight: number;
  available: boolean;
  reason: string;
};

export type SkillsMatchDimension = MatchDimension & {
  matched: string[];
  missing: string[];
};

export type MatchBreakdown = {
  skills: SkillsMatchDimension;
  experience: MatchDimension;
  role: MatchDimension;
  location: MatchDimension;
  employmentType: MatchDimension;
  salary: MatchDimension;
};

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdown;
};

export type MatchingProfile = MatchingCandidate;
export type MatchingJobInput = MatchingJob;
