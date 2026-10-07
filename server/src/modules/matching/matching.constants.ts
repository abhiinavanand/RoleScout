export const MATCH_WEIGHTS = {
  skills: 40,
  experience: 20,
  role: 15,
  location: 10,
  employmentType: 5,
  salary: 10,
} as const;

export const MATCH_WEIGHT_TOTAL = Object.values(MATCH_WEIGHTS).reduce((total, weight) => total + weight, 0);
