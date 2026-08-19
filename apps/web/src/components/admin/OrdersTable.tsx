import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { FulfillmentStatus, PaymentStatus } from "@menu/shared";
import { FULFILLMENT_STATUSES, PAYMENT_STATUSES, formatAmount } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminOrders, useUpdateFulfillment } from "@/hooks/api/use-orders";
import { usePermissions } from "@/hooks/use-permissions";
import { FulfillmentBadge, PaymentBadge } from "@/components/OrderStatusBadge";

const ALL = "__all__";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * The back-office order list.
 *
 * The previous version tore down and recreated its realtime channel on every
 * keystroke — its effect depended on the search term — and started a 30-second
 * polling interval inside the subscribe callback whose cleanup was discarded,
 * leaking one timer per failed subscription. Here the search is debounced,
 * React Query owns the fetching, and there is no hand-rolled timer at all.
 */
export function OrdersTable() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | typeof ALL>(ALL);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus | typeof ALL>(ALL);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      ...(paymentStatus === ALL ? {} : { paymentStatus }),
      ...(fulfillmentStatus === ALL ? {} : { fulfillmentStatus }),
      page,
      pageSize: 25,
    }),
    [debouncedSearch, paymentStatus, fulfillmentStatus, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminOrders(filters);
  const updateFulfillment = useUpdateFulfillment();

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 25));

  const advance = (id: string, status: FulfillmentStatus) => {
    updateFulfillment.mutate(
      { id, status },
      {
        onSuccess: () => toast({ title: "Commande mise à jour" }),
        onError: (caught) =>
          toast({
            title: "Mise à jour impossible",
            description: caught instanceof Error ? caught.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Reçu, nom, e-mail…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Rechercher une commande"
          />
        </div>

        <Select
          value={paymentStatus}
          onValueChange={(value) => {
            setPaymentStatus(value as PaymentStatus | typeof ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les paiements</SelectItem>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={fulfillmentStatus}
          onValueChange={(value) => {
            setFulfillmentStatus(value as FulfillmentStatus | typeof ALL);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Préparation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les préparations</SelectItem>
            {FULFILLMENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

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
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Préparation</TableHead>
              {permissions.canManageOrders && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucune commande ne correspond.
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
                <TableCell className="text-right">{formatAmount(order.totalAmount)}</TableCell>
                <TableCell>
                  <PaymentBadge status={order.paymentStatus} />
                </TableCell>
                <TableCell>
                  <FulfillmentBadge status={order.fulfillmentStatus} />
                </TableCell>
                {permissions.canManageOrders && (
                  <TableCell>
                    <Select
                      value={order.fulfillmentStatus}
                      onValueChange={(value) => advance(order.id, value as FulfillmentStatus)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FULFILLMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} commande{total > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Précédent
          </Button>
          <span>
            Page {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
