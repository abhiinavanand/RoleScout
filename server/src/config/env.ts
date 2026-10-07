import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url(),
  RESUME_STORAGE_PATH: z.string().min(1).default("./storage/resumes"),
  MAX_RESUME_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  JOB_SEARCH_API_KEY: z.string().min(1).optional(),
  JOB_SEARCH_PROVIDER: z.enum(["serpapi"]).default("serpapi"),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(2),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
}).superRefine((values, context) => {
  if (values.NODE_ENV === "production" && values.AUTH_SECRET.toLowerCase().includes("replace-with")) {
    context.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "AUTH_SECRET must be a generated production secret." });
  }
});

export const env = environmentSchema.parse(process.env);
