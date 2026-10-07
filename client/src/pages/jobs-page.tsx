import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as jobsApi from "../api/jobs";
import * as applicationsApi from "../api/applications";
import { JobCard } from "../components/job-card";
import { SearchForm, type SearchFormValues } from "../components/search-form";
import { LoadingSpinner } from "../components/loading-spinner";
import { findCanonicalLocation } from "../features/jobs/canonical-locations";

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("rate") || message.includes("frequently")) return "You're searching too frequently. Please wait a moment before trying again.";
  if (message.includes("provider") || message.includes("unavailable")) return "Job search is temporarily unavailable. Please try again in a few minutes.";
  if (message.includes("Authentication") || message.includes("session")) return "Your session has expired. Please sign in again.";
  return "Couldn't reach RoleScout. Check your connection and try again.";
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const location = findCanonicalLocation(searchParams.get("location"));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchId, setSearchId] = useState<string | null>(null);
  const client = useQueryClient();
  const search = useMutation({ mutationFn: jobsApi.searchJobs, onSuccess: (data) => setSearchId(data.searchId) });
  const searchStatus = useQuery({
    queryKey: ["search-status", searchId],
    queryFn: () => jobsApi.getSearchStatus(searchId ?? ""),
    enabled: Boolean(searchId),
    refetchInterval: (queryState) => queryState.state.status === "error" || ["COMPLETED", "FAILED"].includes(queryState.state.data?.processingStatus ?? "") ? false : 2000,
  });
  const jobs = useQuery({
    queryKey: ["jobs", "search", page, query],
    queryFn: () => jobsApi.listJobs({ keyword: query || undefined, page, limit: 20 }),
    enabled: Boolean(query),
  });
  const saved = useQuery({ queryKey: ["saved-jobs"], queryFn: applicationsApi.listSavedJobs });
  const save = useMutation({ mutationFn: applicationsApi.saveJob, onSuccess: () => client.invalidateQueries({ queryKey: ["saved-jobs"] }) });
  const savedJobIds = useMemo(() => new Set(saved.data?.items.map((item) => item.job.id)), [saved.data]);
  const showResults = !search.isPending && (!searchId || searchStatus.data?.processingStatus === "COMPLETED");
  const formKey = searchParams.toString();

  useEffect(() => {
    if (searchStatus.data?.processingStatus === "COMPLETED") client.invalidateQueries({ queryKey: ["jobs", "search"] });
  }, [searchStatus.data?.processingStatus, client]);

  function submit(values: SearchFormValues) {
    setSearchId(null);
    search.reset();
    setSearchParams({
      query: values.query,
      location: values.location?.city ?? "",
      remoteOnly: String(values.remote),
      ...(values.employmentType ? { employmentType: values.employmentType } : {}),
      ...(values.experienceLevel ? { experienceLevel: values.experienceLevel } : {}),
      page: "1",
    });
    search.mutate({
      query: values.query,
      location: values.location?.canonicalName,
      remote: values.remote,
      ...(values.employmentType ? { employmentType: values.employmentType } : {}),
      ...(values.experienceLevel ? { experienceLevel: values.experienceLevel } : {}),
      page: 1,
      limit: 20,
    });
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
    setSearchId(null);
  }

  const initialValues: SearchFormValues = {
    query,
    location,
    remote: searchParams.get("remoteOnly") === "true",
    employmentType: searchParams.get("employmentType") || undefined,
    experienceLevel: searchParams.get("experienceLevel") || undefined,
  };

  return <main className="dashboard jobs-page">
    <h1>Jobs</h1>
    <p className="lead">Find jobs that actually match you.</p>
    <SearchForm key={formKey} initialValues={initialValues} isSubmitting={search.isPending} onSubmit={submit} />
    {search.error && <div className="error-state" role="alert"><p>{errorMessage(search.error)}</p><button className="secondary-button" onClick={() => search.reset()}>Try again</button></div>}
    {search.isPending && <div className="status-panel" aria-live="polite"><LoadingSpinner label="Searching for jobs" /><div><h2>Searching for jobs...</h2><p>Fetching fresh opportunities.</p></div></div>}
    {(searchStatus.data?.processingStatus === "PENDING" || searchStatus.data?.processingStatus === "PROCESSING") && <div className="status-panel" aria-live="polite"><LoadingSpinner label="Processing search" /><div><h2>Searching for jobs...</h2><p>Fetching fresh opportunities.</p></div></div>}
    {searchStatus.error && <div className="error-state" role="alert"><p>We couldn't check the search status. Please try again.</p></div>}
    {searchStatus.data?.processingStatus === "FAILED" && <div className="error-state" role="alert"><p>Job search is temporarily unavailable. Please try again in a few minutes.</p><button className="secondary-button" onClick={() => setSearchId(null)}>Modify search</button></div>}
    {jobs.error && <div className="error-state" role="alert"><p>{errorMessage(jobs.error)}</p><button className="secondary-button" onClick={() => jobs.refetch()}>Try again</button></div>}
    {showResults && jobs.data && !jobs.data.jobs.length && <div className="empty-panel"><h2>No matching jobs found</h2><p>Try a broader job title, another location, enabling remote jobs, or removing a filter.</p></div>}
    {!query && !search.isPending && <div className="empty-panel"><h2>Start your search</h2><p>Choose a role and a canonical location to find fresh opportunities.</p></div>}
    <section className="job-list" aria-live="polite">{showResults && jobs.data?.jobs.map((job) => <JobCard key={job.id} job={job} saved={savedJobIds.has(job.id)} saving={save.isPending && save.variables === job.id} onSave={() => save.mutate(job.id)} />)}</section>
    {save.error && <p className="form-error" role="alert">Couldn't save this job. Please try again.</p>}
    {showResults && jobs.data?.pagination && <div className="pagination"><button className="secondary-button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</button><span aria-current="page">Page {jobs.data.pagination.page}</span><button className="secondary-button" disabled={!jobs.data.pagination.hasNextPage} onClick={() => goToPage(page + 1)}>Next</button></div>}
  </main>;
}
