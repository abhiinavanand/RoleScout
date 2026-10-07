import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as applicationsApi from "../api/applications";
import { ApplicationEditForm } from "../components/application-edit-form";
import type { Job } from "../api/jobs";

const labels: Record<applicationsApi.ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

function displayJob(job: Job) {
  return <><h3>{job.title}</h3><p><strong>{job.companyName}</strong>{job.location ? ` · ${job.location}` : ""}</p></>;
}

export function ApplicationsPage() {
  const client = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const applications = useQuery({ queryKey: ["applications"], queryFn: () => applicationsApi.listApplications() });
  const savedJobs = useQuery({ queryKey: ["saved-jobs"], queryFn: applicationsApi.listSavedJobs });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<applicationsApi.Application, "status" | "appliedAt" | "notes">> }) => applicationsApi.updateApplication(id, input),
    onSuccess: () => {
      setEditingId(null);
      client.invalidateQueries({ queryKey: ["applications"] });
    },
  });
  const remove = useMutation({
    mutationFn: applicationsApi.deleteApplication,
    onSuccess: () => client.invalidateQueries({ queryKey: ["applications"] }),
  });
  const track = useMutation({
    mutationFn: (jobId: string) => applicationsApi.createApplication({ jobId, status: "SAVED", appliedAt: null, notes: null }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["applications"] });
      client.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });
  const applicationItems = applications.data?.items ?? [];
  const trackedJobIds = useMemo(() => new Set(applicationItems.map((item) => item.job.id)), [applicationItems]);
  const untrackedSavedJobs = (savedJobs.data?.items ?? []).filter((item) => !trackedJobIds.has(item.job.id));
  const hasLoadedData = applications.isSuccess && savedJobs.isSuccess;
  const hasAnyData = applicationItems.length > 0 || (savedJobs.data?.items.length ?? 0) > 0;

  return <main className="dashboard">
    <p className="eyebrow">Application tracker</p>
    <h1>Application tracker</h1>
    <p className="lead">Track where your applications stand. RoleScout never submits applications for you.</p>
    {hasLoadedData && <p className="tracker-summary">Saved jobs needing action: <strong>{untrackedSavedJobs.length}</strong></p>}
    {(applications.isLoading || savedJobs.isLoading) && <p className="muted">Loading your tracker...</p>}
    {(applications.error || savedJobs.error) && <div className="error-state" role="alert"><p>Couldn't load your tracker.</p><button className="secondary-button" onClick={() => { void applications.refetch(); void savedJobs.refetch(); }}>Retry</button></div>}
    {hasLoadedData && <section className="saved-jobs-section" aria-labelledby="saved-jobs-heading">
      <div className="section-heading"><div><p className="eyebrow">Next steps</p><h2 id="saved-jobs-heading">Saved jobs</h2></div><span className="muted">{untrackedSavedJobs.length} ready to track</span></div>
      {untrackedSavedJobs.length === 0 ? <p className="compact-empty">No saved jobs need tracking.</p> :       <div className="saved-job-grid">{untrackedSavedJobs.map((savedJob) => <article className="saved-job-card" key={savedJob.id}><p className="status-label">Saved</p>{displayJob(savedJob.job)}<div className="application-card-actions"><button className="primary-button" onClick={() => track.mutate(savedJob.job.id)} disabled={track.isPending}>{track.isPending ? "Tracking..." : "Track application"}</button><Link className="secondary-button" to={`/jobs/${savedJob.job.id}`}>View job</Link></div>{track.error && <p className="form-error" role="alert">Could not track this job. Please try again.</p>}</article>)}</div>}
    </section>}
    {hasLoadedData && !hasAnyData && <div className="empty-panel"><h2>No jobs tracked yet</h2><p>Save jobs you are interested in, then track applications when you apply.</p><Link className="primary-button" to="/jobs">Find jobs</Link></div>}
    {hasLoadedData && <section aria-labelledby="pipeline-heading"><div className="section-heading pipeline-heading"><div><p className="eyebrow">Progress</p><h2 id="pipeline-heading">Application pipeline</h2></div></div><div className="application-board">{applicationsApi.statuses.map((status) => {
      const statusItems = applicationItems.filter((item) => item.status === status);
      return <section className="application-column" key={status}><h2>{labels[status]} <span>{statusItems.length}</span></h2>{statusItems.length === 0 ? <p className="compact-empty">Nothing here yet</p> : statusItems.map((item) => <article className="application-card" key={item.id}>{displayJob(item.job)}<p className="status-label">{labels[item.status]}</p>{item.appliedAt && <p className="muted">Applied {new Date(item.appliedAt).toLocaleDateString()}</p>}{item.notes && <p className="application-notes">{item.notes}</p>}{editingId === item.id ? <ApplicationEditForm application={item} onSave={(input) => update.mutate({ id: item.id, input })} onCancel={() => setEditingId(null)} isSaving={update.isPending} error={update.error} /> : <><select aria-label={`Status for ${item.job.title}`} value={item.status} onChange={(event) => update.mutate({ id: item.id, input: { status: event.target.value as applicationsApi.ApplicationStatus } })} disabled={update.isPending}>{applicationsApi.statuses.map((option) => <option key={option} value={option}>{labels[option]}</option>)}</select><div className="application-card-actions"><Link to={`/jobs/${item.job.id}`}>View job</Link><button className="button-link" onClick={() => setEditingId(item.id)}>Edit</button><button className="button-link" onClick={() => remove.mutate(item.id)} disabled={remove.isPending}>Delete</button></div></>}{remove.error && <p className="form-error" role="alert">Could not delete this application.</p>}</article>)}</section>;
    })}</div></section>}
  </main>;
}
