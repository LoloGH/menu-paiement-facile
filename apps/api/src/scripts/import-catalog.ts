import { readFile } from "node:fs/promises";
import { z } from "zod";
import { ARTICLE_TYPES } from "@menu/shared";
import { createDatabase } from "../db/index.js";
import { articles, menuItems, menus } from "../db/schema.js";
import { loadDatabaseUrl } from "../config.js";

/**
 * Imports the catalogue exported from the old Supabase project.
 *
 * Only articles and menus are migrated: accounts, orders and the audit trail
 * start fresh, as agreed. Original UUIDs are preserved so the two legacy
 * representations of a menu line up and so re-running the import is a no-op
 * rather than a duplication.
 *
 *   npm run import:catalog -w @menu/api -- catalog.json [--dry-run]
 */

/*
 * The legacy shapes, as they come out of PostgREST. Everything is permissive:
 * this data was written by an application with no server-side validation, so
 * the import has to survive nulls and stray types rather than assume them away.
 */
const legacyArticle = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullish(),
  price: z.coerce.number(),
  type: z.string(),
  image_url: z.string().nullish(),
});

const legacyWeeklyMenu = z.object({
  id: z.string().uuid(),
  date: z.string(),
  /** French weekday name, e.g. "Lundi". The join key for `menu_articles`. */
  day: z.string().nullish(),
  is_active: z.boolean().nullish(),
});

const legacyMenuArticle = z.object({
  id: z.string().uuid(),
  article_id: z.string().uuid().nullish(),
  /** Holds the weekday name, not a date and not a menu id. */
  menu_day: z.string(),
});

const legacyMenuItem = z.object({
  id: z.string().uuid(),
  menu_id: z.string().uuid().nullish(),
  article_id: z.string().uuid().nullish(),
});

const catalogSchema = z.object({
  articles: z.array(legacyArticle).default([]),
  weekly_menus: z.array(legacyWeeklyMenu).default([]),
  menu_articles: z.array(legacyMenuArticle).default([]),
  menu_items: z.array(legacyMenuItem).default([]),
});

const warnings: string[] = [];
function warn(message: string) {
  warnings.push(message);
}

function toArticleType(value: string): (typeof ARTICLE_TYPES)[number] {
  if ((ARTICLE_TYPES as readonly string[]).includes(value)) {
    return value as (typeof ARTICLE_TYPES)[number];
  }
  warn(`type d'article inconnu « ${value} », rangé dans « other »`);
  return "other";
}

/** FCFA has no minor unit; the legacy column was numeric and could hold cents. */
function toWholeFrancs(value: number, label: string): number {
  const rounded = Math.round(value);
  if (rounded !== value) {
    warn(`prix décimal ${value} pour « ${label} », arrondi à ${rounded} FCFA`);
  }
  return Math.max(0, rounded);
}

/** `2026-08-19T00:00:00+00:00` or `2026-08-19` → `2026-08-19`. */
function toDateOnly(value: string, label: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (!match?.[1]) {
    warn(`date illisible « ${value} » pour ${label}, menu ignoré`);
    return null;
  }
  return match[1];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const path = args.find((arg) => !arg.startsWith("--"));

  if (!path) {
    console.error("usage : import-catalog.ts <catalog.json> [--dry-run]");
    process.exitCode = 1;
    return;
  }

  const raw = JSON.parse(await readFile(path, "utf8"));
  // Accepts both the single-object export and the four-files-merged shape.
  const catalog = catalogSchema.parse(raw.catalog ?? raw);

  /* ---------------------------- articles ------------------------------- */

  const articleRows = catalog.articles.map((article) => ({
    id: article.id,
    name: article.name,
    description: article.description ?? null,
    type: toArticleType(article.type),
    price: toWholeFrancs(article.price, article.name),
    imageUrl: article.image_url ?? null,
    isAvailable: true,
  }));
  const knownArticles = new Set(articleRows.map((row) => row.id));

  /* ------------------------------ menus -------------------------------- */

  const menuRows: { id: string; serviceDate: string; isPublished: boolean }[] = [];
  const seenDates = new Map<string, string>();
  /** French weekday → menu id, to resolve `menu_articles.menu_day`. */
  const menuIdByWeekday = new Map<string, string>();

  for (const weekly of catalog.weekly_menus) {
    const serviceDate = toDateOnly(weekly.date, `menu ${weekly.id}`);
    if (!serviceDate) continue;

    const clash = seenDates.get(serviceDate);
    if (clash) {
      warn(`plusieurs menus pour le ${serviceDate} ; ${weekly.id} ignoré au profit de ${clash}`);
      continue;
    }
    seenDates.set(serviceDate, weekly.id);

    menuRows.push({
      id: weekly.id,
      serviceDate,
      isPublished: weekly.is_active ?? false,
    });
    if (weekly.day) menuIdByWeekday.set(weekly.day, weekly.id);
  }

  /* ---------------------------- menu lines ------------------------------ */

  // Deduplicated on (menu, article): the schema's unique index would reject a
  // repeat, and the two legacy tables often describe the same line twice.
  const lines = new Map<string, { menuId: string; articleId: string; position: number }>();
  const add = (menuId: string, articleId: string, source: string) => {
    if (!knownArticles.has(articleId)) {
      warn(`${source} référence l'article inconnu ${articleId}, ligne ignorée`);
      return;
    }
    const key = `${menuId}:${articleId}`;
    if (!lines.has(key)) lines.set(key, { menuId, articleId, position: lines.size });
  };

  for (const entry of catalog.menu_articles) {
    if (!entry.article_id) continue;
    const menuId = menuIdByWeekday.get(entry.menu_day);
    if (!menuId) {
      warn(`menu_articles.menu_day = « ${entry.menu_day} » ne correspond à aucun menu, ignoré`);
      continue;
    }
    add(menuId, entry.article_id, "menu_articles");
  }

  for (const entry of catalog.menu_items) {
    if (!entry.menu_id || !entry.article_id) continue;
    if (!menuRows.some((menu) => menu.id === entry.menu_id)) {
      warn(`menu_items référence le menu inconnu ${entry.menu_id}, ligne ignorée`);
      continue;
    }
    add(entry.menu_id, entry.article_id, "menu_items");
  }

  const lineRows = [...lines.values()];

  console.log("À importer :");
  console.log(`  articles   : ${articleRows.length}`);
  console.log(`  menus      : ${menuRows.length}`);
  console.log(`  lignes     : ${lineRows.length}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} avertissement(s) :`);
    for (const message of warnings) console.log(`  - ${message}`);
  }

  if (dryRun) {
    console.log("\n--dry-run : rien n'a été écrit.");
    return;
  }

  const { db, client } = createDatabase(loadDatabaseUrl(), { max: 1 });

  try {
    // One transaction: a partial catalogue is worse than none.
    await db.transaction(async (tx) => {
      if (articleRows.length) {
        await tx.insert(articles).values(articleRows).onConflictDoNothing();
      }
      if (menuRows.length) {
        await tx.insert(menus).values(menuRows).onConflictDoNothing();
      }
      if (lineRows.length) {
        await tx.insert(menuItems).values(lineRows).onConflictDoNothing();
      }
    });
    console.log("\nImport terminé.");
  } finally {
    await client.end();
  }
}

await main();
