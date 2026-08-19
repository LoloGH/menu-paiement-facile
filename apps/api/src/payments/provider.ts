import type { PaymentStatus } from "@menu/shared";

/**
 * The seam where a payment gateway plugs in.
 *
 * Nothing above this interface knows how money is collected, so adding a West
 * African mobile money aggregator later means writing one more implementation
 * and setting PAYMENT_PROVIDER — no schema change, no route change.
 */

export interface Order {
  id: string;
  receiptId: string;
  totalAmount: number;
}

export interface Checkout {
  /** Where to send the customer, or null when there is nothing to redirect to. */
  redirectUrl: string | null;
  /** The provider's own identifier for this attempt, when it issues one. */
  reference: string | null;
  /**
   * Whether the provider can prove the payment happened on its own. When false,
   * the order waits for a human to confirm it in the back office — which is the
   * only honest thing to do without a verifiable callback.
   */
  selfVerifying: boolean;
}

export interface PaymentEvent {
  reference: string;
  status: PaymentStatus;
  amount: number | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(order: Order): Promise<Checkout>;
  /**
   * Validates an incoming webhook and extracts what it says.
   *
   * Returns null when the payload is unsigned, replayed or unreadable — the
   * route answers 400 and nothing is written. A provider that cannot verify a
   * signature must always return null rather than trusting the body.
   */
  verifyWebhook(headers: Record<string, string | undefined>, rawBody: string): Promise<PaymentEvent | null>;
}
