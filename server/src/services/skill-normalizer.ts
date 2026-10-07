const canonicalSkills = new Map<string, string>([
  ["react.js", "React"],
  ["reactjs", "React"],
  ["react", "React"],
  ["node", "Node.js"],
  ["node.js", "Node.js"],
  ["nodejs", "Node.js"],
  ["postgres", "PostgreSQL"],
  ["postgresql", "PostgreSQL"],
  ["postgre sql", "PostgreSQL"],
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
]);

export function normalizeSkill(skill: string): string {
  const trimmedSkill = skill.trim();
  return canonicalSkills.get(trimmedSkill.toLowerCase()) ?? trimmedSkill;
}

export function normalizeSkills(skills: string[]): string[] {
  return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
}
