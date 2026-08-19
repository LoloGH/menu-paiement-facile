import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createOrderSchema } from "@menu/shared";
import { articles, menuItems, menus, orderItems, orders, payments } from "../db/schema.js";
import type { DbExecutor } from "../db/index.js";
import { HttpError, parseBody, uuidParam } from "../lib/http.js";
import { generateReceiptId } from "../lib/receipt.js";
import { publishOrderEvent } from "../lib/events.js";

/**
 * Builds the order lines from the database.
 *
 * This is the whole point of the rewrite: the request says *what* was ordered,
 * never *what it costs*. Prices, names and types are read here, inside the
 * transaction, so a tampered payload buys nothing at a discount and a price
 * changed mid-session cannot be exploited.
 */
async function resolveLines(
  tx: DbExecutor,
  requested: { menuItemId: string; quantity: number }[],
) {
  const ids = [...new Set(requested.map((item) => item.menuItemId))];

  const rows = await tx
    .select({
      menuItemId: menuItems.id,
      menuId: menus.id,
      serviceDate: menus.serviceDate,
      isPublished: menus.isPublished,
      articleId: articles.id,
      articleName: articles.name,
      articleType: articles.type,
      isAvailable: articles.isAvailable,
      effectivePrice: sql<number>`coalesce(${menuItems.priceOverride}, ${articles.price})`,
    })
    .from(menuItems)
    .innerJoin(menus, eq(menuItems.menuId, menus.id))
    .innerJoin(articles, eq(menuItems.articleId, articles.id))
    .where(inArray(menuItems.id, ids));

  const byId = new Map(rows.map((row) => [row.menuItemId, row]));

  const lines = requested.map((item) => {
    const row = byId.get(item.menuItemId);
    if (!row) throw new HttpError(400, `article de menu introuvable : ${item.menuItemId}`);
    if (!row.isPublished) throw new HttpError(400, `« ${row.articleName} » n'est pas au menu`);
    if (!row.isAvailable) throw new HttpError(409, `« ${row.articleName} » n'est plus disponible`);

    return {
      articleId: row.articleId,
      menuId: row.menuId,
      articleName: row.articleName,
      articleType: row.articleType,
      // Coalesced in SQL, so a numeric type comes back as a string on some
      // drivers; normalise before it reaches an integer column.
      unitPrice: Number(row.effectivePrice),
      quantity: item.quantity,
      serviceDate: row.serviceDate,
    };
  });

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return { lines, total };
}

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/orders",
    {
      onRequest: [app.requireAuth],
      config: { rateLimit: app.limit(20, "1 minute") },
    },
    async (request, reply) => {
      const input = parseBody(createOrderSchema, request.body);
      const userId = request.user!.id;

      const order = await app.db.transaction(async (tx) => {
        const { lines, total } = await resolveLines(tx, input.items);

        const [created] = await tx
          .insert(orders)
          .values({
            receiptId: generateReceiptId(),
            userId,
            totalAmount: total,
            tableNumber: input.tableNumber ?? null,
            customerNote: input.customerNote ?? null,
            guestName: input.guestName ?? null,
            guestPhone: input.guestPhone ?? null,
            paymentStatus: "pending",
            fulfillmentStatus: "new",
          })
          .returning();

        if (!created) throw new HttpError(500, "création de la commande impossible");

        await tx.insert(orderItems).values(
          lines.map((line) => ({
            orderId: created.id,
            articleId: line.articleId,
            menuId: line.menuId,
            articleName: line.articleName,
            articleType: line.articleType,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            serviceDate: line.serviceDate,
          })),
        );

        return { ...created, items: lines };
      });

      request.log.info({ orderId: order.id, total: order.totalAmount }, "order created");
      // Published after the transaction commits, so a screen that reacts to the
      // event finds the order already readable.
      await publishOrderEvent(app, { type: "order.created", orderId: order.id });
      return reply.code(201).send({ order });
    },
  );

  /** A customer's own orders. Never anyone else's. */
  app.get("/api/orders/mine", { onRequest: [app.requireAuth] }, async (request) => {
    const rows = await app.db
      .select()
      .from(orders)
      .where(eq(orders.userId, request.user!.id))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const items = rows.length
      ? await app.db
          .select()
          .from(orderItems)
          .where(
            inArray(
              orderItems.orderId,
              rows.map((row) => row.id),
            ),
          )
      : [];

    return {
      orders: rows.map((order) => ({
        ...order,
        items: items.filter((item) => item.orderId === order.id),
      })),
    };
  });

  app.get("/api/orders/:id", { onRequest: [app.requireAuth] }, async (request) => {
    const id = uuidParam(request.params, "id");
    const isStaff = request.user!.roles.some((role) =>
      ["admin", "order_manager", "kitchen", "viewer"].includes(role),
    );

    const [order] = await app.db
      .select()
      .from(orders)
      .where(
        // Staff may read any order; a customer only their own. Expressed in the
        // query rather than after the fetch, so there is no window where the
        // row exists in memory before the check.
        isStaff ? eq(orders.id, id) : and(eq(orders.id, id), eq(orders.userId, request.user!.id)),
      )
      .limit(1);

    if (!order) throw new HttpError(404, "commande introuvable");

    const items = await app.db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const attempts = await app.db
      .select({
        id: payments.id,
        provider: payments.provider,
        status: payments.status,
        amount: payments.amount,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.orderId, order.id));

    return { order: { ...order, items, payments: attempts } };
  });
}
