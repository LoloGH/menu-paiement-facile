/**
 * Domain enums shared by the API and the web client.
 *
 * These are the single source of truth: the Drizzle schema derives its
 * PostgreSQL enums from them, and the web client imports them for typing and
 * for rendering labels. They must never be redeclared elsewhere.
 */

export const ARTICLE_TYPES = [
  "main_dish",
  "side_dish",
  "dessert",
  "drink",
  "other",
] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

/**
 * State of the money. Kept strictly separate from kitchen progress: the legacy
 * schema mixed both in a single `payment_status` column, which made it
 * impossible to express "paid but not yet prepared" or "delivered but unpaid".
 */
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** State of the food. Advances independently of the payment. */
export const FULFILLMENT_STATUSES = [
  "new",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const USER_ROLES = [
  "admin",
  "order_manager",
  "kitchen",
  "viewer",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Payment providers. `manual` means an administrator confirms the payment by
 * hand; `wave_link` redirects to a static Wave merchant link, which likewise
 * cannot be verified automatically. A real gateway is added here later.
 */
export const PAYMENT_PROVIDERS = ["manual", "wave_link"] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export const FRENCH_WEEKDAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;
export type FrenchWeekday = (typeof FRENCH_WEEKDAYS)[number];
