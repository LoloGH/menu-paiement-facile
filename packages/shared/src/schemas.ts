import { z } from "zod";
import {
  ARTICLE_TYPES,
  FULFILLMENT_STATUSES,
  PAYMENT_STATUSES,
  USER_ROLES,
} from "./enums.js";

/*
 * Request payload schemas. The API validates every incoming body against these;
 * the web client uses the same objects for its forms, so a field cannot drift
 * between what the browser sends and what the server accepts.
 */

/** Whole FCFA. Rejects decimals rather than letting PostgreSQL round them. */
export const amountSchema = z
  .number()
  .int("le montant doit être un nombre entier de FCFA")
  .nonnegative()
  .max(100_000_000);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("adresse e-mail invalide")
  .max(320);

/**
 * Long rather than complex: length is what actually resists guessing, and
 * character-class rules mostly push people towards predictable substitutions.
 */
export const passwordSchema = z
  .string()
  .min(12, "le mot de passe doit faire au moins 12 caractères")
  .max(200);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9 ().-]{6,20}$/, "numéro de téléphone invalide");

/* ------------------------------- auth ---------------------------------- */

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120),
  phone: phoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    phone: phoneSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "aucun champ à mettre à jour",
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

/* ----------------------------- catalogue -------------------------------- */

export const articleInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullish(),
  type: z.enum(ARTICLE_TYPES),
  price: amountSchema,
  imageUrl: z.string().url().max(2000).nullish(),
  isAvailable: z.boolean().default(true),
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

/** `YYYY-MM-DD`, the key a menu is filed under. */
export const serviceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date attendue au format AAAA-MM-JJ")
  .refine((value) => !Number.isNaN(Date.parse(value)), "date invalide");

export const menuInputSchema = z.object({
  serviceDate: serviceDateSchema,
  isPublished: z.boolean().default(false),
  items: z
    .array(
      z.object({
        articleId: z.string().uuid(),
        priceOverride: amountSchema.nullish(),
        position: z.number().int().min(0).max(1000).default(0),
      }),
    )
    .max(100),
});
export type MenuInput = z.infer<typeof menuInputSchema>;

/* ------------------------------- orders --------------------------------- */

/**
 * What a client may send when ordering: which menu lines, and how many of each.
 * Deliberately no price and no total — the server reads those from the database.
 * Anything price-shaped in the body is ignored.
 */
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "la commande doit contenir au moins un article")
    .max(50),
  tableNumber: z.string().trim().max(20).nullish(),
  customerNote: z.string().trim().max(500).nullish(),
  /** Counter orders placed by staff for someone without an account. */
  guestName: z.string().trim().max(120).nullish(),
  guestPhone: phoneSchema.nullish(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateFulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(FULFILLMENT_STATUSES),
});

export const confirmPaymentSchema = z.object({
  /** Free-text reference the operator read off the payment app. */
  reference: z.string().trim().max(200).nullish(),
});

export const orderQuerySchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  fulfillmentStatus: z.enum(FULFILLMENT_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  from: serviceDateSchema.optional(),
  to: serviceDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

/* -------------------------------- roles --------------------------------- */

export const grantRoleSchema = z.object({
  email: emailSchema,
  role: z.enum(USER_ROLES),
});

export const revokeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(USER_ROLES),
});
