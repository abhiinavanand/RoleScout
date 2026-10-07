import { normalizeSkill, normalizeSkills } from "../../services/skill-normalizer.js";

const knownSkillTerms: Array<[string, string]> = [
  ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["node.js", "Node.js"], ["react", "React"], ["postgresql", "PostgreSQL"], ["sql", "SQL"], ["docker", "Docker"], ["redis", "Redis"],
  ["aws", "AWS"], ["kubernetes", "Kubernetes"], ["python", "Python"], ["java", "Java"], ["express", "Express"], ["graphql", "GraphQL"], ["rest", "REST"], ["rest apis", "REST APIs"],
];

const stopWords = new Set(["a", "an", "and", "developer", "engineer", "for", "full", "in", "of", "the", "to"]);

export function extractJobSkills(job: { rawData: unknown; title: string; description: string }): string[] {
  const rawSkills = readStringArray(job.rawData, ["requiredSkills", "skills", "technologies"]);
  if (rawSkills.length > 0) return normalizeSkills(rawSkills);

  const text = `${job.title} ${job.description}`.toLowerCase();
  return normalizeSkills(knownSkillTerms.filter(([term]) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text)).map(([, label]) => label));
}

export function roleTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/node\.js/g, "node")
      .replace(/[^a-z0-9+#.]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token)),
  );
}

export function parseExperienceRange(text: string): { minimum: number; maximum: number | null } | null {
  const range = text.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(?:years?|yrs?)/i);
  if (range) return { minimum: Number(range[1]), maximum: Number(range[2]) };
  const minimum = text.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (minimum) return { minimum: Number(minimum[1]), maximum: null };
  if (/\b(entry[- ]level|fresher|internship|intern)\b/i.test(text)) return { minimum: 0, maximum: 1 };
  return null;
}

function readStringArray(value: unknown, keys: string[]): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate) && candidate.every((item) => typeof item === "string")) return candidate;
  }
  return [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function canonicalizeSkillList(skills: string[]): string[] {
  return normalizeSkills(skills.map(normalizeSkill));
}
