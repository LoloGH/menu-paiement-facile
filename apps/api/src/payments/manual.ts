import type { Checkout, PaymentProvider } from "./provider.js";

/**
 * No gateway at all: an administrator confirms each payment by hand.
 *
 * This is the default, and the only mode that makes no claim it cannot back up.
 * The order is created unpaid and stays that way until someone with the
 * `order_manager` or `admin` role says otherwise — an action recorded in the
 * audit log with their identity.
 */
export const manualProvider: PaymentProvider = {
  name: "manual",

  async createCheckout(): Promise<Checkout> {
    return { redirectUrl: null, reference: null, selfVerifying: false };
  },

  async verifyWebhook() {
    // There is no webhook to trust: this provider has no counterparty.
    return null;
  },
};
