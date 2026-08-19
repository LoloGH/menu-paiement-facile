import type { FastifyInstance } from "fastify";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { serviceDateSchema, toDateOnly } from "@menu/shared";
import { articles, menuItems, menus } from "../db/schema.js";
import { HttpError } from "../lib/http.js";

/** Menu with its lines and their effective prices, ready to render. */
async function loadMenus(app: FastifyInstance, from: string, to: string, publishedOnly: boolean) {
  const rows = await app.db
    .select({
      menuId: menus.id,
      serviceDate: menus.serviceDate,
      isPublished: menus.isPublished,
      menuItemId: menuItems.id,
      position: menuItems.position,
      articleId: articles.id,
      name: articles.name,
      description: articles.description,
      type: articles.type,
      imageUrl: articles.imageUrl,
      isAvailable: articles.isAvailable,
      price: sql<number>`coalesce(${menuItems.priceOverride}, ${articles.price})`,
    })
    .from(menus)
    .leftJoin(menuItems, eq(menuItems.menuId, menus.id))
    .leftJoin(articles, eq(menuItems.articleId, articles.id))
    .where(
      publishedOnly
        ? and(gte(menus.serviceDate, from), lte(menus.serviceDate, to), eq(menus.isPublished, true))
        : and(gte(menus.serviceDate, from), lte(menus.serviceDate, to)),
    )
    .orderBy(asc(menus.serviceDate), asc(menuItems.position));

  const byMenu = new Map<
    string,
    { id: string; serviceDate: string; isPublished: boolean; items: unknown[] }
  >();

  for (const row of rows) {
    let menu = byMenu.get(row.menuId);
    if (!menu) {
      menu = {
        id: row.menuId,
        serviceDate: row.serviceDate,
        isPublished: row.isPublished,
        items: [],
      };
      byMenu.set(row.menuId, menu);
    }
    // leftJoin yields one all-null row for a menu with no lines yet.
    if (row.menuItemId && row.articleId) {
      menu.items.push({
        menuItemId: row.menuItemId,
        articleId: row.articleId,
        name: row.name,
        description: row.description,
        type: row.type,
        imageUrl: row.imageUrl,
        isAvailable: row.isAvailable,
        price: Number(row.price),
        position: row.position,
      });
    }
  }

  return [...byMenu.values()];
}

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  /**
   * The public week. Anonymous: browsing the menu must not require an account.
   * Only published menus are exposed, so a draft cannot be read by guessing.
   */
  app.get("/api/menus/current", async (request) => {
    const query = request.query as { from?: string; to?: string };

    const today = new Date();
    const monday = new Date(today);
    // getDay(): 0 is Sunday. Shift so the week starts on Monday.
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const from = query.from ? serviceDateSchema.parse(query.from) : toDateOnly(monday);
    const to = query.to ? serviceDateSchema.parse(query.to) : toDateOnly(sunday);

    return { menus: await loadMenus(app, from, to, true) };
  });

  app.get("/api/menus/:date", async (request) => {
    const { date } = request.params as { date: string };
    const serviceDate = serviceDateSchema.parse(date);
    const [menu] = await loadMenus(app, serviceDate, serviceDate, true);
    if (!menu) throw new HttpError(404, "aucun menu publié pour cette date");
    return { menu };
  });

  /** Catalogue of available articles, used by the ordering screens. */
  app.get("/api/articles", async () => {
    const rows = await app.db
      .select()
      .from(articles)
      .where(eq(articles.isAvailable, true))
      .orderBy(asc(articles.type), asc(articles.name));
    return { articles: rows };
  });
}

export { loadMenus };
