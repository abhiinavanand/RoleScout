export type CanonicalLocation = {
  city: string;
  state: string;
  country: string;
  canonicalName: string;
};

export const canonicalLocations: CanonicalLocation[] = [
  ["Bangalore", "Karnataka", "India"],
  ["Mumbai", "Maharashtra", "India"],
  ["Delhi", "Delhi", "India"],
  ["Hyderabad", "Telangana", "India"],
  ["Pune", "Maharashtra", "India"],
  ["Chennai", "Tamil Nadu", "India"],
  ["Kolkata", "West Bengal", "India"],
  ["Ahmedabad", "Gujarat", "India"],
  ["Jaipur", "Rajasthan", "India"],
  ["Kochi", "Kerala", "India"],
  ["Noida", "Uttar Pradesh", "India"],
  ["Gurugram", "Haryana", "India"],
  ["Remote", "Remote", "India"],
].map(([city, state, country]) => ({ city, state, country, canonicalName: `${city}, ${state}, ${country}` }));

export function findCanonicalLocation(value: string | null | undefined): CanonicalLocation | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  return canonicalLocations.find((location) => location.city.toLowerCase() === normalized || location.canonicalName.toLowerCase() === normalized);
}
