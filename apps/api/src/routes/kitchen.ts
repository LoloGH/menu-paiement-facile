import type { FastifyInstance } from "fastify";

/**
 * Server-sent events for the kitchen and back-office screens.
 *
 * Replaces the Supabase realtime channel and the three 30-second polling loops
 * the old client ran. SSE rather than WebSocket: the traffic is one-way, the
 * browser reconnects on its own, and it survives an HTTP reverse proxy without
 * an upgrade dance — which matters here, since Apache fronts the API.
 */
export async function kitchenRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/kitchen/stream",
    { onRequest: [app.requireRole("admin", "order_manager", "kitchen", "viewer")] },
    async (request, reply) => {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Tells nginx-style proxies not to buffer; harmless elsewhere.
        "X-Accel-Buffering": "no",
      });

      const send = (event: string) => {
        reply.raw.write(`data: ${event}\n\n`);
      };

      send(JSON.stringify({ type: "connected" }));

      const unsubscribe = app.onOrderEvent(send);

      // Reverse proxies drop connections that go quiet. A comment line every
      // 25 seconds keeps the stream open without being delivered as an event.
      const heartbeat = setInterval(() => reply.raw.write(": ping\n\n"), 25_000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });

      // Never resolves: the reply stays open until the client disconnects.
      return new Promise<void>(() => {});
    },
  );
}
