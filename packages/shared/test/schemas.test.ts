import { describe, expect, it } from "vitest";
import { amountSchema, createOrderSchema, emailSchema, passwordSchema } from "../src/schemas.js";

describe("schémas de requête", () => {
  it("refuse un montant décimal ou négatif", () => {
    expect(amountSchema.safeParse(1500).success).toBe(true);
    expect(amountSchema.safeParse(1500.75).success).toBe(false);
    expect(amountSchema.safeParse(-1).success).toBe(false);
  });

  it("normalise l'adresse e-mail en minuscules", () => {
    expect(emailSchema.parse("  Admin@Example.COM ")).toBe("admin@example.com");
    expect(emailSchema.safeParse("pas-un-email").success).toBe(false);
  });

  it("exige un mot de passe long plutôt que complexe", () => {
    expect(passwordSchema.safeParse("court").success).toBe(false);
    expect(passwordSchema.safeParse("douze-carac").success).toBe(false);
    expect(passwordSchema.safeParse("motdepasse-assez-long").success).toBe(true);
  });

  it("ignore tout champ de prix dans une commande", () => {
    const parsed = createOrderSchema.parse({
      items: [{ menuItemId: "11111111-1111-4111-8111-111111111111", quantity: 2 }],
      totalAmount: 1,
      price: 1,
      unitPrice: 1,
    });

    // The schema is what makes a forged price unreachable: it never lands in
    // the parsed object, so no handler can accidentally read it.
    expect(parsed).not.toHaveProperty("totalAmount");
    expect(parsed).not.toHaveProperty("price");
    expect(parsed.items).toHaveLength(1);
  });

  it("refuse une commande vide", () => {
    expect(createOrderSchema.safeParse({ items: [] }).success).toBe(false);
  });
});
