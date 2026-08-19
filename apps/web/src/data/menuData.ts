import { frenchWeekday } from "@menu/shared";
import type { Menu, MenuItem } from "@/hooks/api/types";

/**
 * Adapts the API's flat menu — a list of articles with a type — into the
 * combo-per-day shape the ordering screens render.
 *
 * Every dish keeps its `menuItemId`: that identifier, not a price, is what an
 * order is built from. Prices travel along only to be displayed; the server
 * recomputes the total when the order is placed.
 */

export interface MenuDish {
  menuItemId: string;
  articleId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
}

/** A main course with its optional side and dessert, priced as a whole. */
export interface MealCombo {
  id: string;
  mainDish: MenuDish;
  sideDish: MenuDish | null;
  dessert: MenuDish | null;
}

export interface DayMenu {
  id: string;
  day: string;
  serviceDate: string;
  /** `19 août`, for display. */
  label: string;
  combos: MealCombo[];
  drinks: MenuDish[];
}

const PLACEHOLDER = "/placeholder.svg";

function toDish(item: MenuItem): MenuDish {
  return {
    menuItemId: item.menuItemId,
    articleId: item.articleId,
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    image: item.imageUrl ?? PLACEHOLDER,
    isAvailable: item.isAvailable,
  };
}

function formatDayLabel(serviceDate: string): string {
  const date = new Date(`${serviceDate}T12:00:00`);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function toDayMenu(menu: Menu): DayMenu {
  const byType = (type: MenuItem["type"]) =>
    menu.items
      .filter((item) => item.type === type)
      .sort((a, b) => a.position - b.position)
      .map(toDish);

  const mains = byType("main_dish");
  const sides = byType("side_dish");
  const desserts = byType("dessert");

  // Mains drive the pairing: each gets the side and dessert at the same rank,
  // falling back to the first when there are fewer of them. This mirrors what
  // the previous screens showed, without inventing a combo out of nothing.
  const combos: MealCombo[] = mains.map((mainDish, index) => ({
    id: mainDish.menuItemId,
    mainDish,
    sideDish: sides[index] ?? sides[0] ?? null,
    dessert: desserts[index] ?? desserts[0] ?? null,
  }));

  const date = new Date(`${menu.serviceDate}T12:00:00`);

  return {
    id: menu.id,
    day: frenchWeekday(date),
    serviceDate: menu.serviceDate,
    label: formatDayLabel(menu.serviceDate),
    combos,
    drinks: byType("drink"),
  };
}

export function toDayMenus(menus: Menu[]): DayMenu[] {
  return menus
    .map(toDayMenu)
    .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
}
