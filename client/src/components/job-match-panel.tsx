import type { MatchDimension, MatchResult } from "../api/jobs";

function Dimension({ label, dimension }: { label: string; dimension: MatchDimension }) {
  return <div className="match-dimension"><div className="match-dimension-heading"><strong>{label}</strong><span>{dimension.available ? `${dimension.score}%` : "Unavailable"}</span></div><p className="muted">{dimension.reason}</p></div>;
}

export function JobMatchPanel({ match }: { match: MatchResult }) {
  return <section className="job-match-panel"><div className="match-panel-heading"><div><p className="eyebrow">Match</p><h2>{match.score}% match</h2></div></div><div className="match-skills"><div><h3>Matched skills</h3>{match.breakdown.skills.matched.length ? <p>{match.breakdown.skills.matched.join(" · ")}</p> : <p className="muted">None identified</p>}</div><div><h3>Missing skills</h3>{match.breakdown.skills.missing.length ? <p>{match.breakdown.skills.missing.join(" · ")}</p> : <p className="muted">None identified</p>}</div></div><div className="match-breakdown"><Dimension label="Experience" dimension={match.breakdown.experience} /><Dimension label="Role relevance" dimension={match.breakdown.role} /><Dimension label="Location and work mode" dimension={match.breakdown.location} /><Dimension label="Employment type" dimension={match.breakdown.employmentType} /><Dimension label="Salary" dimension={match.breakdown.salary} /></div></section>;
}
