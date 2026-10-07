import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as jobsApi from "../api/jobs";
import { JobMatchPanel } from "../components/job-match-panel";
import * as applicationsApi from "../api/applications";
import { ApplicationEditForm } from "../components/application-edit-form";

export function JobDetailsPage() {
  const { id } = useParams();
  const job = useQuery({ queryKey: ["job", id], queryFn: () => jobsApi.getJob(id ?? ""), enabled: Boolean(id) });
  const match = useQuery({ queryKey: ["job-match", id], queryFn: () => jobsApi.getJobMatch(id ?? ""), enabled: Boolean(id) });
  const client = useQueryClient();
  const saved = useQuery({ queryKey: ["saved-jobs"], queryFn: applicationsApi.listSavedJobs });
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => applicationsApi.listApplications() });
  const save = useMutation({ mutationFn: () => applicationsApi.saveJob(id ?? ""), onSuccess: () => { client.invalidateQueries({ queryKey: ["saved-jobs"] }); client.invalidateQueries({ queryKey: ["recommendations"] }); } });
  const track = useMutation({ mutationFn: (status: applicationsApi.ApplicationStatus) => applicationsApi.createApplication({ jobId: id ?? "", status }), onSuccess: () => { client.invalidateQueries({ queryKey: ["applications"] }); client.invalidateQueries({ queryKey: ["saved-jobs"] }); client.invalidateQueries({ queryKey: ["recommendations"] }); } });
  const updateApplication = useMutation({ mutationFn: ({ applicationId, input }: { applicationId: string; input: Partial<Pick<applicationsApi.Application, "status" | "appliedAt" | "notes">> }) => applicationsApi.updateApplication(applicationId, input), onSuccess: () => { setEditingApplication(false); client.invalidateQueries({ queryKey: ["applications"] }); } });
  const [editingApplication, setEditingApplication] = useState(false);
  if (job.isLoading) return <main className="page-center">Loading job...</main>;
  if (job.error || !job.data) return <main className="dashboard"><p className="form-error">{job.error?.message ?? "Job not found."}</p><Link to="/jobs">Back to jobs</Link></main>;
  const currentJob = job.data.job;
  const currentApplication = applications.data?.items.find((item) => item.job.id === currentJob.id);
  const isSaved = saved.data?.items.some((item) => item.job.id === currentJob.id) ?? false;
  return <main className="dashboard job-details"><Link to="/jobs">← Back to jobs</Link><header className="detail-header"><h1>{currentJob.title}</h1><p className="lead"><strong>{currentJob.companyName}</strong>{currentJob.location ? ` · ${currentJob.location}` : ""}</p><div className="job-meta">{[currentJob.workplaceType, currentJob.employmentType, currentJob.salaryMin !== null ? `${currentJob.salaryCurrency ?? ""}${currentJob.salaryMin.toLocaleString()}${currentJob.salaryMax !== null ? ` - ${currentJob.salaryMax.toLocaleString()}` : ""}` : null, currentJob.postedAt ? `Posted ${new Date(currentJob.postedAt).toLocaleDateString()}` : null].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div><div className="job-actions"><span className="status-badge">{isSaved ? "Saved" : "Not saved"}</span>{applications.isLoading ? <span className="muted">Checking application...</span> : applications.error ? <span className="form-error">Could not check application state.</span> : currentApplication ? <><span className="application-status">Application · {currentApplication.status}</span><button className="secondary-button" onClick={() => setEditingApplication(true)}>Edit application</button></> : <><span className="muted">Application · Not tracked</span><button className="secondary-button" onClick={() => track.mutate("SAVED")} disabled={track.isPending}>{track.isPending ? "Tracking..." : "Track application"}</button></>}{!isSaved && <button className="secondary-button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</button>}<a className="primary-button external-link" href={currentJob.jobUrl} target="_blank" rel="noreferrer">Apply externally ↗</a>{(save.error || track.error) && <p className="form-error" role="alert">{save.error?.message ?? track.error?.message}</p>}</div></header><div className="detail-layout"><div className="detail-main">{currentApplication && editingApplication && <ApplicationEditForm application={currentApplication} onSave={(input) => updateApplication.mutate({ applicationId: currentApplication.id, input })} onCancel={() => setEditingApplication(false)} isSaving={updateApplication.isPending} error={updateApplication.error} />}<div className="job-description"><h2>About this role</h2><p>{currentJob.description || "No description provided by the source."}</p></div></div><aside className="detail-sidebar">{match.isLoading && <p className="muted">Calculating your match...</p>}{match.error && <p className="form-error">{match.error.message}</p>}{match.data && <JobMatchPanel match={match.data} />}</aside></div></main>;
}
