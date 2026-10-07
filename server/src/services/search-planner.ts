import type { JobSearchParams } from "../types/jobs.js";

export function planJobSearch(input: JobSearchParams): JobSearchParams {
  const query = input.query.trim();
  const location = input.location?.trim() ?? "";
  const locationPattern = /\s+(?:in|near|at)\s+(.+)$/i;
  const match = query.match(locationPattern);

  if (!location && match?.[1]) {
    return {
      ...input,
      query: query.slice(0, match.index).trim(),
      location: match[1].trim(),
    };
  }

  return { ...input, query, location };
}
