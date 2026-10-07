import type { CandidateProfileData } from "../types/profile.js";
import { candidateProfileSchema } from "../types/profile.js";
import { normalizeSkills } from "./skill-normalizer.js";

const knownSkills: Record<string, string[]> = {
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "react.js", "reactjs"],
  "Node.js": ["node", "node.js", "nodejs"],
  PostgreSQL: ["postgres", "postgresql", "postgre sql"],
  Redis: ["redis"],
  Python: ["python"],
  Java: ["java"],
  Go: ["go"],
  AWS: ["aws"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes"],
  Express: ["express"],
  "Next.js": ["next.js", "nextjs"],
  MongoDB: ["mongodb", "mongo"],
  GraphQL: ["graphql"],
  REST: ["rest"],
  Git: ["git"],
};

export function parseResumeDeterministically(text: string): CandidateProfileData {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0]?.toLowerCase() ?? null;
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;
  const urls = [...text.matchAll(/https?:\/\/[^\s<>)]+/gi)].map((match) => match[0].replace(/[.,]+$/, ""));
  const skills = normalizeSkills(Object.entries(knownSkills)
    .filter(([, aliases]) => aliases.some((alias) => matchesAlias(text, alias)))
    .map(([skill]) => skill));
  const headline = lines.find((line) => /developer|engineer|designer|manager|analyst|scientist/i.test(line)) ?? null;
  const summaryStart = lines.findIndex((line) => /^summary|^profile|^about me$/i.test(line));
  const summary = summaryStart >= 0 && lines[summaryStart + 1] ? lines[summaryStart + 1] : null;
  const links = urls.map((url) => ({ label: /github/i.test(url) ? "GitHub" : /linkedin/i.test(url) ? "LinkedIn" : "Portfolio", url }));
  return candidateProfileSchema.parse({
    headline,
    summary,
    email,
    phone,
    skills,
    links,
  });
}

function matchesAlias(text: string, alias: string): boolean {
  const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = alias.length <= 2 ? "(?<![A-Za-z.])" : "\\b";
  return new RegExp(`${boundary}${escapedAlias}\\b`, "i").test(text);
}
