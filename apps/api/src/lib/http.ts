import type { FastifyReply } from "fastify";
import { ZodError, type ZodSchema } from "zod";

/** Thrown by route handlers for an expected, client-facing failure. */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Parses a payload, turning a Zod failure into a 400 with per-field messages
 * rather than a stack trace.
 */
export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, "requête invalide", {
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    throw error;
  }
}

export function sendError(reply: FastifyReply, error: HttpError) {
  return reply.code(error.statusCode).send({
    error: error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Reads a UUID path parameter, or fails with a 400.
 *
 * Without this a malformed identifier reaches PostgreSQL, which raises a type
 * error the handler turns into a 500 — reporting a server fault for what is
 * plainly a bad request, and writing a stack trace on every stray crawler hit.
 */
export function uuidParam(params: unknown, key: string): string {
  const value = (params as Record<string, unknown> | null)?.[key];
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new HttpError(400, `identifiant « ${key} » invalide`);
  }
  return value;
}
