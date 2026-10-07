import { MATCH_WEIGHT_TOTAL, MATCH_WEIGHTS } from "./matching.constants.js";
import type { MatchDimension, MatchResult, MatchingCandidate, MatchingJob, SkillsMatchDimension } from "./matching.types.js";
import { canonicalizeSkillList, extractJobSkills, parseExperienceRange, roleTokens } from "./matching.utils.js";

export function calculateMatch(candidate: MatchingCandidate, job: MatchingJob): MatchResult {
  const breakdown = {
    skills: calculateSkills(candidate, job),
    experience: calculateExperience(candidate, job),
    role: calculateRole(candidate, job),
    location: calculateLocation(candidate, job),
    employmentType: unavailable(MATCH_WEIGHTS.employmentType, "Candidate employment preferences are not available."),
    salary: unavailable(MATCH_WEIGHTS.salary, "Candidate salary preferences are not available."),
  };

  const dimensions = Object.values(breakdown);
  const availableWeight = dimensions.filter((dimension) => dimension.available).reduce((total, dimension) => total + dimension.weight, 0);
  const weightedScore = dimensions.reduce((total, dimension) => total + (dimension.available ? (dimension.score ?? 0) * dimension.weight : 0), 0);
  const score = availableWeight === 0 ? 0 : Math.round(weightedScore / availableWeight);
  return { score: clamp(score), breakdown };
}

function calculateSkills(candidate: MatchingCandidate, job: MatchingJob): SkillsMatchDimension {
  const candidateSkills = canonicalizeSkillList(candidate.skills);
  const requiredSkills = extractJobSkills(job);
  if (requiredSkills.length === 0) {
    return { ...unavailable(MATCH_WEIGHTS.skills, "The job does not provide structured or recognizable skill requirements."), matched: [], missing: [] };
  }
  const candidateSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const matched = requiredSkills.filter((skill) => candidateSet.has(skill.toLowerCase()));
  const missing = requiredSkills.filter((skill) => !candidateSet.has(skill.toLowerCase()));
  return {
    score: Math.round((matched.length / requiredSkills.length) * 100),
    weight: MATCH_WEIGHTS.skills,
    available: true,
    reason: `${matched.length} of ${requiredSkills.length} recognized job skills match.`,
    matched,
    missing,
  };
}

function calculateExperience(candidate: MatchingCandidate, job: MatchingJob): MatchDimension {
  if (candidate.yearsOfExperience === null) return unavailable(MATCH_WEIGHTS.experience, "Candidate experience is unavailable.");
  const range = parseExperienceRange(`${job.title} ${job.description}`);
  if (!range) return unavailable(MATCH_WEIGHTS.experience, "The job does not provide a recognizable experience requirement.");
  const years = candidate.yearsOfExperience;
  if (years >= range.minimum && (range.maximum === null || years <= range.maximum)) {
    return available(MATCH_WEIGHTS.experience, 100, `Candidate experience matches the ${range.minimum}${range.maximum === null ? "+" : `-${range.maximum}`} year requirement.`);
  }
  const distance = years < range.minimum ? range.minimum - years : years - (range.maximum ?? range.minimum);
  return available(MATCH_WEIGHTS.experience, Math.max(0, 100 - distance * 25), `Candidate has ${years} years versus the stated ${range.minimum}${range.maximum === null ? "+" : `-${range.maximum}`} year requirement.`);
}

function calculateRole(candidate: MatchingCandidate, job: MatchingJob): MatchDimension {
  const candidateRoleText = [candidate.headline ?? "", ...candidate.experience.map((item) => `${item.role} ${item.name}`)].join(" ").trim();
  if (!candidateRoleText || !job.title.trim()) return unavailable(MATCH_WEIGHTS.role, "Candidate target role or job title is unavailable.");
  const candidateTokens = roleTokens(candidateRoleText);
  const jobTokens = roleTokens(job.title);
  const overlap = [...jobTokens].filter((token) => candidateTokens.has(token)).length;
  if (overlap === 0) return available(MATCH_WEIGHTS.role, 0, "Job title has no meaningful role-token overlap with the candidate profile.");
  const score = Math.min(100, Math.round((overlap / Math.max(candidateTokens.size, jobTokens.size)) * 100) + (overlap > 1 ? 25 : 25));
  return available(MATCH_WEIGHTS.role, score, "Job title shares meaningful role terms with the candidate profile.");
}

function calculateLocation(candidate: MatchingCandidate, job: MatchingJob): MatchDimension {
  const candidateLocation = candidate.location?.trim();
  const jobLocation = job.location?.trim();
  const workplace = job.workplaceType?.toLowerCase() ?? "";
  if (!candidateLocation || (!jobLocation && !workplace)) return unavailable(MATCH_WEIGHTS.location, "Candidate or job location/work mode is unavailable.");
  if (workplace.includes("remote") && candidateLocation.toLowerCase().includes("remote")) return available(MATCH_WEIGHTS.location, 100, "Both profile and job indicate remote work.");
  if (jobLocation && [...locationTokens(candidateLocation)].some((token) => locationTokens(jobLocation).has(token))) {
    return available(MATCH_WEIGHTS.location, 100, "Candidate and job locations overlap.");
  }
  if (workplace.includes("remote")) return available(MATCH_WEIGHTS.location, 75, "The job is remote; precise candidate location compatibility is not required.");
  return available(MATCH_WEIGHTS.location, 25, "Candidate and job locations do not overlap.");
}

function available(weight: number, score: number, reason: string): MatchDimension {
  return { score: clamp(score), weight, available: true, reason };
}

function unavailable(weight: number, reason: string): MatchDimension {
  return { score: null, weight, available: false, reason };
}

function locationTokens(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
