import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { canonicalLocations, type CanonicalLocation, findCanonicalLocation } from "../features/jobs/canonical-locations";

type Props = {
  value: CanonicalLocation | undefined;
  onChange: (location: CanonicalLocation | undefined) => void;
  error?: string;
};

export function LocationCombobox({ value, onChange, error }: Props) {
  const inputId = useId();
  const listId = `${inputId}-options`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(value?.city ?? "");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const suggestions = canonicalLocations.filter((location) => {
    const query = inputValue.trim().toLowerCase();
    return !query || location.canonicalName.toLowerCase().includes(query);
  });

  useEffect(() => {
    setInputValue(value?.city ?? "");
  }, [value]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function selectLocation(location: CanonicalLocation) {
    onChange(location);
    setInputValue(location.city);
    setOpen(false);
    setHighlightedIndex(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectLocation(suggestions[highlightedIndex]);
    }
  }

  return <div className="combobox" ref={containerRef}>
    <label htmlFor={inputId}>Location</label>
    <input
      id={inputId}
      role="combobox"
      aria-autocomplete="list"
      aria-controls={listId}
      aria-expanded={open}
      aria-activedescendant={open && suggestions[highlightedIndex] ? `${listId}-${highlightedIndex}` : undefined}
      aria-invalid={Boolean(error)}
      value={inputValue}
      onChange={(event) => {
        setInputValue(event.target.value);
        onChange(undefined);
        setHighlightedIndex(0);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      placeholder="Choose a location"
      autoComplete="off"
    />
    {open && <ul className="combobox-options" id={listId} role="listbox">
      {suggestions.length ? suggestions.map((location, index) => <li
        id={`${listId}-${index}`}
        key={location.canonicalName}
        role="option"
        aria-selected={value?.canonicalName === location.canonicalName}
        className={index === highlightedIndex ? "highlighted" : ""}
        onMouseDown={(event) => {
          event.preventDefault();
          selectLocation(location);
        }}
      >{location.city}<span>{location.state}, {location.country}</span></li>) : <li className="combobox-empty">No matching locations</li>}
    </ul>}
    {error && <p className="form-error" id={`${inputId}-error`}>{error}</p>}
  </div>;
}

export function locationFromValue(value: string | null): CanonicalLocation | undefined {
  return findCanonicalLocation(value);
}
