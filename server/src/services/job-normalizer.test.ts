import { describe, expect, it } from "vitest";
import { deduplicateJobs, normalizeProviderJob } from "./job-normalizer.js";

describe("job normalization", () => {
  it("normalizes whitespace and preserves missing values as null", () => {
    const job = normalizeProviderJob({
      externalId: "abc",
      title: "  Backend   Engineer ",
      companyName: " Acme ",
      jobUrl: "https://example.com/jobs/abc",
      description: " Build APIs ",
    }, "test");
    expect(job.title).toBe("Backend Engineer");
    expect(job.companyName).toBe("Acme");
    expect(job.location).toBeNull();
    expect(job.salaryMin).toBeNull();
  });

  it("deduplicates provider IDs and equivalent fallback fingerprints", () => {
    const first = normalizeProviderJob({ externalId: "abc", title: "Engineer", companyName: "Acme", location: "Remote", jobUrl: "https://example.com/a" }, "test");
    const sameId = { ...first, description: "updated" };
    const fallbackDuplicate = normalizeProviderJob({ externalId: "", title: "Engineer", companyName: "Acme", location: "Remote", jobUrl: "https://example.com/a" }, "test");
    const distinct = normalizeProviderJob({ externalId: "def", title: "Engineer", companyName: "Other", location: "Remote", jobUrl: "https://example.com/b" }, "test");
    expect(deduplicateJobs([first, sameId, fallbackDuplicate, distinct])).toHaveLength(2);
  });
});
