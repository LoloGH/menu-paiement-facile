import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createPaymentProvider, type PaymentProvider } from "../payments/index.js";

/** Resolves the configured provider once at boot. */
export const paymentsPlugin = fp(async (app: FastifyInstance) => {
  const provider = createPaymentProvider(app.config);
  app.decorate("payments", provider);
  app.log.info({ provider: provider.name }, "payment provider ready");
});

declare module "fastify" {
  interface FastifyInstance {
    payments: PaymentProvider;
  }
}
