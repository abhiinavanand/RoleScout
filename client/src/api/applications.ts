import { apiRequest } from "./client";
import type { Job } from "./jobs";

export const statuses = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as const;
export type ApplicationStatus = typeof statuses[number];
export type Application = { id: string; status: ApplicationStatus; appliedAt: string | null; notes: string | null; createdAt: string; updatedAt: string; job: Job };
export const listApplications = (status?: ApplicationStatus) => apiRequest<{ items: Application[]; page: number; pageSize: number; total: number; totalPages: number }>(`/applications?page=1&pageSize=50${status ? `&status=${status}` : ""}`);
export const createApplication = (input: { jobId: string; status: ApplicationStatus; appliedAt?: string | null; notes?: string | null }) => apiRequest<{ application: Application }>("/applications", { method: "POST", body: JSON.stringify(input) });
export const updateApplication = (id: string, input: Partial<Pick<Application, "status" | "appliedAt" | "notes">>) => apiRequest<{ application: Application }>(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteApplication = (id: string) => apiRequest<{ deleted: boolean }>(`/applications/${id}`, { method: "DELETE" });
export const listSavedJobs = () => apiRequest<{ items: Array<{ id: string; job: Job }> }>("/saved-jobs");
export const saveJob = (id: string) => apiRequest<{ savedJob: { id: string } }>(`/saved-jobs/${id}`, { method: "POST" });
export const unsaveJob = (id: string) => apiRequest<{ deleted: boolean }>(`/saved-jobs/${id}`, { method: "DELETE" });
