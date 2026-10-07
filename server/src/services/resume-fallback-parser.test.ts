import { describe, expect, it } from "vitest";
import { parseResumeDeterministically } from "./resume-fallback-parser.js";

describe("deterministic resume parser", () => {
  it("extracts obvious contact details, skills, and links without AI", () => {
    const profile = parseResumeDeterministically(`Ada Lovelace
Senior Node.js Engineer
ada@example.com
+1 555 123 4567
Skills: ReactJS, Postgres, TypeScript
https://github.com/ada`);

    expect(profile.email).toBe("ada@example.com");
    expect(profile.skills).toEqual(["TypeScript", "React", "Node.js", "PostgreSQL"]);
    expect(profile.links).toEqual([{ label: "GitHub", url: "https://github.com/ada" }]);
  });
});
