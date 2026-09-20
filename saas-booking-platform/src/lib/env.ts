import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (generate one with: openssl rand -base64 32)"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL, e.g. http://localhost:3000").optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validates process.env once, on first use.
 *
 * Validation is lazy (not at module load) so that static pages and `next build`
 * do not require a configured database; any code that actually touches the
 * database or signs tokens will fail fast with a clear message if the
 * environment is incomplete.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Copy .env.example to .env and fill in the values:\n${issues}`
    );
  }

  cached = result.data;
  return cached;
}
