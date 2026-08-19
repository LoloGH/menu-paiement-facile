import { formatAmount, type FulfillmentStatus } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAdminOrders, useUpdateFulfillment } from "@/hooks/api/use-orders";
import { FulfillmentBadge, PaymentBadge } from "@/components/OrderStatusBadge";

interface KitchenOrderListProps {
  status: FulfillmentStatus;
  /** The status this list's action button moves an order to. */
  nextStatus?: FulfillmentStatus;
  nextLabel?: string;
}

function elapsedSince(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  return `il y a ${Math.floor(minutes / 60)} h`;
}

export function KitchenOrderList({ status, nextStatus, nextLabel }: KitchenOrderListProps) {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useAdminOrders({
    fulfillmentStatus: status,
    page: 1,
    pageSize: 50,
  });
  const updateFulfillment = useUpdateFulfillment();

  const orders = data?.orders ?? [];

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Chargement impossible."}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) return <p className="text-gray-600 py-8 text-center">Chargement…</p>;

  if (orders.length === 0) {
    return <p className="text-gray-500 py-12 text-center">Aucune commande dans cette file.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <Card key={order.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base font-mono">{order.receiptId}</CardTitle>
              <FulfillmentBadge status={order.fulfillmentStatus} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PaymentBadge status={order.paymentStatus} />
              <span className="text-sm text-gray-500">{elapsedSince(order.createdAt)}</span>
            </div>
            {order.tableNumber && (
              <p className="text-sm font-medium">Table {order.tableNumber}</p>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-3">
            <ul className="space-y-1">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="font-medium">
                    {item.quantity} × {item.articleName}
                  </span>
                  <span className="text-gray-500">{formatAmount(item.unitPrice)}</span>
                </li>
              ))}
            </ul>

            {order.customerNote && (
              <p className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
                {order.customerNote}
              </p>
            )}

            {/* An unpaid order is shown but not started: the kitchen should not
                cook before the payment is confirmed. */}
            {order.paymentStatus !== "paid" && (
              <p className="text-sm text-amber-700">En attente de confirmation du paiement.</p>
            )}

            {nextStatus && nextLabel && (
              <Button
                className="mt-auto"
                disabled={updateFulfillment.isPending || order.paymentStatus !== "paid"}
                onClick={() =>
                  updateFulfillment.mutate(
                    { id: order.id, status: nextStatus },
                    {
                      onSuccess: () => toast({ title: nextLabel }),
                      onError: (caught) =>
                        toast({
                          title: "Action impossible",
                          description: caught instanceof Error ? caught.message : undefined,
                          variant: "destructive",
                        }),
                    },
                  )
                }
              >
                {nextLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
