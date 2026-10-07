import { describe, expect, it, vi } from "vitest";
import { SerpApiJobSearchProvider } from "./serpapi-provider.js";

describe("SerpApiJobSearchProvider", () => {
  it("normalizes a provider response into provider jobs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      jobs_results: [{
        job_id: "job-1",
        title: "Backend Engineer",
        company_name: "Acme",
        location: "Remote",
        description: "Build APIs",
        apply_options: [{ link: "https://example.com/apply" }],
        detected_extensions: { work_from_home: true, schedule_type: "Full-time" },
      }],
      serpapi_pagination: { next: "https://serpapi.com/next" },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await new SerpApiJobSearchProvider("test-key").searchJobs({ query: "backend", location: "", page: 1, limit: 20 });
    expect(result.jobs[0]).toMatchObject({ externalId: "job-1", title: "Backend Engineer", workplaceType: "Remote" });
    expect(result.hasNextPage).toBe(true);
    vi.unstubAllGlobals();
  });

  it("omits absent optional filters and forwards supplied filters", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ jobs_results: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ jobs_results: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new SerpApiJobSearchProvider("test-key").searchJobs({
      query: "Backend Developer",
      location: "Banglore",
      remote: false,
      page: 1,
      limit: 20,
    });
    const withoutFilters = new URL(fetchMock.mock.calls[0][0] as string);
    expect(withoutFilters.searchParams.has("employment_type")).toBe(false);
    expect(withoutFilters.searchParams.has("experience_level")).toBe(false);

    await new SerpApiJobSearchProvider("test-key").searchJobs({
      query: "Backend Developer",
      location: "Banglore",
      employmentType: "Full-time",
      experienceLevel: "Mid-level",
      page: 1,
      limit: 20,
    });
    const withFilters = new URL(fetchMock.mock.calls[1][0] as string);
    expect(withFilters.searchParams.get("employment_type")).toBe("Full-time");
    expect(withFilters.searchParams.get("experience_level")).toBe("Mid-level");
    vi.unstubAllGlobals();
  });

  it("maps provider failures to safe application errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(new SerpApiJobSearchProvider("test-key").searchJobs({ query: "backend", location: "", page: 1, limit: 20 }))
      .rejects.toMatchObject({ statusCode: 429, code: "JOB_PROVIDER_RATE_LIMITED" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("logs the safe upstream error for rejected requests", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "Unsupported `Banglore` location - location parameter.",
    }), { status: 400 })));

    await expect(new SerpApiJobSearchProvider("test-key").searchJobs({
      query: "Backend Developer",
      location: "Banglore",
      page: 1,
      limit: 20,
    })).rejects.toMatchObject({ code: "JOB_PROVIDER_ERROR", statusCode: 502 });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Unsupported `Banglore` location"));
    expect(errorSpy).toHaveBeenCalledWith(expect.not.stringContaining("test-key"));
    errorSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
