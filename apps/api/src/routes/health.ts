import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  /** Liveness probe for Docker and the reverse proxy. */
  app.get("/api/health", async () => ({
    status: "ok",
    uptime: Math.round(process.uptime()),
  }));
}
