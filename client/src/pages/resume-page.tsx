import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as resumeApi from "../api/resumes";

export function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [processingResumeId, setProcessingResumeId] = useState<string | null>(null);
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: resumeApi.listResumes });
  const upload = useMutation({
    mutationFn: (file: File) => resumeApi.uploadResume(file),
    onSuccess: (data) => { setMessage("Processing resume..."); setProcessingResumeId(data.resume.id); client.invalidateQueries({ queryKey: ["resumes"] }); },
  });
  const status = useQuery({ queryKey: ["resume-status", processingResumeId], queryFn: () => resumeApi.getResumeStatus(processingResumeId ?? ""), enabled: Boolean(processingResumeId), refetchInterval: (query) => ["COMPLETED", "FAILED"].includes(query.state.data?.processingStatus ?? "") ? false : 2000 });
  useEffect(() => {
    if (status.data?.processingStatus === "COMPLETED") {
      setMessage("Resume processed and profile updated.");
      client.invalidateQueries({ queryKey: ["profile"] });
    }
  }, [status.data?.processingStatus, client]);
  const remove = useMutation({ mutationFn: resumeApi.deleteResume, onSuccess: () => { setMessage("Resume deleted."); client.invalidateQueries({ queryKey: ["resumes"] }); } });
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      setMessage("Choose a PDF or DOCX file.");
      return;
    }
    upload.mutate(file);
  }
  return <main className="dashboard"><p className="eyebrow">Resume intelligence</p><h1>Your resume</h1><p className="lead">Upload a PDF or DOCX up to 10 MB. RoleScout extracts text and builds an editable profile.</p><section className="empty-panel"><input ref={inputRef} hidden type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => handleFile(event.target.files?.[0])} /><button className="primary-button" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>{upload.isPending ? "Uploading..." : "Upload resume"}</button>{(message || upload.error || status.error) && <p className={upload.error || status.error ? "form-error" : "success-message"}>{upload.error?.message ?? status.error?.message ?? (status.data?.processingStatus === "FAILED" ? "Resume processing failed." : message)}</p>}<div className="resume-list">{resumes.isLoading && <p className="muted">Loading resumes...</p>}{resumes.error && <p className="form-error">{resumes.error.message}</p>}{!resumes.isLoading && !resumes.data?.resumes.length && <p className="muted">No resume uploaded yet.</p>}{resumes.data?.resumes.map((resume) => <article className="resume-row" key={resume.id}><div><strong>{resume.originalFileName}</strong><p className="muted">{new Date(resume.createdAt).toLocaleDateString()} · {(resume.fileSize / 1024 / 1024).toFixed(2)} MB · {processingResumeId === resume.id ? status.data?.processingStatus ?? resume.processingStatus : resume.processingStatus}</p></div><button className="button-link" onClick={() => remove.mutate(resume.id)} disabled={remove.isPending}>Delete</button></article>)}</div></section></main>;
}
