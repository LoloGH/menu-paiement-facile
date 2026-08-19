import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>["db"];

/**
 * Opens the connection pool. Returns the Drizzle handle together with the
 * underlying client so callers can close it — tests and one-shot scripts need
 * the process to exit.
 */
export function createDatabase(url: string, { max = 10 }: { max?: number } = {}) {
  const client = postgres(url, { max });
  const db = drizzle(client, { schema });
  return { db, client };
}

export * as schema from "./schema.js";
