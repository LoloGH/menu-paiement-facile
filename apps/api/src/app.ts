import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import type { Config } from "./config.js";
import { dbPlugin } from "./plugins/db.js";
import { authPlugin } from "./plugins/auth.js";
import { paymentsPlugin } from "./plugins/payments.js";
import { eventsPlugin } from "./plugins/events.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { menuRoutes } from "./routes/menus.js";
import { orderRoutes } from "./routes/orders.js";
import { adminOrderRoutes } from "./routes/admin/orders.js";
import { catalogRoutes } from "./routes/admin/catalog.js";
import { adminUserRoutes } from "./routes/admin/users.js";
import { roleRoutes } from "./routes/admin/roles.js";
import { paymentRoutes } from "./routes/payments.js";
import { kitchenRoutes } from "./routes/kitchen.js";
import { HttpError } from "./lib/http.js";

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
          "req.body.currentPassword",
          "req.body.newPassword",
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

  /*
   * Payment gateways post their callbacks as form data, and the signature they
   * send covers the exact bytes. Keeping the body as a raw string lets the
   * provider verify it before anything parses or reshapes it.
   */
  app.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (_request, body, done) => done(null, body),
  );
  await app.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: "1 minute",
  });

  /*
   * Per-route limits go through this helper rather than being written inline.
   *
   * Every request Fastify's `inject` makes looks like it comes from the same
   * address, so a realistic limit throttles the test suite instead of the
   * credential stuffing it exists to stop. In `test` the limits are lifted;
   * `rate-limit.test.ts` builds an app with production settings and proves the
   * protection itself still works.
   */
  app.decorate("limit", (max: number, timeWindow: string) =>
    config.NODE_ENV === "test" ? false : { max, timeWindow },
  );

  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(paymentsPlugin);
  await app.register(eventsPlugin);

  /**
   * One place decides what a client sees. Expected failures carry their status
   * and message; anything else is logged in full and answered with a bare 500,
   * so an internal error never leaks a query, a path or a stack trace.
   */
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "requête invalide",
        details: {
          fields: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }
    // Fastify's own 4xx (bad JSON body, unsupported media type, rate limit).
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.code(status).send({ error: (error as Error).message });
    }

    request.log.error({ err: error }, "unhandled error");
    return reply.code(500).send({ error: "erreur interne" });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(menuRoutes);
  await app.register(orderRoutes);
  await app.register(adminOrderRoutes);
  await app.register(catalogRoutes);
  await app.register(adminUserRoutes);
  await app.register(roleRoutes);
  await app.register(paymentRoutes);
  await app.register(kitchenRoutes);

  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: "route inconnue" }));

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
    /** Per-route rate limit, disabled under NODE_ENV=test. */
    limit: (max: number, timeWindow: string) => { max: number; timeWindow: string } | false;
  }
}
