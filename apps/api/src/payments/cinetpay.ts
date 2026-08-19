import { createHmac, timingSafeEqual } from "node:crypto";
import type { Checkout, Order, PaymentEvent, PaymentProvider } from "./provider.js";

/**
 * CinetPay — mobile money aggregator for West Africa (Orange Money, MTN, Moov,
 * Wave, cards) settling in XOF.
 *
 * Two rules shape this implementation:
 *
 * 1. The webhook body is never believed. CinetPay's own guidance is to treat a
 *    notification as a signal to go and ask, not as a statement of fact —
 *    anyone can POST to a public URL. The HMAC in `x-token` is checked when a
 *    secret is configured, but the money decision always comes from a
 *    server-to-server call to /v2/payment/check over TLS with our API key.
 *    That call is the authority; the notification only says which transaction
 *    to ask about.
 *
 * 2. The amount is re-read from CinetPay's answer and compared to the order.
 *    A callback claiming a smaller amount than what was ordered must not settle
 *    the order.
 */

const API_BASE = "https://api-checkout.cinetpay.com/v2";

export interface CinetPayConfig {
  apiKey: string;
  siteId: string;
  /** From the CinetPay dashboard; only needed to verify the x-token HMAC. */
  secretKey?: string | undefined;
  /** Public origin, used to build the notify and return URLs. */
  publicOrigin: string;
}

interface InitResponse {
  code?: string;
  message?: string;
  description?: string;
  data?: { payment_token?: string; payment_url?: string };
}

interface CheckResponse {
  code?: string;
  message?: string;
  data?: {
    amount?: string | number;
    currency?: string;
    status?: string;
    payment_method?: string;
    operator_id?: string;
  };
}

/**
 * The fields CinetPay concatenates to build the x-token, in this exact order.
 * A missing field contributes an empty string.
 */
const HMAC_FIELDS = [
  "cpm_site_id",
  "cpm_trans_id",
  "cpm_trans_date",
  "cpm_amount",
  "cpm_currency",
  "signature",
  "payment_method",
  "cel_phone_num",
] as const;

async function postJson<T>(url: string, body: unknown, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function createCinetPayProvider(config: CinetPayConfig): PaymentProvider {
  const notifyUrl = new URL("/api/payments/webhook/cinetpay", config.publicOrigin).toString();
  const returnUrl = new URL("/mes-commandes", config.publicOrigin).toString();

  return {
    name: "cinetpay",

    async createCheckout(order: Order): Promise<Checkout> {
      // The receipt id is already unique in the database and readable by the
      // operator, which makes reconciliation against CinetPay's dashboard
      // straightforward.
      const payload = {
        apikey: config.apiKey,
        site_id: config.siteId,
        transaction_id: order.receiptId,
        amount: order.totalAmount,
        currency: "XOF",
        description: `Commande ${order.receiptId}`,
        notify_url: notifyUrl,
        return_url: returnUrl,
        channels: "ALL",
      };

      const result = await postJson<InitResponse>(`${API_BASE}/payment`, payload);
      const paymentUrl = result.data?.payment_url;

      if (!paymentUrl) {
        // Surfaced verbatim: CinetPay rejects some amounts outright (XOF is
        // expected in whole francs, and some channels impose a granularity),
        // and its own wording is more useful than anything invented here.
        throw new Error(
          `CinetPay a refusé l'initialisation : ${result.message ?? result.code ?? "réponse inattendue"}` +
            (result.description ? ` (${result.description})` : ""),
        );
      }

      return {
        redirectUrl: paymentUrl,
        reference: order.receiptId,
        selfVerifying: true,
      };
    },

    async verifyWebhook(headers, rawBody): Promise<PaymentEvent | null> {
      const fields = new URLSearchParams(rawBody);
      const transactionId = fields.get("cpm_trans_id");
      if (!transactionId) return null;

      // Signature check, when a secret is configured. Not sufficient on its
      // own — see the note at the top — but it rejects obvious noise before
      // spending a round trip.
      if (config.secretKey) {
        const presented = headers["x-token"];
        if (typeof presented !== "string") return null;

        const message = HMAC_FIELDS.map((field) => fields.get(field) ?? "").join("");
        const expected = createHmac("sha256", config.secretKey).update(message).digest("hex");

        const a = Buffer.from(expected, "utf8");
        const b = Buffer.from(presented.toLowerCase(), "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
      }

      // The authoritative question, asked of CinetPay directly.
      const check = await postJson<CheckResponse>(`${API_BASE}/payment/check`, {
        apikey: config.apiKey,
        site_id: config.siteId,
        transaction_id: transactionId,
      });

      const status = check.data?.status?.toUpperCase();
      const amount = check.data?.amount === undefined ? null : Number(check.data.amount);

      return {
        reference: transactionId,
        status: status === "ACCEPTED" ? "paid" : "failed",
        amount: Number.isFinite(amount) ? amount : null,
        raw: { notification: Object.fromEntries(fields), check },
      };
    },
  };
}
