import { describe, expect, it } from "vitest";
import { planJobSearch } from "./search-planner.js";

describe("search planner", () => {
  it("extracts a natural-language location when no location field is supplied", () => {
    const planned = planJobSearch({ query: "backend developer in Bangalore", location: "", page: 1, limit: 20 });
    expect(planned.query).toBe("backend developer");
    expect(planned.location).toBe("Bangalore");
  });
});
