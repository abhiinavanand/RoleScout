import { z } from "zod";
import { env } from "../../config/env.js";
import type { JobSearchParams, ProviderJob, ProviderSearchResult } from "../../types/jobs.js";
import { AppError } from "../../utils/errors.js";
import type { JobSearchProvider } from "./job-search-provider.js";

const serpApiResponseSchema = z.object({
  error: z.string().optional(),
  jobs_results: z.array(z.object({
    job_id: z.string().optional(),
    title: z.string().optional(),
    company_name: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    apply_options: z.array(z.object({ link: z.string().url().optional() })).optional(),
    share_link: z.string().url().optional(),
    detected_extensions: z.object({
      posted_at: z.string().optional(),
      schedule_type: z.string().optional(),
      work_from_home: z.boolean().optional(),
    }).optional(),
    extensions: z.array(z.string()).optional(),
    related_links: z.array(z.object({ link: z.string().url().optional() })).optional(),
  }).passthrough()).optional().default([]),
  serpapi_pagination: z.object({ next: z.string().url().optional() }).optional(),
}).passthrough();

export class SerpApiJobSearchProvider implements JobSearchProvider {
  readonly source = "serpapi-google-jobs";

  constructor(private readonly apiKey = env.JOB_SEARCH_API_KEY) {}

  private safeProviderMessage(message: string): string {
    return this.apiKey ? message.replaceAll(this.apiKey, "[REDACTED]") : message;
  }

  private async requestProvider(url: string): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (attempt === 1 && (response.status === 429 || response.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Provider request failed.");
  }

  async searchJobs(params: JobSearchParams): Promise<ProviderSearchResult> {
    if (!this.apiKey) {
      throw new AppError(503, "JOB_PROVIDER_NOT_CONFIGURED", "Job search is not configured. Add a job provider API key.");
    }
    const searchParams = new URLSearchParams({
      engine: "google_jobs",
      q: params.query,
      api_key: this.apiKey,
      start: String((params.page - 1) * params.limit),
    });
    if (params.location) searchParams.set("location", params.location);
    if (params.employmentType) searchParams.set("employment_type", params.employmentType);
    if (params.experienceLevel) searchParams.set("experience_level", params.experienceLevel);
    if (params.remote) searchParams.set("chips", "work_from_home");
    let response: Response;
    try {
      response = await this.requestProvider(`https://serpapi.com/search.json?${searchParams.toString()}`);
    } catch (error) {
      console.error(JSON.stringify({
        event: "job_provider_request_failed",
        provider: this.source,
        keyPresent: true,
        query: params.query,
        location: params.location || undefined,
        page: params.page,
        error: this.safeProviderMessage(error instanceof Error ? error.message : "Unknown provider request error"),
      }));
      throw new AppError(502, "JOB_PROVIDER_UNAVAILABLE", "The job provider is temporarily unavailable.");
    }
    const responseBody = await response.text();
    let parsedResponse: z.infer<typeof serpApiResponseSchema> | undefined;
    try {
      parsedResponse = serpApiResponseSchema.parse(JSON.parse(responseBody));
    } catch {
      console.error(JSON.stringify({
        event: "job_provider_invalid_response",
        provider: this.source,
        status: response.status,
        keyPresent: true,
        query: params.query,
        location: params.location || undefined,
        page: params.page,
      }));
    }
    if (!response.ok || parsedResponse?.error) {
      console.error(JSON.stringify({
        event: "job_provider_rejected_request",
        provider: this.source,
        status: response.status,
        keyPresent: true,
        query: params.query,
        location: params.location || undefined,
        page: params.page,
        error: this.safeProviderMessage(parsedResponse?.error ?? response.statusText),
      }));
      if (response.status === 401 || response.status === 403) {
        throw new AppError(502, "JOB_PROVIDER_AUTH_FAILED", "The configured job provider rejected the request.");
      }
      if (response.status === 429) {
        throw new AppError(429, "JOB_PROVIDER_RATE_LIMITED", "The job provider rate limit was reached. Please try again later.");
      }
      throw new AppError(502, "JOB_PROVIDER_ERROR", "The job provider could not complete the search.");
    }
    if (!parsedResponse) {
      throw new AppError(502, "JOB_PROVIDER_INVALID_RESPONSE", "The job provider returned an invalid response.");
    }
    const jobs = parsedResponse.jobs_results.map((job): ProviderJob => {
      const jobUrl = job.apply_options?.find((option) => option.link)?.link ?? job.share_link ?? "";
      return {
        externalId: job.job_id ?? "",
        title: job.title ?? "",
        companyName: job.company_name ?? "",
        jobUrl,
        location: job.location,
        description: job.description,
        employmentType: job.detected_extensions?.schedule_type,
        workplaceType: job.detected_extensions?.work_from_home ? "Remote" : undefined,
        postedAt: job.detected_extensions?.posted_at,
        sourceUrl: job.related_links?.find((link) => link.link)?.link,
        rawData: {
          title: job.title,
          company_name: job.company_name,
          location: job.location,
          extensions: job.extensions,
        },
      };
    });
    return { jobs, hasNextPage: Boolean(parsedResponse.serpapi_pagination?.next) };
  }
}
