import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import postgres from "postgres";
import { ORDER_EVENT_CHANNEL } from "../lib/events.js";

type Listener = (payload: string) => void;

/**
 * A single PostgreSQL LISTEN connection, fanned out to every open SSE stream.
 *
 * One connection for the whole process, not one per viewer: a kitchen with four
 * screens open must not hold four idle database connections. `LISTEN` also
 * needs a dedicated connection — it cannot share the pooled one used for
 * queries, because the pool hands connections back out between statements.
 */
export const eventsPlugin = fp(async (app: FastifyInstance) => {
  const listeners = new Set<Listener>();
  const client = postgres(app.config.DATABASE_URL, { max: 1 });

  const subscription = await client.listen(ORDER_EVENT_CHANNEL, (payload) => {
    for (const listener of listeners) {
      try {
        listener(payload);
      } catch (error) {
        app.log.error({ err: error }, "SSE listener failed");
      }
    }
  });

  app.decorate("onOrderEvent", (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  });

  app.addHook("onClose", async () => {
    listeners.clear();
    await subscription.unlisten();
    await client.end();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    /** Registers a listener and returns the function that removes it. */
    onOrderEvent: (listener: Listener) => () => void;
  }
}
