import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RecommendationCard } from "../components/recommendation-card";
import * as jobsApi from "../api/jobs";
import * as applicationsApi from "../api/applications";

export function RecommendationsPage() {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const recommendations = useQuery({ queryKey: ["recommendations", page], queryFn: () => jobsApi.listRecommendations(page) });
  const save = useMutation({ mutationFn: applicationsApi.saveJob, onSuccess: () => { client.invalidateQueries({ queryKey: ["recommendations"] }); client.invalidateQueries({ queryKey: ["saved-jobs"] }); } });
  const track = useMutation({ mutationFn: (jobId: string) => applicationsApi.createApplication({ jobId, status: "SAVED", appliedAt: null, notes: null }), onSuccess: () => { client.invalidateQueries({ queryKey: ["recommendations"] }); client.invalidateQueries({ queryKey: ["applications"] }); client.invalidateQueries({ queryKey: ["saved-jobs"] }); } });
  const data = recommendations.data;
  return <main className="dashboard"><h1>Recommendations</h1><p className="lead">Jobs ranked using your profile and resume.</p>{recommendations.isLoading && <p className="muted" aria-live="polite">Loading recommendations...</p>}{recommendations.error && <div className="error-state" role="alert"><p>{recommendations.error.message}</p><button className="secondary-button" onClick={() => void recommendations.refetch()}>Retry</button></div>}{data && data.recommendations.length === 0 && <div className="empty-panel"><h2>No matching jobs yet</h2><p>{data.pagination.evaluatedJobs === 0 ? "Search for jobs to build your recommendation pool." : "Try updating your profile to improve your matches."}</p><Link className="primary-button" to={data.pagination.evaluatedJobs === 0 ? "/jobs" : "/profile"}>{data.pagination.evaluatedJobs === 0 ? "Find jobs" : "Complete profile"}</Link></div>}{data && data.recommendations.length > 0 && <><section className="recommendation-list" aria-label="Top matches">{data.recommendations.map((item) => <RecommendationCard key={item.job.id} recommendation={item} saving={save.isPending} tracking={track.isPending} onSave={() => save.mutate(item.job.id)} onTrack={() => track.mutate(item.job.id)} />)}</section><div className="pagination"><button className="secondary-button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {data.pagination.totalPages}</span><button className="secondary-button" disabled={page >= data.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></>}</main>;
}
