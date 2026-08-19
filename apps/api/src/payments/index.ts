import type { Config } from "../config.js";
import type { PaymentProvider } from "./provider.js";
import { manualProvider } from "./manual.js";
import { createWaveLinkProvider } from "./wave-link.js";
import { createCinetPayProvider } from "./cinetpay.js";

export function createPaymentProvider(config: Config): PaymentProvider {
  switch (config.PAYMENT_PROVIDER) {
    case "wave_link":
      if (!config.WAVE_PAYMENT_URL) {
        throw new Error("PAYMENT_PROVIDER=wave_link requires WAVE_PAYMENT_URL");
      }
      return createWaveLinkProvider(config.WAVE_PAYMENT_URL);
    case "cinetpay": {
      if (!config.CINETPAY_API_KEY || !config.CINETPAY_SITE_ID) {
        throw new Error(
          "PAYMENT_PROVIDER=cinetpay requires CINETPAY_API_KEY and CINETPAY_SITE_ID",
        );
      }
      return createCinetPayProvider({
        apiKey: config.CINETPAY_API_KEY,
        siteId: config.CINETPAY_SITE_ID,
        secretKey: config.CINETPAY_SECRET_KEY,
        publicOrigin: config.PUBLIC_ORIGIN,
      });
    }
    case "manual":
      return manualProvider;
  }
}

export type { PaymentProvider, PaymentEvent, Checkout } from "./provider.js";
