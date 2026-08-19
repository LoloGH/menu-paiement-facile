import { createInterface } from "node:readline/promises";
import { sql } from "drizzle-orm";
import { passwordSchema, emailSchema } from "@menu/shared";
import { createDatabase } from "../db/index.js";
import { userRoles, users } from "../db/schema.js";
import { hashPassword } from "../lib/password.js";
import { loadConfig } from "../config.js";

/**
 * Creates the first administrator.
 *
 * This is the only way an `admin` role comes into existence, and it runs on the
 * server with database credentials — never over the API. The old client let
 * anyone register an address containing "admin" and then insert their own
 * `user_roles` row; there is deliberately no equivalent path here.
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD when set (for automated
 * provisioning), otherwise the script prompts.
 */
const config = loadConfig();
const { db, client } = createDatabase(config.DATABASE_URL, { max: 1 });

try {
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    email ??= await rl.question("Adresse e-mail de l'administrateur : ");
    password ??= await rl.question("Mot de passe (12 caractères minimum) : ");
    rl.close();
  }

  const parsedEmail = emailSchema.parse(email);
  passwordSchema.parse(password);

  const [created] = await db
    .insert(users)
    .values({
      email: parsedEmail,
      passwordHash: await hashPassword(password),
      name: "Administrateur",
    })
    .onConflictDoNothing()
    .returning({ id: users.id });

  // The account may already exist: this script is also how an existing user is
  // promoted after a fresh deploy.
  const existing = created
    ? undefined
    : (
        await db
          .select({ id: users.id })
          .from(users)
          .where(sql`lower(${users.email}) = ${parsedEmail}`)
          .limit(1)
      )[0];

  const userId = created?.id ?? existing?.id;
  if (!userId) throw new Error("could not create or find the account");

  await db.insert(userRoles).values({ userId, role: "admin" }).onConflictDoNothing();

  console.log(`administrateur prêt : ${parsedEmail}`);
} catch (error) {
  console.error("échec :", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
