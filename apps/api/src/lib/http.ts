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
