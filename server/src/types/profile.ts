import { z } from "zod";

export const profileItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  technologies: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
});

export const experienceSchema = profileItemSchema.extend({
  company: z.string().trim().max(200).default(""),
  role: z.string().trim().max(200).default(""),
  location: z.string().trim().max(200).default(""),
  startDate: z.string().trim().max(50).default(""),
  endDate: z.string().trim().max(50).default(""),
});

export const educationSchema = profileItemSchema.extend({
  institution: z.string().trim().max(200).default(""),
  degree: z.string().trim().max(200).default(""),
  field: z.string().trim().max(200).default(""),
  startDate: z.string().trim().max(50).default(""),
  endDate: z.string().trim().max(50).default(""),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1).max(100),
  url: z.string().url().max(500),
});

export const candidateProfileSchema = z.object({
  headline: z.string().trim().max(200).nullable().default(null),
  summary: z.string().trim().max(10000).nullable().default(null),
  location: z.string().trim().max(200).nullable().default(null),
  email: z.string().email().max(320).nullable().default(null),
  phone: z.string().trim().max(50).nullable().default(null),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().default(null),
  education: z.array(educationSchema).max(50).default([]),
  skills: z.array(z.string().trim().min(1).max(100)).max(200).default([]),
  experience: z.array(experienceSchema).max(100).default([]),
  projects: z.array(profileItemSchema).max(100).default([]),
  certifications: z.array(profileItemSchema).max(100).default([]),
  links: z.array(linkSchema).max(50).default([]),
});

export type CandidateProfileData = z.infer<typeof candidateProfileSchema>;
