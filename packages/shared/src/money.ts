/**
 * Money handling.
 *
 * Amounts are XOF (FCFA), which has no minor unit: every amount in this system
 * is a non-negative integer number of francs. Storing them as integers removes
 * the rounding the legacy front-end had to do at every price site
 * (`Math.round(price)` scattered across the payment components).
 */

import { FRENCH_WEEKDAYS, type FrenchWeekday } from "./enums.js";

export const CURRENCY = "XOF" as const;

/** Throws on anything that is not a usable amount of francs. */
export function assertAmount(value: number, label = "amount"): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer of ${CURRENCY}, got ${value}`);
  }
  return value;
}

/** `75000` → `"75 000 FCFA"`. */
export function formatAmount(value: number): string {
  // fr-FR groups thousands with U+202F (narrow no-break space) or U+00A0
  // depending on the ICU version; normalise both to a plain space so receipts
  // render identically everywhere, including inside the generated PDF.
  const grouped = value.toLocaleString("fr-FR").replace(/[\u202F\u00A0]/g, " ");
  return `${grouped} FCFA`;
}

/** Weekday name for a date, in French, matching the labels used in the menus. */
export function frenchWeekday(date: Date): FrenchWeekday {
  const day = FRENCH_WEEKDAYS[date.getDay()];
  if (!day) throw new RangeError(`invalid date: ${date}`);
  return day;
}

/** `2026-08-19` from a Date, in local time (menus are keyed by service date). */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
