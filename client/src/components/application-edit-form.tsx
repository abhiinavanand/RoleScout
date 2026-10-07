import { useState, type FormEvent } from "react";
import * as applicationsApi from "../api/applications";

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function toDateTime(value: string): string | null {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

type Props = {
  application: applicationsApi.Application;
  onSave: (input: Partial<Pick<applicationsApi.Application, "status" | "appliedAt" | "notes">>) => void;
  onCancel?: () => void;
  isSaving: boolean;
  error?: Error | null;
};

export function ApplicationEditForm({ application, onSave, onCancel, isSaving, error }: Props) {
  const [status, setStatus] = useState(application.status);
  const [appliedAt, setAppliedAt] = useState(toDateInputValue(application.appliedAt));
  const [notes, setNotes] = useState(application.notes ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({ status, appliedAt: toDateTime(appliedAt), notes: notes.trim() || null });
  }

  return <form className="application-edit-form" onSubmit={submit}>
    <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as applicationsApi.ApplicationStatus)}>{applicationsApi.statuses.map((option) => <option key={option} value={option}>{option[0] + option.slice(1).toLowerCase()}</option>)}</select></label>
    <label>Applied date<input type="date" value={appliedAt} onChange={(event) => setAppliedAt(event.target.value)} /></label>
    <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={10000} rows={4} placeholder="Add a private note" /></label>
    {error && <p className="form-error" role="alert">{error.message}</p>}
    <div className="profile-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save changes"}</button>{onCancel && <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>}</div>
  </form>;
}
