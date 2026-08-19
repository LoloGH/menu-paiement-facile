import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { hashPassword } from "../src/lib/password.js";
import { userRoles, users } from "../src/db/schema.js";
import type { UserRole } from "@menu/shared";

/**
 * Tests run against a real PostgreSQL, not a mock.
 *
 * What is being verified here — that a role cannot be self-granted, that a
 * price cannot be forged — lives in SQL constraints and query predicates as
 * much as in TypeScript. A stubbed database would prove nothing about either.
 */
/**
 * Refuses to run against anything that is not obviously a test database.
 *
 * `resetDatabase` truncates every table. A developer with their working
 * DATABASE_URL exported would lose their data to a stray `npm test` — which is
 * exactly how this guard came to be written.
 */
function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(name)) {
    throw new Error(
      `refus de lancer les tests sur la base « ${name} » : ces tests vident toutes les tables. ` +
        `Le nom de la base doit contenir « test » (par exemple menu_test).`,
    );
  }
}

export async function createTestApp(): Promise<FastifyInstance> {
  assertTestDatabase(process.env.DATABASE_URL ?? "");
  const config = loadConfig({
    ...process.env,
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
  });
  const app = await buildApp(config);
  await app.ready();
  return app;
}

/** Empties every table, in an order the foreign keys accept. */
export async function resetDatabase(app: FastifyInstance): Promise<void> {
  await app.db.execute(sql`
    truncate table
      audit_log, payments, order_items, orders,
      menu_items, menus, articles,
      refresh_tokens, user_roles, users
    restart identity cascade
  `);
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  cookies: string;
}

/** Creates an account directly in the database, optionally with roles. */
export async function createUser(
  app: FastifyInstance,
  { email, password = "motdepasse-de-test-long", roles = [] }: {
    email: string;
    password?: string;
    roles?: UserRole[];
  },
): Promise<{ id: string; email: string; password: string }> {
  const [created] = await app.db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password), name: email })
    .returning({ id: users.id });

  if (!created) throw new Error("could not create test user");

  if (roles.length > 0) {
    await app.db.insert(userRoles).values(roles.map((role) => ({ userId: created.id, role })));
  }

  return { id: created.id, email, password };
}

/** Signs in and returns the Cookie header to replay on later requests. */
export async function login(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });

  if (response.statusCode !== 200) {
    throw new Error(`login failed for ${email}: ${response.body}`);
  }

  return (response.cookies as { name: string; value: string }[])
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/** A published menu with one article, and the ids needed to order it. */
export async function seedMenu(
  app: FastifyInstance,
  { price = 3500, serviceDate = "2026-08-17" } = {},
): Promise<{ articleId: string; menuId: string; menuItemId: string; price: number }> {
  const admin = await createUser(app, { email: `seed-${Date.now()}@test.local`, roles: ["admin"] });
  const cookies = await login(app, admin.email, admin.password);

  const articleResponse = await app.inject({
    method: "POST",
    url: "/api/admin/articles",
    headers: { cookie: cookies },
    payload: { name: "Thieboudienne", type: "main_dish", price, isAvailable: true },
  });
  const articleId = articleResponse.json().article.id as string;

  const menuResponse = await app.inject({
    method: "PUT",
    url: "/api/admin/menus",
    headers: { cookie: cookies },
    payload: {
      serviceDate,
      isPublished: true,
      items: [{ articleId, position: 0 }],
    },
  });
  const menuId = menuResponse.json().menu.id as string;

  const menus = await app.inject({ method: "GET", url: `/api/menus/${serviceDate}` });
  const menuItemId = menus.json().menu.items[0].menuItemId as string;

  return { articleId, menuId, menuItemId, price };
}
