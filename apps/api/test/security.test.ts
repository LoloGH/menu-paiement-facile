import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { orders, payments, userRoles } from "../src/db/schema.js";
import { createTestApp, createUser, login, resetDatabase, seedMenu } from "./helpers.js";

/**
 * These cover the four holes the rewrite exists to close. Each one describes an
 * attack that worked against the previous application.
 */
describe("sécurité", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  describe("escalade de privilèges", () => {
    it("n'accorde aucun rôle à une inscription, quels que soient les champs envoyés", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "admin-pirate@evil.com",
          password: "motdepasse-tres-long",
          name: "Pirate",
          // The old dialog accepted any address containing "admin" and then
          // inserted its own user_roles row.
          role: "admin",
          roles: ["admin"],
          isAdmin: true,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().user.roles).toEqual([]);

      const stored = await app.db.select().from(userRoles);
      expect(stored).toHaveLength(0);
    });

    it("refuse à un compte sans rôle toutes les routes d'écriture d'administration", async () => {
      const user = await createUser(app, { email: "simple@test.local" });
      const cookies = await login(app, user.email, user.password);

      const attempts = [
        { method: "POST" as const, url: "/api/admin/roles", payload: { email: user.email, role: "admin" } },
        { method: "POST" as const, url: "/api/admin/articles", payload: { name: "X", type: "main_dish", price: 100 } },
        { method: "PUT" as const, url: "/api/admin/menus", payload: { serviceDate: "2026-08-17", items: [] } },
        { method: "GET" as const, url: "/api/admin/users" },
        { method: "GET" as const, url: "/api/admin/audit" },
      ];

      for (const attempt of attempts) {
        const response = await app.inject({ ...attempt, headers: { cookie: cookies } });
        expect(response.statusCode, `${attempt.method} ${attempt.url}`).toBe(403);
      }
    });

    it("refuse de retirer le dernier administrateur", async () => {
      const admin = await createUser(app, { email: "admin@test.local", roles: ["admin"] });
      const cookies = await login(app, admin.email, admin.password);

      const response = await app.inject({
        method: "DELETE",
        url: "/api/admin/roles",
        headers: { cookie: cookies },
        payload: { userId: admin.id, role: "admin" },
      });

      expect(response.statusCode).toBe(409);
      expect(await app.db.select().from(userRoles)).toHaveLength(1);
    });
  });

  describe("montant de la commande", () => {
    it("facture le prix de la base, pas celui envoyé par le client", async () => {
      const { menuItemId, price } = await seedMenu(app, { price: 3500 });
      const customer = await createUser(app, { email: "client@test.local" });
      const cookies = await login(app, customer.email, customer.password);

      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: cookies },
        payload: {
          items: [{ menuItemId, quantity: 2 }],
          // Everything a tampered client might try.
          totalAmount: 1,
          price: 1,
          unitPrice: 1,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().order.totalAmount).toBe(price * 2);
      expect(response.json().order.items[0].unitPrice).toBe(price);
    });

    it("refuse un prix décimal plutôt que de l'arrondir en silence", async () => {
      const admin = await createUser(app, { email: "admin@test.local", roles: ["admin"] });
      const cookies = await login(app, admin.email, admin.password);

      const response = await app.inject({
        method: "POST",
        url: "/api/admin/articles",
        headers: { cookie: cookies },
        payload: { name: "X", type: "main_dish", price: 1500.75 },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.stringify(response.json())).toContain("entier");
    });
  });

  describe("confirmation du paiement", () => {
    it("crée toute commande impayée et n'offre aucun chemin client vers « payée »", async () => {
      const { menuItemId } = await seedMenu(app);
      const customer = await createUser(app, { email: "client@test.local" });
      const cookies = await login(app, customer.email, customer.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: cookies },
        payload: { items: [{ menuItemId, quantity: 1 }] },
      });
      const orderId = created.json().order.id as string;
      expect(created.json().order.paymentStatus).toBe("pending");

      const confirm = await app.inject({
        method: "POST",
        url: `/api/payments/${orderId}/confirm`,
        headers: { cookie: cookies },
        payload: {},
      });
      expect(confirm.statusCode).toBe(403);

      const [stored] = await app.db.select().from(orders).where(eq(orders.id, orderId));
      expect(stored?.paymentStatus).toBe("pending");
    });

    it("rejette un webhook non vérifiable", async () => {
      const { menuItemId } = await seedMenu(app);
      const customer = await createUser(app, { email: "client@test.local" });
      const cookies = await login(app, customer.email, customer.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: cookies },
        payload: { items: [{ menuItemId, quantity: 1 }] },
      });
      const receiptId = created.json().order.receiptId as string;

      const webhook = await app.inject({
        method: "POST",
        url: `/api/payments/${app.payments.name}/webhook`,
        payload: { reference: receiptId, status: "paid" },
      });
      expect(webhook.statusCode).toBe(404);

      const signed = await app.inject({
        method: "POST",
        url: `/api/payments/webhook/${app.payments.name}`,
        payload: { reference: receiptId, status: "paid" },
      });
      // Neither shipped provider can verify a callback, so none is accepted.
      expect(signed.statusCode).toBe(400);
    });

    it("laisse un administrateur confirmer, une seule fois", async () => {
      const { menuItemId } = await seedMenu(app);
      const customer = await createUser(app, { email: "client@test.local" });
      const customerCookies = await login(app, customer.email, customer.password);
      const admin = await createUser(app, { email: "boss@test.local", roles: ["order_manager"] });
      const adminCookies = await login(app, admin.email, admin.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: customerCookies },
        payload: { items: [{ menuItemId, quantity: 1 }] },
      });
      const orderId = created.json().order.id as string;

      const first = await app.inject({
        method: "POST",
        url: `/api/payments/${orderId}/confirm`,
        headers: { cookie: adminCookies },
        payload: { reference: "WAVE-1" },
      });
      expect(first.statusCode).toBe(200);
      expect(first.json().order.paymentStatus).toBe("paid");

      const second = await app.inject({
        method: "POST",
        url: `/api/payments/${orderId}/confirm`,
        headers: { cookie: adminCookies },
        payload: {},
      });
      expect(second.statusCode).toBe(409);
    });
  });

  describe("montant annoncé par une passerelle", () => {
    it("laisse la commande impayée si le rappel annonce moins que le total", async () => {
      const { menuItemId } = await seedMenu(app, { price: 3500 });
      const customer = await createUser(app, { email: "client@test.local" });
      const cookies = await login(app, customer.email, customer.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: cookies },
        payload: { items: [{ menuItemId, quantity: 2 }] },
      });
      const order = created.json().order as { id: string; receiptId: string; totalAmount: number };
      expect(order.totalAmount).toBe(7000);

      // Stand in for a gateway that verifies its callback but reports a
      // partial — or tampered — amount.
      const original = app.payments.verifyWebhook;
      app.payments.verifyWebhook = async () => ({
        reference: order.receiptId,
        status: "paid" as const,
        amount: 100,
        raw: {},
      });

      try {
        await app.db.insert(payments).values({
          orderId: order.id,
          provider: app.payments.name,
          providerReference: order.receiptId,
          amount: order.totalAmount,
          status: "pending",
        });

        const response = await app.inject({
          method: "POST",
          url: `/api/payments/webhook/${app.payments.name}`,
          payload: { cpm_trans_id: order.receiptId },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().settled).toBe(false);

        const [stored] = await app.db.select().from(orders).where(eq(orders.id, order.id));
        expect(stored?.paymentStatus).toBe("pending");
      } finally {
        app.payments.verifyWebhook = original;
      }
    });

    it("solde la commande quand le montant correspond", async () => {
      const { menuItemId } = await seedMenu(app, { price: 3500 });
      const customer = await createUser(app, { email: "client@test.local" });
      const cookies = await login(app, customer.email, customer.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: cookies },
        payload: { items: [{ menuItemId, quantity: 1 }] },
      });
      const order = created.json().order as { id: string; receiptId: string; totalAmount: number };

      const original = app.payments.verifyWebhook;
      app.payments.verifyWebhook = async () => ({
        reference: order.receiptId,
        status: "paid" as const,
        amount: order.totalAmount,
        raw: {},
      });

      try {
        await app.db.insert(payments).values({
          orderId: order.id,
          provider: app.payments.name,
          providerReference: order.receiptId,
          amount: order.totalAmount,
          status: "pending",
        });

        const response = await app.inject({
          method: "POST",
          url: `/api/payments/webhook/${app.payments.name}`,
          payload: { cpm_trans_id: order.receiptId },
        });

        expect(response.json().settled).toBe(true);

        const [stored] = await app.db.select().from(orders).where(eq(orders.id, order.id));
        expect(stored?.paymentStatus).toBe("paid");
      } finally {
        app.payments.verifyWebhook = original;
      }
    });
  });

  describe("cloisonnement des commandes", () => {
    it("empêche un client de lire la commande d'un autre", async () => {
      const { menuItemId } = await seedMenu(app);
      const alice = await createUser(app, { email: "alice@test.local" });
      const bob = await createUser(app, { email: "bob@test.local" });
      const aliceCookies = await login(app, alice.email, alice.password);
      const bobCookies = await login(app, bob.email, bob.password);

      const created = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { cookie: aliceCookies },
        payload: { items: [{ menuItemId, quantity: 1 }] },
      });
      const orderId = created.json().order.id as string;

      const asBob = await app.inject({
        method: "GET",
        url: `/api/orders/${orderId}`,
        headers: { cookie: bobCookies },
      });
      expect(asBob.statusCode).toBe(404);

      const bobList = await app.inject({
        method: "GET",
        url: "/api/orders/mine",
        headers: { cookie: bobCookies },
      });
      expect(bobList.json().orders).toHaveLength(0);
    });
  });

  describe("recherche", () => {
    it("traite les charges d'injection comme du texte", async () => {
      const admin = await createUser(app, { email: "admin@test.local", roles: ["admin"] });
      const cookies = await login(app, admin.email, admin.password);

      // The legacy client interpolated this straight into a PostgREST filter.
      const payloads = ["a,b", "%", "_", "x')--", "*", "a,payment_status.eq.paid"];

      for (const payload of payloads) {
        const response = await app.inject({
          method: "GET",
          url: `/api/admin/orders?search=${encodeURIComponent(payload)}`,
          headers: { cookie: cookies },
        });
        expect(response.statusCode, payload).toBe(200);
      }
    });
  });

  describe("identifiants malformés", () => {
    it("répond 400 plutôt que 500 sur un UUID invalide", async () => {
      const admin = await createUser(app, { email: "admin@test.local", roles: ["admin"] });
      const cookies = await login(app, admin.email, admin.password);

      const response = await app.inject({
        method: "GET",
        url: "/api/orders/pas-un-uuid",
        headers: { cookie: cookies },
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
