import type { FastifyInstance } from "fastify";
import { auditLog } from "../db/schema.js";

/**
 * Records a privileged action. Append-only: nothing in the API updates or
 * deletes a row here.
 *
 * Failures are logged but never propagated — an audit write must not be able to
 * roll back the action it describes, and the caller has already succeeded by
 * the time this runs.
 */
export async function recordAudit(
  app: FastifyInstance,
  entry: {
    actorId: string | null;
    action: string;
    resource: string;
    resourceId?: string | null | undefined;
    details?: unknown | undefined;
  },
): Promise<void> {
  try {
    await app.db.insert(auditLog).values({
      actorId: entry.actorId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      details: entry.details ?? null,
    });
  } catch (error) {
    app.log.error({ err: error, entry }, "failed to write audit log");
  }
}
