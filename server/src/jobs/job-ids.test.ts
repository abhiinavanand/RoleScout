import { describe, expect, it } from "vitest";
import { getResumeQueueJobId, getSearchQueueJobId } from "./job-ids.js";

describe("deterministic BullMQ job IDs", () => {
  it("creates the same safe search job ID for the same search", () => {
    expect(getSearchQueueJobId("search_1")).toBe("search-search_1");
    expect(getSearchQueueJobId("search_1")).toBe(getSearchQueueJobId("search_1"));
    expect(getSearchQueueJobId("search_1")).not.toContain(":");
  });

  it("creates the same safe resume job ID for the same resume", () => {
    expect(getResumeQueueJobId("resume_1")).toBe("resume-resume_1");
    expect(getResumeQueueJobId("resume_1")).toBe(getResumeQueueJobId("resume_1"));
    expect(getResumeQueueJobId("resume_1")).not.toContain(":");
  });
});
