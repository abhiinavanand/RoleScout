import { Link } from "react-router-dom";
import { LoadingSpinner } from "./loading-spinner";
import type { Job } from "../api/jobs";
import type { MatchResult, ApplicationStatus } from "../api/jobs";

type Props = {
  job: Job;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  match?: MatchResult;
  applicationStatus?: ApplicationStatus | null;
  tracking?: boolean;
  onTrack?: () => void;
};

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved", APPLIED: "Applied", SCREENING: "Screening", INTERVIEW: "Interview",
  OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn",
};

export function JobCard({ job, saved, saving, onSave, match, applicationStatus, tracking = false, onTrack }: Props) {
  const salary = job.salaryMin !== null
    ? `${job.salaryCurrency ?? ""}${job.salaryMin.toLocaleString()}${job.salaryMax !== null ? ` - ${job.salaryMax.toLocaleString()}` : ""}`
    : null;
  return <article className="job-card">
    <div className="job-card-content">
      <h2><Link to={`/jobs/${job.id}`}>{job.title}</Link></h2>
      <p><strong>{job.companyName}</strong>{job.location ? ` · ${job.location}` : ""}</p>
      <div className="job-card-meta">{[job.workplaceType, job.employmentType, salary, job.postedAt ? `Posted ${new Date(job.postedAt).toLocaleDateString()}` : null].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div>
      {match && <div className="job-match-summary"><span className="match-inline">{match.score}% Match</span><span className="match-progress" aria-hidden="true"><span style={{ width: `${match.score}%` }} /></span><span><strong>Matched:</strong> {match.breakdown.skills.matched.length ? match.breakdown.skills.matched.slice(0, 4).join(" · ") : "None identified"}</span><span><strong>Missing:</strong> {match.breakdown.skills.missing.length ? match.breakdown.skills.missing.slice(0, 3).join(" · ") : "None"}</span></div>}
      {applicationStatus && <span className="application-status">Application · {statusLabels[applicationStatus]}</span>}
    </div>
    <div className="job-card-actions">
      {onTrack && !applicationStatus && <button className="secondary-button" onClick={onTrack} disabled={tracking}>{tracking ? <LoadingSpinner label="Tracking" /> : "Track"}</button>}
      <button className="secondary-button" onClick={onSave} disabled={saved || saving} aria-label={saved ? `${job.title} saved` : `Save ${job.title}`}>{saving ? <LoadingSpinner label="Saving" /> : saved ? "Saved" : "Save"}</button>
      <Link className="primary-button" to={`/jobs/${job.id}`}>View job</Link>
    </div>
  </article>;
}
