export function getSearchQueueJobId(searchId: string): string {
  return `search-${searchId}`;
}

export function getResumeQueueJobId(resumeId: string): string {
  return `resume-${resumeId}`;
}
