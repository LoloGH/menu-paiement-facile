import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createDatabase } from "./index.js";
import { loadDatabaseUrl } from "../config.js";

/**
 * Applies pending migrations and exits. Run by the API container on start, so
 * a deploy never leaves the code ahead of the schema.
 */
const databaseUrl = loadDatabaseUrl();
const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

const { db, client } = createDatabase(databaseUrl, { max: 1 });

try {
  await migrate(db, { migrationsFolder });
  console.log("migrations applied");
} catch (error) {
  console.error("migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
