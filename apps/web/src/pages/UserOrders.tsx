import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { formatAmount } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMyOrders } from "@/hooks/api/use-orders";
import { FulfillmentBadge, PaymentBadge } from "@/components/OrderStatusBadge";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function UserOrders() {
  const { data: orders, isLoading, isError, error } = useMyOrders();

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30 py-8 px-4">
      <div className="container mx-auto max-w-3xl space-y-6">
        <Link to="/">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour au menu
          </Button>
        </Link>

        <h1 className="text-2xl font-semibold">Mes commandes</h1>

        {isLoading && <p className="text-gray-600">Chargement…</p>}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : "Chargement impossible."}
            </AlertDescription>
          </Alert>
        )}

        {orders?.length === 0 && (
          <p className="text-gray-600">Vous n'avez pas encore passé de commande.</p>
        )}

        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base font-mono">{order.receiptId}</CardTitle>
                <div className="flex gap-2">
                  <PaymentBadge status={order.paymentStatus} />
                  <FulfillmentBadge status={order.fulfillmentStatus} />
                </div>
              </div>
              <p className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 mb-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.articleName}
                    </span>
                    <span>{formatAmount(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatAmount(order.totalAmount)}</span>
              </div>
              {order.customerNote && (
                <p className="text-sm text-gray-600 mt-2">Note : {order.customerNote}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
