import { describe, expect, it } from "vitest";
import { JobSearchService } from "./services/job-search-service.js";
import type { JobSearchProvider } from "./providers/job-search/job-search-provider.js";

describe("critical workflow integration boundaries", () => {
  it("creates, processes, normalizes, and completes a queued job search", async () => {
    const statuses: string[] = [];
    const repository = {
      createSearch: async () => ({ id: "search-1", processingStatus: "PENDING" }),
      findSearchById: async () => ({
        id: "search-1",
        query: "Backend Developer",
        location: "Bangalore",
        filters: { remote: false, page: 1, limit: 20 },
      }),
      markSearchProcessing: async () => {
        statuses.push("PROCESSING");
        return {};
      },
      upsertMany: async (jobs: Array<{ title: string; jobUrl: string }>) => jobs.map((job, index) => ({
        ...job,
        id: `job-${index}`,
      })),
      markSearchCompleted: async () => {
        statuses.push("COMPLETED");
        return {};
      },
    };
    const provider: JobSearchProvider = {
      source: "test-provider",
      searchJobs: async () => ({
        jobs: [{
          externalId: "external-1",
          title: "Backend Developer",
          companyName: "Example",
          jobUrl: "https://example.com/jobs/1",
          location: "Bangalore",
          description: "Node.js and PostgreSQL",
        }],
        hasNextPage: false,
      }),
    };

    const result = await new JobSearchService(repository, provider).process("search-1");

    expect(statuses).toEqual(["PROCESSING", "COMPLETED"]);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].title).toBe("Backend Developer");
  });
});
