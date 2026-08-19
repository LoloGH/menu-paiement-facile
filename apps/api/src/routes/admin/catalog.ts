import type { FastifyInstance } from "fastify";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { articleInputSchema, menuInputSchema } from "@menu/shared";
import { articles, menuItems, menus } from "../../db/schema.js";
import { HttpError, parseBody, uuidParam } from "../../lib/http.js";
import { likePattern } from "../../lib/search.js";
import { recordAudit } from "../../lib/audit.js";

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  const canRead = app.requireRole("admin", "order_manager", "viewer", "kitchen");
  const canWrite = app.requireRole("admin");

  /* ------------------------------ articles ------------------------------ */

  app.get("/api/admin/articles", { onRequest: [canRead] }, async (request) => {
    const query = request.query as { search?: string };
    const filters: SQL[] = [];
    if (query.search) {
      filters.push(sql`${articles.name} ilike ${likePattern(query.search)}`);
    }
    const rows = await app.db
      .select()
      .from(articles)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(articles.type), asc(articles.name));
    return { articles: rows };
  });

  app.post("/api/admin/articles", { onRequest: [canWrite] }, async (request, reply) => {
    const input = parseBody(articleInputSchema, request.body);
    const [created] = await app.db
      .insert(articles)
      .values({
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        isAvailable: input.isAvailable,
      })
      .returning();

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "article.create",
      resource: "articles",
      resourceId: created?.id,
      details: { name: input.name, price: input.price },
    });

    return reply.code(201).send({ article: created });
  });

  app.put("/api/admin/articles/:id", { onRequest: [canWrite] }, async (request) => {
    const id = uuidParam(request.params, "id");
    const input = parseBody(articleInputSchema, request.body);

    const [updated] = await app.db
      .update(articles)
      .set({
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        isAvailable: input.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();

    if (!updated) throw new HttpError(404, "article introuvable");

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "article.update",
      resource: "articles",
      resourceId: id,
      details: { price: input.price },
    });

    return { article: updated };
  });

  /**
   * Articles are retired, not deleted: `menu_items.article_id` is `ON DELETE
   * RESTRICT` precisely so a dish that has appeared on a menu cannot vanish
   * from the record. Flipping availability is what "removing" means here.
   */
  app.delete("/api/admin/articles/:id", { onRequest: [canWrite] }, async (request) => {
    const id = uuidParam(request.params, "id");
    const [updated] = await app.db
      .update(articles)
      .set({ isAvailable: false, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();

    if (!updated) throw new HttpError(404, "article introuvable");

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "article.retire",
      resource: "articles",
      resourceId: id,
    });

    return { article: updated };
  });

  /* -------------------------------- menus ------------------------------- */

  app.get("/api/admin/menus", { onRequest: [canRead] }, async () => {
    const rows = await app.db.select().from(menus).orderBy(asc(menus.serviceDate));
    return { menus: rows };
  });

  /**
   * Creates or replaces the menu for a service date, lines included. Idempotent
   * on the date, which is what the editing screen needs: it always sends the
   * full desired state rather than a diff.
   */
  app.put("/api/admin/menus", { onRequest: [canWrite] }, async (request) => {
    const input = parseBody(menuInputSchema, request.body);

    const menu = await app.db.transaction(async (tx) => {
      const [saved] = await tx
        .insert(menus)
        .values({ serviceDate: input.serviceDate, isPublished: input.isPublished })
        .onConflictDoUpdate({
          target: menus.serviceDate,
          set: { isPublished: input.isPublished, updatedAt: new Date() },
        })
        .returning();

      if (!saved) throw new HttpError(500, "enregistrement du menu impossible");

      await tx.delete(menuItems).where(eq(menuItems.menuId, saved.id));

      if (input.items.length > 0) {
        await tx.insert(menuItems).values(
          input.items.map((item) => ({
            menuId: saved.id,
            articleId: item.articleId,
            priceOverride: item.priceOverride ?? null,
            position: item.position,
          })),
        );
      }

      return saved;
    });

    await recordAudit(app, {
      actorId: request.user!.id,
      action: "menu.save",
      resource: "menus",
      resourceId: menu.id,
      details: { serviceDate: input.serviceDate, items: input.items.length },
    });

    return { menu };
  });
}
