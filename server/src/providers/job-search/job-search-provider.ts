import type { JobSearchParams, ProviderSearchResult } from "../../types/jobs.js";

export interface JobSearchProvider {
  readonly source: string;
  searchJobs(params: JobSearchParams): Promise<ProviderSearchResult>;
}
