import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>["db"];

/** The handle a `db.transaction(...)` callback receives. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Anything that can run a query. Helpers take this so the same code works
 * inside and outside a transaction — the difference matters for correctness,
 * not for the query itself.
 */
export type DbExecutor = Database | Transaction;

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
