import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export interface OrderEvent {
  type: "order.created" | "order.updated" | "order.paid";
  orderId: string;
}

const CHANNEL = "order_events";

/**
 * Broadcasts an order change over PostgreSQL `NOTIFY`.
 *
 * The kitchen screens subscribe through a single `LISTEN` connection and are
 * pushed over SSE, which replaces both the Supabase Realtime channel and the
 * three hand-rolled 30-second polling loops the old client ran.
 *
 * Never throws: a missed notification degrades to a slightly later refresh, and
 * must not fail the request that caused it.
 */
export async function publishOrderEvent(app: FastifyInstance, event: OrderEvent): Promise<void> {
  try {
    await app.db.execute(sql`select pg_notify(${CHANNEL}, ${JSON.stringify(event)})`);
  } catch (error) {
    app.log.error({ err: error, event }, "failed to publish order event");
  }
}

export { CHANNEL as ORDER_EVENT_CHANNEL };
