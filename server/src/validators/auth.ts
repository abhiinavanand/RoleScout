import { z } from "zod";

const email = z.string().trim().email().transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
