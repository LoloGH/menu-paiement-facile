import { z } from "zod";
import { PAYMENT_PROVIDERS } from "@menu/shared";

/**
 * Every environment variable the API reads, validated once at boot.
 *
 * The server refuses to start on a bad or missing value rather than failing
 * later at the first request. Nothing here has a production-safe default: a
 * missing JWT secret must be an error, never a fallback.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),

  /** Signs the access and refresh tokens. At least 32 bytes of real entropy. */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),

  /** Public origin of the site, used for cookie scope and redirect building. */
  PUBLIC_ORIGIN: z.string().url().default("http://localhost:8080"),

  PAYMENT_PROVIDER: z.enum(PAYMENT_PROVIDERS).default("manual"),
  /** Only read by the `wave_link` provider. */
  WAVE_PAYMENT_URL: z.string().url().optional(),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}
