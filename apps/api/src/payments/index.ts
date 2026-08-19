import type { Config } from "../config.js";
import type { PaymentProvider } from "./provider.js";
import { manualProvider } from "./manual.js";
import { createWaveLinkProvider } from "./wave-link.js";

export function createPaymentProvider(config: Config): PaymentProvider {
  switch (config.PAYMENT_PROVIDER) {
    case "wave_link":
      if (!config.WAVE_PAYMENT_URL) {
        throw new Error("PAYMENT_PROVIDER=wave_link requires WAVE_PAYMENT_URL");
      }
      return createWaveLinkProvider(config.WAVE_PAYMENT_URL);
    case "manual":
      return manualProvider;
  }
}

export type { PaymentProvider, PaymentEvent, Checkout } from "./provider.js";
