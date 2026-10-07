import { describe, expect, it } from "vitest";
import { normalizeSkill, normalizeSkills } from "./skill-normalizer.js";

describe("skill normalization", () => {
  it("maps known aliases to canonical names", () => {
    expect(normalizeSkill("ReactJS")).toBe("React");
    expect(normalizeSkill("Postgres")).toBe("PostgreSQL");
    expect(normalizeSkill("TS")).toBe("TypeScript");
  });

  it("removes duplicate canonical skills", () => {
    expect(normalizeSkills(["React.js", "React", " TS "])).toEqual(["React", "TypeScript"]);
  });
});
