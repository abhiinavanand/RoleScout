import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as analyticsApi from "../api/analytics";

const statusLabels: Record<string, string> = { SAVED: "Saved", APPLIED: "Applied", SCREENING: "Screening", INTERVIEW: "Interview", OFFER: "Offer", REJECTED: "Rejected", WITHDRAWN: "Withdrawn" };

export function AnalyticsPage() {
  const [range, setRange] = useState<analyticsApi.AnalyticsRange>("30d");
  const analytics = useQuery({ queryKey: ["analytics", "overview", range], queryFn: () => analyticsApi.getOverview(range) });
  if (analytics.isLoading) return <main className="dashboard"><p className="muted">Loading analytics...</p></main>;
  if (analytics.error) return <main className="dashboard"><p className="form-error">{analytics.error.message}</p></main>;
  const data = analytics.data;
  if (!data) return <main className="dashboard"><p className="form-error">Analytics are unavailable.</p></main>;
  const hasData = data.summary.applications > 0 || data.summary.savedJobs > 0 || data.summary.searches > 0;
  return <main className="dashboard"><div className="analytics-heading"><div><p className="eyebrow">Analytics</p><h1>Your job search activity</h1><p className="lead">Real activity from your saved jobs, applications, and searches.</p></div><label>Range<select value={range} onChange={(event) => setRange(event.target.value as analyticsApi.AnalyticsRange)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select></label></div>{!hasData ? <div className="empty-panel"><h2>No analytics data yet</h2><p>Save a job, track an application, or run a search to see activity here.</p></div> : <><section className="analytics-summary">{[["Saved jobs", data.summary.savedJobs], ["Applications", data.summary.applications], ["Interviews", data.summary.interviews], ["Offers", data.summary.offers], ["Searches", data.summary.searches]].map(([label, value]) => <div className="analytics-card" key={label}><span className="muted">{label}</span><strong>{value}</strong></div>)}</section><section className="analytics-grid"><div className="empty-panel"><h2>Application statuses</h2>{data.applicationsByStatus.map((item) => <div className="analytics-row" key={item.status}><span>{statusLabels[item.status] ?? item.status}</span><strong>{item.count}</strong></div>)}</div><div className="empty-panel"><h2>Rates</h2>{[["Application rate", data.rates.applicationRate], ["Interview rate", data.rates.interviewRate], ["Offer rate", data.rates.offerRate], ["Rejection rate", data.rates.rejectionRate]].map(([label, value]) => <div className="analytics-row" key={label}><span>{label}</span><strong>{value === null ? "Not enough data" : `${value}%`}</strong></div>)}</div></section><section className="empty-panel"><h2>Applications over time</h2><div className="trend-list">{data.applicationsOverTime.map((item) => <div className="trend-row" key={item.date}><time>{item.date}</time><div className="trend-bar"><span style={{ width: `${Math.min(100, item.applications * 20)}%` }} /></div><strong>{item.applications}</strong></div>)}</div></section></>}</main>;
}
