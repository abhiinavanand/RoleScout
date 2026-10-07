import { describe, expect, it } from "vitest";
import { normalizeStoredSearchFilters, toStoredSearchFilters } from "./search-filters.js";

describe("search filter persistence", () => {
  it.each([
    [{}, { page: 1, limit: 20 }],
    [{ employmentType: "Full-time" }, { employmentType: "Full-time", page: 1, limit: 20 }],
    [{ experienceLevel: "Mid-level" }, { experienceLevel: "Mid-level", page: 1, limit: 20 }],
    [{ employmentType: "Full-time", experienceLevel: "Mid-level" }, { employmentType: "Full-time", experienceLevel: "Mid-level", page: 1, limit: 20 }],
  ])("stores provided filters without null values", (optionalFilters, expected) => {
    expect(toStoredSearchFilters({
      query: "Backend Developer",
      location: "Banglore",
      remote: false,
      page: 1,
      limit: 20,
      ...optionalFilters,
    })).toEqual({ remote: false, ...expected });
  });

  it("normalizes legacy nullable database filters before strict validation", () => {
    expect(normalizeStoredSearchFilters({
      remote: false,
      employmentType: null,
      experienceLevel: null,
      page: 1,
      limit: 20,
    })).toEqual({ remote: false, page: 1, limit: 20 });
  });
});
