import type { FormEvent } from "react";
import { useState } from "react";
import { LocationCombobox } from "./location-combobox";
import type { CanonicalLocation } from "../features/jobs/canonical-locations";
import { LoadingSpinner } from "./loading-spinner";

export const employmentTypes = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACTOR", label: "Contract" },
  { value: "INTERN", label: "Internship" },
];

export const experienceLevels = [
  { value: "ENTRY_LEVEL", label: "Entry level" },
  { value: "MID_LEVEL", label: "Mid-level" },
  { value: "SENIOR_LEVEL", label: "Senior level" },
];

export type SearchFormValues = {
  query: string;
  location: CanonicalLocation | undefined;
  remote: boolean;
  employmentType?: string;
  experienceLevel?: string;
};

type Props = {
  initialValues: SearchFormValues;
  isSubmitting: boolean;
  onSubmit: (values: SearchFormValues) => void;
};

export function SearchForm({ initialValues, isSubmitting, onSubmit }: Props) {
  const [values, setValues] = useState(initialValues);
  const [validationError, setValidationError] = useState<string>();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (values.query.trim().length < 2) {
      setValidationError("Enter at least 2 characters for the job search.");
      return;
    }
    if (!values.location) {
      setValidationError("Choose a location from the suggestions.");
      return;
    }
    setValidationError(undefined);
    onSubmit({ ...values, query: values.query.trim() });
  }

  return <form className="job-search-form compact-search-form" onSubmit={submit} noValidate>
    <label>Search query
      <input value={values.query} onChange={(event) => setValues({ ...values, query: event.target.value })} placeholder="Backend developer" maxLength={200} required />
    </label>
    <LocationCombobox value={values.location} onChange={(location) => setValues({ ...values, location })} error={!values.location && validationError?.includes("location") ? validationError : undefined} />
    <div className="search-filter-grid">
      <label>Employment type
        <select value={values.employmentType ?? ""} onChange={(event) => setValues({ ...values, employmentType: event.target.value || undefined })}>
          <option value="">Any employment type</option>
          {employmentTypes.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>Experience level
        <select value={values.experienceLevel ?? ""} onChange={(event) => setValues({ ...values, experienceLevel: event.target.value || undefined })}>
          <option value="">Any experience level</option>
          {experienceLevels.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
    <label className="checkbox-label"><input type="checkbox" checked={values.remote} onChange={(event) => setValues({ ...values, remote: event.target.checked })} /> Remote only</label>
    {validationError && !validationError.includes("location") && <p className="form-error" role="alert">{validationError}</p>}
    <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoadingSpinner label="Searching" /> Searching...</> : "Search jobs"}</button>
  </form>;
}
