import type { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { grantRoleSchema, revokeRoleSchema } from "@menu/shared";
import { userRoles, users } from "../../db/schema.js";
import { HttpError, parseBody } from "../../lib/http.js";
import { recordAudit } from "../../lib/audit.js";

/**
 * Role administration. Every route here is behind `admin`, and the only way in
 * is an existing administrator — bootstrapped by `npm run seed:admin`, which
 * runs on the server with database credentials, not through the API.
 */
export async function roleRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/admin/roles",
    { onRequest: [app.requireRole("admin")] },
    async () => {
      const rows = await app.db
        .select({
          userId: users.id,
          email: users.email,
          name: users.name,
          role: userRoles.role,
          createdAt: userRoles.createdAt,
        })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id));
      return { roles: rows };
    },
  );

  app.post("/api/admin/roles", { onRequest: [app.requireRole("admin")] }, async (request, reply) => {
    const input = parseBody(grantRoleSchema, request.body);

    const [target] = await app.db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${input.email}`)
      .limit(1);

    if (!target) throw new HttpError(404, "aucun compte avec cette adresse");

    await app.db
      .insert(userRoles)
      .values({ userId: target.id, role: input.role, grantedBy: request.user!.id })
      .onConflictDoNothing();

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "role.grant",
      resource: "user_roles",
      resourceId: target.id,
      details: { role: input.role, email: input.email },
    });

    return reply.code(201).send({ ok: true });
  });

  app.delete("/api/admin/roles", { onRequest: [app.requireRole("admin")] }, async (request) => {
    const input = parseBody(revokeRoleSchema, request.body);

    // Removing the last administrator would lock everyone out of the back
    // office with no way back in through the API.
    if (input.role === "admin") {
      const [adminCount] = await app.db
        .select({ count: sql<number>`count(*)::int` })
        .from(userRoles)
        .where(eq(userRoles.role, "admin"));
      if ((adminCount?.count ?? 0) <= 1) {
        throw new HttpError(409, "impossible de retirer le dernier administrateur");
      }
    }

    await app.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, input.userId), eq(userRoles.role, input.role)));

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "role.revoke",
      resource: "user_roles",
      resourceId: input.userId,
      details: { role: input.role },
    });

    return { ok: true };
  });
}
