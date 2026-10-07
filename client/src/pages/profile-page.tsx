import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as resumeApi from "../api/resumes";

const emptyProfile: resumeApi.CandidateProfile = { headline: "", summary: "", location: "", email: "", phone: "", yearsOfExperience: null, education: [], skills: [], experience: [], projects: [], certifications: [], links: [] };

export function ProfilePage() {
  const client = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: resumeApi.getProfile });
  const [profile, setProfile] = useState(emptyProfile);
  const [structuredDrafts, setStructuredDrafts] = useState({ education: "[]", experience: "[]", projects: "[]", certifications: "[]", links: "[]" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (profileQuery.data?.profile) {
      const nextProfile = profileQuery.data.profile;
      setProfile(nextProfile);
      setStructuredDrafts({
        education: JSON.stringify(nextProfile.education, null, 2),
        experience: JSON.stringify(nextProfile.experience, null, 2),
        projects: JSON.stringify(nextProfile.projects, null, 2),
        certifications: JSON.stringify(nextProfile.certifications, null, 2),
        links: JSON.stringify(nextProfile.links, null, 2),
      });
    }
  }, [profileQuery.data]);
  const update = useMutation({ mutationFn: resumeApi.updateProfile, onSuccess: (data) => { setProfile(data.profile); setMessage("Profile saved."); client.setQueryData(["profile"], { profile: data.profile }); } });
  const reparse = useMutation({ mutationFn: resumeApi.reparseProfile, onSuccess: (data) => { setProfile(data.profile); setMessage("Profile regenerated from your resume."); client.setQueryData(["profile"], { profile: data.profile }); } });
  if (profileQuery.isLoading) return <main className="page-center">Loading profile...</main>;
  if (profileQuery.error) return <main className="dashboard"><p className="form-error">{profileQuery.error.message}</p></main>;
  const updateField = (field: keyof resumeApi.CandidateProfile, value: string) => setProfile((current) => ({ ...current, [field]: value }));
  function updateStructuredField(field: keyof typeof structuredDrafts, value: string) {
    setStructuredDrafts((current) => ({ ...current, [field]: value }));
  }
  function submitProfile(event: FormEvent) {
    event.preventDefault();
    try {
      const structuredProfile = {
        ...profile,
        education: JSON.parse(structuredDrafts.education),
        experience: JSON.parse(structuredDrafts.experience),
        projects: JSON.parse(structuredDrafts.projects),
        certifications: JSON.parse(structuredDrafts.certifications),
        links: JSON.parse(structuredDrafts.links),
      };
      update.mutate(structuredProfile);
    } catch {
      setMessage("Structured details must contain valid JSON arrays.");
    }
  }
  return <main className="dashboard"><p className="eyebrow">Candidate profile</p><h1>Review your profile</h1><p className="lead">Parsed information is editable and your saved edits are authoritative.</p><form className="profile-form" onSubmit={submitProfile}><div className="profile-grid"><label>Headline<input value={profile.headline ?? ""} onChange={(event) => updateField("headline", event.target.value)} maxLength={200} /></label><label>Location<input value={profile.location ?? ""} onChange={(event) => updateField("location", event.target.value)} maxLength={200} /></label><label>Email<input type="email" value={profile.email ?? ""} onChange={(event) => updateField("email", event.target.value)} /></label><label>Phone<input value={profile.phone ?? ""} onChange={(event) => updateField("phone", event.target.value)} /></label></div><label>Professional summary<textarea value={profile.summary ?? ""} onChange={(event) => updateField("summary", event.target.value)} rows={5} maxLength={10000} /></label><label>Skills (comma-separated)<input value={profile.skills.join(", ")} onChange={(event) => setProfile((current) => ({ ...current, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) }))} /></label><div className="profile-grid">{(["experience", "education", "projects", "certifications", "links"] as const).map((field) => <label key={field}>{field[0].toUpperCase() + field.slice(1)} (JSON array)<textarea value={structuredDrafts[field]} onChange={(event) => updateStructuredField(field, event.target.value)} rows={6} /></label>)}</div><div className="profile-actions"><button className="primary-button" type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save profile"}</button><button className="secondary-button" type="button" onClick={() => reparse.mutate()} disabled={reparse.isPending}>{reparse.isPending ? "Reparsing..." : "Reparse resume"}</button></div>{(message || update.error || reparse.error) && <p className={update.error || reparse.error ? "form-error" : "success-message"}>{update.error?.message ?? reparse.error?.message ?? message}</p>}</form></main>;
}
