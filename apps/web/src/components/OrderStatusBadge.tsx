import { Badge } from "@/components/ui/badge";
import type { FulfillmentStatus, PaymentStatus } from "@menu/shared";

/**
 * Payment and kitchen progress are shown as two badges because they are two
 * independent facts. The legacy interface collapsed them into one column, so
 * "paid" and "being prepared" could not be true at the same time.
 */

const PAYMENT_LABELS: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Paiement en attente", className: "bg-amber-100 text-amber-800" },
  paid: { label: "Payée", className: "bg-green-100 text-green-800" },
  failed: { label: "Paiement échoué", className: "bg-red-100 text-red-800" },
  refunded: { label: "Remboursée", className: "bg-gray-100 text-gray-800" },
};

const FULFILLMENT_LABELS: Record<FulfillmentStatus, { label: string; className: string }> = {
  new: { label: "Nouvelle", className: "bg-blue-100 text-blue-800" },
  preparing: { label: "En préparation", className: "bg-purple-100 text-purple-800" },
  ready: { label: "Prête", className: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Livrée", className: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Annulée", className: "bg-red-100 text-red-800" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const entry = PAYMENT_LABELS[status];
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  const entry = FULFILLMENT_LABELS[status];
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}
