import { apiRequest } from "./client";

export type Job = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  companyName: string;
  companyUrl: string | null;
  jobUrl: string;
  location: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  postedAt: string | null;
  expiresAt: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobSearchInput = {
  query: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
};

export type Pagination = { page: number; limit: number; hasNextPage: boolean; total?: number };
export type SearchResponse = { jobs: Job[]; pagination: Pagination };
export type MatchDimension = { score: number | null; weight: number; available: boolean; reason: string };
export type SkillsMatchDimension = MatchDimension & { matched: string[]; missing: string[] };
export type MatchResult = {
  score: number;
  breakdown: {
    skills: SkillsMatchDimension;
    experience: MatchDimension;
    role: MatchDimension;
    location: MatchDimension;
    employmentType: MatchDimension;
    salary: MatchDimension;
  };
};
export type ApplicationStatus = "SAVED" | "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN";
export type Recommendation = { job: Job; match: MatchResult; state: { saved: boolean; applicationStatus: ApplicationStatus | null } };

export const searchJobs = (input: JobSearchInput) => apiRequest<{ searchId: string; processingStatus: string; jobId?: string }>("/jobs/search", { method: "POST", body: JSON.stringify(input) });
export const getSearchStatus = (id: string) => apiRequest<{ id: string; processingStatus: string; processingErrorCode: string | null }>(`/searches/${id}/status`);
export const listJobs = (params: Record<string, string | number | undefined>) => apiRequest<SearchResponse>(`/jobs?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}`);
export const getJob = (id: string) => apiRequest<{ job: Job }>(`/jobs/${id}`);
export const getJobMatch = (id: string) => apiRequest<MatchResult>(`/jobs/${id}/match`);
export const listRecommendations = (page = 1, pageSize = 20) => apiRequest<{ recommendations: Recommendation[]; pagination: { page: number; pageSize: number; total: number; totalPages: number; evaluatedJobs: number } }>(`/recommendations/jobs?page=${page}&pageSize=${pageSize}`);
export const listSearches = () => apiRequest<{ searches: Array<{ id: string; query: string; location: string | null; filters: Record<string, unknown>; processingStatus: string; createdAt: string }> }>("/searches");
export const deleteSearch = (id: string) => apiRequest<{ deleted: boolean }>(`/searches/${id}`, { method: "DELETE" });
