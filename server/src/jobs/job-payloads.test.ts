import { describe, expect, it } from "vitest";
import { jobDiscoveryPayloadSchema, resumeJobPayloadSchema } from "./job-payloads.js";

describe("queue payloads", () => {
  it("accepts minimal ID-only payloads", () => {
    expect(resumeJobPayloadSchema.parse({ resumeId: "resume_1" })).toEqual({ resumeId: "resume_1" });
    expect(jobDiscoveryPayloadSchema.parse({ searchId: "search_1" })).toEqual({ searchId: "search_1" });
  });

  it("rejects payloads containing no domain ID", () => {
    expect(() => resumeJobPayloadSchema.parse({})).toThrow();
    expect(() => jobDiscoveryPayloadSchema.parse({ searchId: "" })).toThrow();
  });

  it("keeps queue payloads ID-only without nullable search filters", () => {
    const payload = jobDiscoveryPayloadSchema.parse({ searchId: "search_1" });
    expect(payload).toEqual({ searchId: "search_1" });
    expect(JSON.stringify(payload)).not.toContain("null");
  });
});
