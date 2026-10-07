import type { Job, CandidateProfile } from "@prisma/client";
import { AppError } from "../../utils/errors.js";
import { candidateProfileSchema } from "../../types/profile.js";
import { calculateMatch } from "./matching.engine.js";
import type { MatchResult } from "./matching.types.js";

export interface MatchingRepository {
  findById(jobId: string): Promise<Job | null>;
}

export class MatchingService {
  constructor(
    private readonly profileRepository: { getProfile(userId: string): Promise<CandidateProfile | null> },
    private readonly jobRepository: MatchingRepository,
  ) {}

  async matchJob(userId: string, jobId: string): Promise<MatchResult> {
    const [profile, job] = await Promise.all([this.profileRepository.getProfile(userId), this.jobRepository.findById(jobId)]);
    if (!job) throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
    if (!profile) throw new AppError(404, "PROFILE_NOT_FOUND", "Create a candidate profile before matching jobs.");
    const candidate = candidateProfileSchema.parse(profile);
    return calculateMatch(candidate, job);
  }
}
