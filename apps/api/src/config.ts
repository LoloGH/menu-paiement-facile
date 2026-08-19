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

  /* CinetPay. Secrets: they belong in the server's .env, never in the repo. */
  CINETPAY_API_KEY: z.string().min(10).optional(),
  CINETPAY_SITE_ID: z.string().min(1).optional(),
  /**
   * Signs the x-token on notifications. Optional because the transaction is
   * confirmed by a server-to-server check either way, but set it: it rejects
   * forged callbacks before they cost a round trip.
   */
  CINETPAY_SECRET_KEY: z.string().min(10).optional(),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Config = z.infer<typeof envSchema>;

/**
 * Just the database URL, for tools that touch nothing else.
 *
 * The migration runner and the import script have no use for a JWT secret or a
 * payment provider; demanding them would make a schema migration fail for a
 * reason that has nothing to do with the schema.
 */
export function loadDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const parsed = z.string().url().safeParse(env.DATABASE_URL);
  if (!parsed.success) {
    throw new Error("DATABASE_URL is missing or is not a valid URL");
  }
  return parsed.data;
}

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
