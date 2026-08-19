import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { Config } from "./config.js";
import { healthRoutes } from "./routes/health.js";

/**
 * Builds the Fastify instance without listening, so tests can drive it through
 * `app.inject()` against a real database and never bind a port.
 */
export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } } }
        : {}),
      // Credentials and tokens must never reach the log stream.
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
          "req.body.password",
        ],
        remove: true,
      },
    },
    // Caddy terminates TLS and sets X-Forwarded-*; without this the rate
    // limiter would see every request as coming from the proxy.
    trustProxy: true,
  });

  app.decorate("config", config);

  await app.register(helmet, {
    // The SPA is served by Caddy, not by this process; CSP belongs there.
    contentSecurityPolicy: false,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(healthRoutes);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}
