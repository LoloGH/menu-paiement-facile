import type { ArticleType } from "@menu/shared";

/** Kept out of the component file so Fast Refresh keeps working there. */
export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  main_dish: "Plat principal",
  side_dish: "Accompagnement",
  dessert: "Dessert",
  drink: "Boisson",
  other: "Autre",
};
