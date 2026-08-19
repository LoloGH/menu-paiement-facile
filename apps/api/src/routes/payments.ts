import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { confirmPaymentSchema } from "@menu/shared";
import { orders, payments } from "../db/schema.js";
import { HttpError, parseBody, uuidParam } from "../lib/http.js";
import { recordAudit } from "../lib/audit.js";
import { publishOrderEvent } from "../lib/events.js";

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Opens a payment attempt for an order and says where to send the customer.
   *
   * Records the attempt whatever the provider answers, so an order that was
   * paid outside the system can still be reconciled against a trace.
   */
  app.post("/api/payments/:orderId/checkout", { onRequest: [app.requireAuth] }, async (request) => {
    const orderId = uuidParam(request.params, "orderId");
    const isStaff = request.user!.roles.length > 0;

    const [order] = await app.db
      .select()
      .from(orders)
      .where(
        isStaff ? eq(orders.id, orderId) : and(eq(orders.id, orderId), eq(orders.userId, request.user!.id)),
      )
      .limit(1);

    if (!order) throw new HttpError(404, "commande introuvable");
    if (order.paymentStatus === "paid") throw new HttpError(409, "commande déjà payée");

    const checkout = await app.payments.createCheckout({
      id: order.id,
      receiptId: order.receiptId,
      // The amount comes from the stored order, never from the request.
      totalAmount: order.totalAmount,
    });

    await app.db.insert(payments).values({
      orderId: order.id,
      provider: app.payments.name,
      providerReference: checkout.reference,
      amount: order.totalAmount,
      status: "pending",
    }).onConflictDoNothing();

    return {
      redirectUrl: checkout.redirectUrl,
      // The client uses this to say plainly whether the payment will be
      // confirmed automatically or by the restaurant.
      requiresManualConfirmation: !checkout.selfVerifying,
      amount: order.totalAmount,
    };
  });

  /**
   * Marks a payment received, by a human who checked it.
   *
   * This is the only route that can move an order to `paid`, and it is the
   * reason the URL-based confirmation could be removed outright.
   */
  app.post(
    "/api/payments/:orderId/confirm",
    { onRequest: [app.requireRole("admin", "order_manager")] },
    async (request) => {
      const orderId = uuidParam(request.params, "orderId");
      const input = parseBody(confirmPaymentSchema, request.body);
      const actorId = request.user!.id;

      const updated = await app.db.transaction(async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order) throw new HttpError(404, "commande introuvable");
        if (order.paymentStatus === "paid") throw new HttpError(409, "commande déjà payée");

        const [saved] = await tx
          .update(orders)
          .set({ paymentStatus: "paid", updatedAt: new Date() })
          .where(eq(orders.id, orderId))
          .returning();

        await tx.insert(payments).values({
          orderId,
          provider: app.payments.name,
          providerReference: input.reference ?? null,
          amount: order.totalAmount,
          status: "paid",
          confirmedBy: actorId,
          confirmedAt: new Date(),
        });

        return saved!;
      });

      await recordAudit(app, {
        actorId,
        action: "payment.confirm",
        resource: "orders",
        resourceId: orderId,
        details: { amount: updated.totalAmount, reference: input.reference ?? null },
      });

      await publishOrderEvent(app, { type: "order.paid", orderId });

      return { order: updated };
    },
  );

  /**
   * Where a gateway's callback will land.
   *
   * Wired up and tested now so that adding a provider is only a matter of
   * implementing `verifyWebhook`. Both providers shipped today return null,
   * so every call is rejected — an unsigned webhook must never be able to mark
   * an order paid.
   */
  app.post(
    "/api/payments/webhook/:provider",
    {
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
      // The raw body is needed to check a signature over the exact bytes sent.
      onRequest: [],
    },
    async (request, reply) => {
      const { provider } = request.params as { provider: string };

      if (provider !== app.payments.name) {
        throw new HttpError(404, "fournisseur inconnu");
      }

      const headers = request.headers as Record<string, string | undefined>;
      const rawBody = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {});

      const event = await app.payments.verifyWebhook(headers, rawBody);
      if (!event) {
        request.log.warn({ provider }, "webhook rejected");
        return reply.code(400).send({ error: "webhook non vérifiable" });
      }

      const [attempt] = await app.db
        .select()
        .from(payments)
        .where(
          and(eq(payments.provider, provider), eq(payments.providerReference, event.reference)),
        )
        .limit(1);

      if (!attempt) throw new HttpError(404, "paiement inconnu");

      await app.db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({ status: event.status, rawPayload: event.raw, updatedAt: new Date() })
          .where(eq(payments.id, attempt.id));

        if (event.status === "paid") {
          await tx
            .update(orders)
            .set({ paymentStatus: "paid", updatedAt: new Date() })
            .where(eq(orders.id, attempt.orderId));
        }
      });

      await publishOrderEvent(app, { type: "order.paid", orderId: attempt.orderId });
      return { ok: true };
    },
  );
}
