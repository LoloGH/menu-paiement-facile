import type { Checkout, Order, PaymentProvider } from "./provider.js";

/**
 * Redirects to a static Wave merchant link.
 *
 * The link takes a payment but tells us nothing: there is no callback, no
 * signature, and no way to ask Wave whether a given order was settled. The
 * previous application treated the return URL as proof — visiting
 * `?payment_status=success` marked an order paid — which is exactly the hole
 * this closes. Here the redirect is offered as a convenience, and the order
 * still needs manual confirmation.
 *
 * Replace this with a provider that implements `verifyWebhook` once a gateway
 * with a signed callback is chosen.
 */
export function createWaveLinkProvider(paymentUrl: string): PaymentProvider {
  return {
    name: "wave_link",

    async createCheckout(order: Order): Promise<Checkout> {
      const url = new URL(paymentUrl);
      // Carried for the operator's benefit when reconciling by hand; it is not
      // read back, and it is not trusted on return.
      url.searchParams.set("amount", String(order.totalAmount));
      return {
        redirectUrl: url.toString(),
        reference: order.receiptId,
        selfVerifying: false,
      };
    },

    async verifyWebhook() {
      // A static payment link has no signed callback. Accepting an unsigned
      // one would let anyone mark any order paid.
      return null;
    },
  };
}
