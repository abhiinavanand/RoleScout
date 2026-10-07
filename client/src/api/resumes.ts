import { apiRequest } from "./client";

export type Resume = {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  processingStatus: string;
  processingErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateProfile = {
  headline: string | null;
  summary: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  yearsOfExperience: number | null;
  education: Array<Record<string, string>>;
  skills: string[];
  experience: Array<Record<string, string | string[]>>;
  projects: Array<Record<string, string | string[]>>;
  certifications: Array<Record<string, string | string[]>>;
  links: Array<{ label: string; url: string }>;
};

export const listResumes = () => apiRequest<{ resumes: Resume[] }>("/resumes");
export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append("resume", file);
  return apiRequest<{ resume: Resume; processingStatus: string; jobId?: string }>("/resumes", { method: "POST", body: formData });
};
export const getResumeStatus = (id: string) => apiRequest<{ id: string; processingStatus: string; processingErrorCode: string | null }>(`/resumes/${id}/status`);
export const deleteResume = (id: string) => apiRequest<{ deleted: boolean }>(`/resumes/${id}`, { method: "DELETE" });
export const getProfile = () => apiRequest<{ profile: CandidateProfile | null }>("/profile");
export const updateProfile = (profile: CandidateProfile) => apiRequest<{ profile: CandidateProfile }>("/profile", { method: "PUT", body: JSON.stringify(profile) });
export const reparseProfile = () => apiRequest<{ profile: CandidateProfile }>("/profile/reparse", { method: "POST" });
