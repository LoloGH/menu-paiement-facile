import { describe, expect, it } from "vitest";
import { assertAmount, formatAmount, frenchWeekday, toDateOnly } from "../src/money.js";

describe("montants", () => {
  it("formate en FCFA avec des espaces ordinaires", () => {
    // Not a narrow no-break space: the receipt PDF renders that as a box.
    expect(formatAmount(75_000)).toBe("75 000 FCFA");
    expect(formatAmount(1_500)).toBe("1 500 FCFA");
    expect(formatAmount(0)).toBe("0 FCFA");
    expect(formatAmount(75_000)).not.toMatch(/[\u202F\u00A0]/);
  });

  it("rejette ce qui n'est pas un nombre entier de francs", () => {
    expect(() => assertAmount(1500.75)).toThrow(RangeError);
    expect(() => assertAmount(-1)).toThrow(RangeError);
    expect(() => assertAmount(Number.NaN)).toThrow(RangeError);
    expect(assertAmount(1500)).toBe(1500);
    expect(assertAmount(0)).toBe(0);
  });
});

describe("dates", () => {
  it("nomme le jour en français", () => {
    expect(frenchWeekday(new Date("2026-08-17T12:00:00"))).toBe("Lundi");
    expect(frenchWeekday(new Date("2026-08-23T12:00:00"))).toBe("Dimanche");
  });

  it("réduit à une date locale, sans décalage de fuseau", () => {
    expect(toDateOnly(new Date("2026-08-19T23:30:00"))).toBe("2026-08-19");
    expect(toDateOnly(new Date("2026-01-05T00:10:00"))).toBe("2026-01-05");
  });
});
