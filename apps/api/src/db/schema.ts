import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  ARTICLE_TYPES,
  FULFILLMENT_STATUSES,
  PAYMENT_STATUSES,
  USER_ROLES,
} from "@menu/shared";

/*
 * PostgreSQL enums are derived from the shared constants so that a value can
 * never drift between the database, the API and the client.
 */
export const articleTypeEnum = pgEnum("article_type", ARTICLE_TYPES);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", FULFILLMENT_STATUSES);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One row per person who can sign in. The legacy schema spread customers over
 * three places (`users`, `clients`, and `orders.guest_*`); loyalty data lives
 * here now, and `orders.guest_*` is kept solely for orders taken at the counter
 * for someone without an account.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** argon2id hash. Never leaves the API. */
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    phone: text("phone"),
    loyaltyNumber: text("loyalty_number"),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // Case-insensitive uniqueness: "Admin@x.com" and "admin@x.com" are the
    // same account. Emails are also normalised to lower case on write, but the
    // functional index is what actually makes the guarantee hold.
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    uniqueIndex("users_loyalty_number_unique").on(table.loyaltyNumber),
  ],
);

/**
 * Roles are additive: a user may hold several. There is deliberately no
 * `customer` role — having an account is what makes someone a customer, and a
 * self-service registration must never be able to grant anything beyond that.
 */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
  },
  (table) => [uniqueIndex("user_roles_user_role_unique").on(table.userId, table.role)],
);

/**
 * Refresh tokens are stored hashed so a database read cannot be replayed as a
 * session. Revoking a session means deleting or expiring its row.
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    uniqueIndex("refresh_tokens_hash_unique").on(table.tokenHash),
    index("refresh_tokens_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

/** A dish or drink that can appear on a menu. Prices are whole FCFA. */
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    type: articleTypeEnum("type").notNull(),
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("articles_type_idx").on(table.type)],
);

/**
 * One menu per service date. The legacy schema keyed menus by a French weekday
 * string, which could not distinguish one Tuesday from the next; the weekday is
 * now derived from the date instead of being stored.
 */
export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceDate: date("service_date").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("menus_service_date_unique").on(table.serviceDate)],
);

/**
 * An article offered on a given menu. `priceOverride` allows a one-off price
 * without touching the catalogue; the effective price is
 * `coalesce(price_override, articles.price)` and is resolved by the API.
 */
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "restrict" }),
    priceOverride: integer("price_override"),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("menu_items_menu_article_unique").on(table.menuId, table.articleId),
    index("menu_items_menu_idx").on(table.menuId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-facing reference printed on the receipt. */
    receiptId: text("receipt_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Only for counter orders placed on behalf of someone without an account. */
    guestName: text("guest_name"),
    guestPhone: text("guest_phone"),

    /**
     * Sum of the order lines, computed by the API inside the same transaction
     * that writes them. Never supplied by the client.
     */
    totalAmount: integer("total_amount").notNull(),

    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("new"),

    /** Real columns instead of the legacy trick of stuffing these into
     * `order_items.side_dish` and `order_items.dessert`. */
    tableNumber: text("table_number"),
    customerNote: text("customer_note"),

    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_receipt_id_unique").on(table.receiptId),
    index("orders_user_idx").on(table.userId),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_fulfillment_idx").on(table.fulfillmentStatus),
    index("orders_payment_idx").on(table.paymentStatus),
  ],
);

/**
 * One line per article ordered. `articleName` and `unitPrice` are snapshots
 * taken at order time: renaming or repricing an article must never rewrite
 * history, and a deleted article must not erase what was sold.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
    menuId: uuid("menu_id").references(() => menus.id, { onDelete: "set null" }),

    articleName: text("article_name").notNull(),
    articleType: articleTypeEnum("article_type").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    /** Service date the line was ordered for, snapshotted like the price. */
    serviceDate: date("service_date"),

    createdAt: timestamps.createdAt,
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

/* -------------------------------------------------------------------------- */
/* Payments                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One row per payment attempt, so a retried or failed payment keeps its trace.
 * `provider` is free text rather than an enum: adding a mobile money gateway
 * later must not require a schema migration. `rawPayload` keeps whatever the
 * provider sent, for reconciliation and disputes.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerReference: text("provider_reference"),
    amount: integer("amount").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    /** Set when a human confirmed the payment (the `manual` provider). */
    confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    rawPayload: jsonb("raw_payload"),
    ...timestamps,
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    // Guards against a replayed webhook. NULLs are distinct in PostgreSQL, so
    // the reference-less `manual` payments are unaffected.
    uniqueIndex("payments_provider_reference_unique").on(table.provider, table.providerReference),
  ],
);

/* -------------------------------------------------------------------------- */
/* Audit                                                                       */
/* -------------------------------------------------------------------------- */

/** Append-only trace of privileged actions. Never updated, never deleted. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    details: jsonb("details"),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index("audit_log_actor_idx").on(table.actorId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                   */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  orders: many(orders),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] }),
  article: one(articles, { fields: [menuItems.articleId], references: [articles.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  article: one(articles, { fields: [orderItems.articleId], references: [articles.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
