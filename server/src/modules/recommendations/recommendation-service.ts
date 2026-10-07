import type { ApplicationStatus, CandidateProfile, Job } from "@prisma/client";
import { AppError } from "../../utils/errors.js";
import { candidateProfileSchema, type CandidateProfileData } from "../../types/profile.js";
import { calculateMatch } from "../matching/matching.engine.js";
import type { MatchResult } from "../matching/matching.types.js";

const MAX_JOBS_EVALUATED = 500;

export type RecommendationState = {
  saved: boolean;
  applicationStatus: ApplicationStatus | null;
};

export type Recommendation = {
  job: Job;
  match: MatchResult;
  state: RecommendationState;
};

export type RecommendationPage = {
  recommendations: Recommendation[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  evaluatedJobs: number;
};

type ProfileStore = { getProfile(userId: string): Promise<CandidateProfile | null> };
type JobStore = { listForRecommendations(limit: number): Promise<Job[]> };
type SavedJobStore = { listJobIdsForUser(userId: string, jobIds: string[]): Promise<string[]> };
type ApplicationStore = { listStatusesForUser(userId: string, jobIds: string[]): Promise<Array<{ jobId: string; status: ApplicationStatus }>> };

export class RecommendationService {
  constructor(
    private readonly profiles: ProfileStore,
    private readonly jobs: JobStore,
    private readonly savedJobs: SavedJobStore,
    private readonly applications: ApplicationStore,
  ) {}

  async listForUser(userId: string, page: number, pageSize: number): Promise<RecommendationPage> {
    const profile = await this.profiles.getProfile(userId);
    if (!profile) throw new AppError(422, "PROFILE_INCOMPLETE", "Complete your profile to get personalized recommendations.");
    const candidate = candidateProfileSchema.parse(profile);
    if (!hasSufficientProfile(candidate)) throw new AppError(422, "PROFILE_INCOMPLETE", "Complete your profile to get personalized recommendations.");

    const jobs = await this.jobs.listForRecommendations(MAX_JOBS_EVALUATED);
    if (jobs.length === 0) {
      return { recommendations: [], page, pageSize, total: 0, totalPages: 0, evaluatedJobs: 0 };
    }

    const [savedJobIds, applicationStates] = await Promise.all([
      this.savedJobs.listJobIdsForUser(userId, jobs.map((job) => job.id)),
      this.applications.listStatusesForUser(userId, jobs.map((job) => job.id)),
    ]);
    const savedJobSet = new Set(savedJobIds);
    const applicationByJobId = new Map(applicationStates.map((application) => [application.jobId, application.status]));
    const ranked = jobs
      .filter((job) => job.title.trim().length > 0 && job.description.trim().length > 0)
      .map((job) => ({
        job,
        match: calculateMatch(candidate, job),
        state: { saved: savedJobSet.has(job.id), applicationStatus: applicationByJobId.get(job.id) ?? null },
      }))
      .sort((left, right) => right.match.score - left.match.score
        || (right.job.postedAt?.getTime() ?? 0) - (left.job.postedAt?.getTime() ?? 0)
        || left.job.id.localeCompare(right.job.id));
    const start = (page - 1) * pageSize;
    return {
      recommendations: ranked.slice(start, start + pageSize),
      page,
      pageSize,
      total: ranked.length,
      totalPages: Math.ceil(ranked.length / pageSize),
      evaluatedJobs: jobs.length,
    };
  }
}

function hasSufficientProfile(profile: CandidateProfileData): boolean {
  return profile.skills.length > 0 || Boolean(profile.headline?.trim()) || profile.experience.length > 0;
}
