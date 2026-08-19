import { useState } from "react";
import { formatAmount } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminOrders } from "@/hooks/api/use-orders";
import { useConfirmPayment } from "@/hooks/api/use-payments";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Orders awaiting payment confirmation.
 *
 * This screen is what replaced trusting a return URL. A payment becomes real
 * because someone here checked it and said so — an action attributed to their
 * account in the audit log.
 */
export function PaymentConfirmations() {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useAdminOrders({
    paymentStatus: "pending",
    page: 1,
    pageSize: 50,
  });
  const confirmPayment = useConfirmPayment();
  const [references, setReferences] = useState<Record<string, string>>({});

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Confirmez un paiement seulement après l'avoir constaté sur votre compte marchand. Cette
          action est enregistrée dans le journal avec votre nom, et fait passer la commande en
          cuisine.
        </AlertDescription>
      </Alert>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : "Chargement impossible."}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reçu</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Référence du paiement</TableHead>
              <TableHead className="w-[130px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucun paiement en attente.
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.receiptId}</TableCell>
                <TableCell>
                  {order.customerName ?? order.guestName ?? "—"}
                  {order.customerEmail && (
                    <span className="block text-xs text-gray-500">{order.customerEmail}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{formatDateTime(order.createdAt)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatAmount(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Input
                    value={references[order.id] ?? ""}
                    onChange={(event) =>
                      setReferences((current) => ({ ...current, [order.id]: event.target.value }))
                    }
                    placeholder="Facultatif"
                    aria-label={`Référence pour ${order.receiptId}`}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    disabled={confirmPayment.isPending}
                    onClick={() =>
                      confirmPayment.mutate(
                        { orderId: order.id, reference: references[order.id] },
                        {
                          onSuccess: () =>
                            toast({
                              title: "Paiement confirmé",
                              description: `${order.receiptId} passe en cuisine.`,
                            }),
                          onError: (caught) =>
                            toast({
                              title: "Confirmation impossible",
                              description: caught instanceof Error ? caught.message : undefined,
                              variant: "destructive",
                            }),
                        },
                      )
                    }
                  >
                    Confirmer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
