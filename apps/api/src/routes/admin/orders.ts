import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { orderQuerySchema, updateFulfillmentSchema } from "@menu/shared";
import { orderItems, orders, users } from "../../db/schema.js";
import { HttpError, parseBody } from "../../lib/http.js";
import { likePattern } from "../../lib/search.js";
import { recordAudit } from "../../lib/audit.js";
import { publishOrderEvent } from "../../lib/events.js";

export async function adminOrderRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/admin/orders",
    { onRequest: [app.requireRole("admin", "order_manager", "viewer", "kitchen")] },
    async (request) => {
      const query = orderQuerySchema.parse(request.query);

      const filters: SQL[] = [];
      if (query.paymentStatus) filters.push(eq(orders.paymentStatus, query.paymentStatus));
      if (query.fulfillmentStatus) {
        filters.push(eq(orders.fulfillmentStatus, query.fulfillmentStatus));
      }
      if (query.from) filters.push(gte(sql`${orders.createdAt}::date`, query.from));
      if (query.to) filters.push(lte(sql`${orders.createdAt}::date`, query.to));
      if (query.search) {
        // Bound parameter, not string interpolation.
        const pattern = likePattern(query.search);
        const clause = or(
          sql`${orders.receiptId} ilike ${pattern}`,
          sql`${orders.guestName} ilike ${pattern}`,
          sql`${users.email} ilike ${pattern}`,
          sql`${users.name} ilike ${pattern}`,
        );
        if (clause) filters.push(clause);
      }

      const where = filters.length ? and(...filters) : undefined;
      const offset = (query.page - 1) * query.pageSize;

      const rows = await app.db
        .select({
          order: orders,
          customerEmail: users.email,
          customerName: users.name,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(query.pageSize)
        .offset(offset);

      const [totalRow] = await app.db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(where);

      const items = rows.length
        ? await app.db
            .select()
            .from(orderItems)
            .where(
              inArray(
                orderItems.orderId,
                rows.map((row) => row.order.id),
              ),
            )
        : [];

      return {
        orders: rows.map((row) => ({
          ...row.order,
          customerEmail: row.customerEmail,
          customerName: row.customerName,
          items: items.filter((item) => item.orderId === row.order.id),
        })),
        page: query.page,
        pageSize: query.pageSize,
        total: totalRow?.count ?? 0,
      };
    },
  );

  /**
   * Kitchen progress. Deliberately separate from the payment status, and open
   * to the `kitchen` role, which has no business touching money.
   */
  app.patch(
    "/api/admin/orders/:id/fulfillment",
    { onRequest: [app.requireRole("admin", "order_manager", "kitchen")] },
    async (request) => {
      const { id } = request.params as { id: string };
      const input = parseBody(updateFulfillmentSchema, request.body);

      const [updated] = await app.db
        .update(orders)
        .set({ fulfillmentStatus: input.fulfillmentStatus, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) throw new HttpError(404, "commande introuvable");

      await recordAudit(app, {
        actorId: request.user!.id,
        action: "order.fulfillment",
        resource: "orders",
        resourceId: id,
        details: { to: input.fulfillmentStatus },
      });

      await publishOrderEvent(app, { type: "order.updated", orderId: id });

      return { order: updated };
    },
  );
}
