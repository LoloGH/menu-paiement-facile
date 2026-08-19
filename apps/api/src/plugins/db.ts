import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createDatabase, type Database } from "../db/index.js";

/** Opens the pool at boot and closes it with the server. */
export const dbPlugin = fp(async (app: FastifyInstance) => {
  const { db, client } = createDatabase(app.config.DATABASE_URL);
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await client.end();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}
