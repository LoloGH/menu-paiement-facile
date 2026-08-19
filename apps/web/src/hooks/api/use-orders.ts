import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FulfillmentStatus, PaymentStatus } from "@menu/shared";
import { api, queryString } from "@/lib/api";
import { queryKeys } from "./queryKeys";
import type { Order } from "./types";

export interface CreateOrderPayload {
  items: { menuItemId: string; quantity: number }[];
  tableNumber?: string | null;
  customerNote?: string | null;
}

/**
 * Places an order.
 *
 * The payload carries no price and no total: the server reads them from the
 * database. Whatever this returns as `totalAmount` is what will be charged.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api.post<{ order: Order }>("/api/orders", payload).then((response) => response.order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.orders.mine,
    queryFn: () =>
      api.get<{ orders: Order[] }>("/api/orders/mine").then((response) => response.orders),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.one(id ?? ""),
    queryFn: () => api.get<{ order: Order }>(`/api/orders/${id}`).then((response) => response.order),
    enabled: Boolean(id),
  });
}

export interface AdminOrderFilters extends Record<string, string | number | undefined> {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders.admin(filters),
    queryFn: () =>
      api.get<{ orders: Order[]; page: number; pageSize: number; total: number }>(
        `/api/admin/orders${queryString(filters as Record<string, string | number | undefined>)}`,
      ),
    // Keeps the previous page visible while the next one loads, so typing in
    // the search box does not blank the table on every keystroke.
    placeholderData: (previous) => previous,
  });
}

export function useUpdateFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FulfillmentStatus }) =>
      api.patch<{ order: Order }>(`/api/admin/orders/${id}/fulfillment`, {
        fulfillmentStatus: status,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}
