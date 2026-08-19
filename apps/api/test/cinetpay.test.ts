import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { createCinetPayProvider } from "../src/payments/cinetpay.js";

/**
 * The provider is exercised against a stubbed `fetch`. The point is not to
 * check that CinetPay works, but that we never settle an order on anything
 * other than CinetPay's own answer to a direct question.
 */
describe("CinetPay", () => {
  const config = {
    apiKey: "cle-api-de-test",
    siteId: "123456",
    secretKey: "secret-de-test-suffisamment-long",
    publicOrigin: "https://menu.example.com",
  };

  let calls: { url: string; body: Record<string, unknown> }[] = [];

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(responder: (url: string, body: Record<string, unknown>) => unknown) {
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      calls.push({ url, body });
      return { json: async () => responder(url, body) };
    });
  }

  function signedToken(fields: Record<string, string>) {
    const message = [
      "cpm_site_id",
      "cpm_trans_id",
      "cpm_trans_date",
      "cpm_amount",
      "cpm_currency",
      "signature",
      "payment_method",
      "cel_phone_num",
    ]
      .map((key) => fields[key] ?? "")
      .join("");
    return createHmac("sha256", config.secretKey).update(message).digest("hex");
  }

  const notification = {
    cpm_site_id: "123456",
    cpm_trans_id: "CMD-260819-000001",
    cpm_trans_date: "2026-08-19 12:00:00",
    cpm_amount: "3500",
    cpm_currency: "XOF",
    signature: "sig",
    payment_method: "OMCIV2",
    cel_phone_num: "0700000000",
  };

  describe("initialisation", () => {
    it("envoie le montant de la commande et renvoie l'URL de paiement", async () => {
      stubFetch(() => ({ code: "201", data: { payment_url: "https://checkout.example/abc" } }));
      const provider = createCinetPayProvider(config);

      const checkout = await provider.createCheckout({
        id: "order-1",
        receiptId: "CMD-260819-000001",
        totalAmount: 3500,
      });

      expect(checkout.redirectUrl).toBe("https://checkout.example/abc");
      expect(checkout.selfVerifying).toBe(true);
      expect(calls[0]?.body).toMatchObject({
        transaction_id: "CMD-260819-000001",
        amount: 3500,
        currency: "XOF",
        notify_url: "https://menu.example.com/api/payments/webhook/cinetpay",
      });
    });

    it("remonte le refus de CinetPay au lieu de l'avaler", async () => {
      stubFetch(() => ({ code: "624", message: "MINIMUM_REQUIRED_FIELDS", description: "amount" }));
      const provider = createCinetPayProvider(config);

      await expect(
        provider.createCheckout({ id: "o", receiptId: "CMD-1", totalAmount: 3 }),
      ).rejects.toThrow(/MINIMUM_REQUIRED_FIELDS/);
    });
  });

  describe("notification", () => {
    it("rejette une signature absente ou fausse sans rien demander à CinetPay", async () => {
      stubFetch(() => ({ code: "00", data: { status: "ACCEPTED", amount: "3500" } }));
      const provider = createCinetPayProvider(config);
      const body = new URLSearchParams(notification).toString();

      expect(await provider.verifyWebhook({}, body)).toBeNull();
      expect(await provider.verifyWebhook({ "x-token": "0".repeat(64) }, body)).toBeNull();
      // No round trip was spent on a forged callback.
      expect(calls).toHaveLength(0);
    });

    it("ne croit pas le corps : le statut vient de l'appel de vérification", async () => {
      // The notification claims a payment; CinetPay says it was refused.
      stubFetch(() => ({ code: "00", data: { status: "REFUSED", amount: "3500" } }));
      const provider = createCinetPayProvider(config);

      const event = await provider.verifyWebhook(
        { "x-token": signedToken(notification) },
        new URLSearchParams({ ...notification, cpm_result: "00" }).toString(),
      );

      expect(event?.status).toBe("failed");
      expect(calls.some((call) => call.url.endsWith("/payment/check"))).toBe(true);
    });

    it("accepte un paiement que CinetPay confirme", async () => {
      stubFetch(() => ({ code: "00", data: { status: "ACCEPTED", amount: "3500" } }));
      const provider = createCinetPayProvider(config);

      const event = await provider.verifyWebhook(
        { "x-token": signedToken(notification) },
        new URLSearchParams(notification).toString(),
      );

      expect(event).toMatchObject({
        reference: "CMD-260819-000001",
        status: "paid",
        amount: 3500,
      });
      // The API key travels only server to server, never through the browser.
      expect(calls.at(-1)?.body).toMatchObject({
        apikey: config.apiKey,
        transaction_id: "CMD-260819-000001",
      });
    });

    it("ignore une notification sans identifiant de transaction", async () => {
      stubFetch(() => ({}));
      const provider = createCinetPayProvider(config);
      expect(await provider.verifyWebhook({ "x-token": "x" }, "bruit=1")).toBeNull();
    });
  });
});
