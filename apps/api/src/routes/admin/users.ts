import type { FastifyInstance } from "fastify";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { auditLog, userRoles, users } from "../../db/schema.js";
import { HttpError } from "../../lib/http.js";
import { likePattern } from "../../lib/search.js";
import { recordAudit } from "../../lib/audit.js";

export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/admin/users",
    { onRequest: [app.requireRole("admin", "viewer")] },
    async (request) => {
      const query = request.query as { search?: string; page?: string; pageSize?: string };
      const page = Math.max(1, Number(query.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25) || 25));

      const filters: SQL[] = [];
      if (query.search) {
        const pattern = likePattern(query.search);
        filters.push(
          sql`(${users.email} ilike ${pattern} or ${users.name} ilike ${pattern} or ${users.phone} ilike ${pattern})`,
        );
      }
      const where = filters.length ? and(...filters) : undefined;

      const rows = await app.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          loyaltyNumber: users.loyaltyNumber,
          disabledAt: users.disabledAt,
          createdAt: users.createdAt,
          // Password hashes are never selected, so they cannot leak through a
          // response shape change.
          roles: sql<string[]>`coalesce(array_agg(${userRoles.role}) filter (where ${userRoles.role} is not null), '{}')`,
        })
        .from(users)
        .leftJoin(userRoles, eq(userRoles.userId, users.id))
        .where(where)
        .groupBy(users.id)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [totalRow] = await app.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where);

      return { users: rows, page, pageSize, total: totalRow?.count ?? 0 };
    },
  );

  /**
   * Disabling rather than deleting: orders reference the account, and a removed
   * customer would take their history with them.
   */
  app.post(
    "/api/admin/users/:id/disable",
    { onRequest: [app.requireRole("admin")] },
    async (request) => {
      const { id } = request.params as { id: string };
      if (id === request.user!.id) {
        throw new HttpError(409, "impossible de désactiver son propre compte");
      }

      const [updated] = await app.db
        .update(users)
        .set({ disabledAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id, email: users.email, disabledAt: users.disabledAt });

      if (!updated) throw new HttpError(404, "compte introuvable");

      await recordAudit(app, {
        actorId: request.user!.id,
        action: "user.disable",
        resource: "users",
        resourceId: id,
      });

      return { user: updated };
    },
  );

  app.post(
    "/api/admin/users/:id/enable",
    { onRequest: [app.requireRole("admin")] },
    async (request) => {
      const { id } = request.params as { id: string };
      const [updated] = await app.db
        .update(users)
        .set({ disabledAt: null, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id, email: users.email, disabledAt: users.disabledAt });

      if (!updated) throw new HttpError(404, "compte introuvable");

      await recordAudit(app, {
        actorId: request.user!.id,
        action: "user.enable",
        resource: "users",
        resourceId: id,
      });

      return { user: updated };
    },
  );

  app.get("/api/admin/audit", { onRequest: [app.requireRole("admin")] }, async (request) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? 50) || 50));

    const rows = await app.db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        details: auditLog.details,
        createdAt: auditLog.createdAt,
        actorEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.actorId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { entries: rows, page, pageSize };
  });
}
