import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "./queryKeys";
import type { Order } from "./types";

export interface CheckoutResult {
  redirectUrl: string | null;
  /** True when the provider cannot prove payment on its own. */
  requiresManualConfirmation: boolean;
  amount: number;
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<CheckoutResult>(`/api/payments/${orderId}/checkout`),
  });
}

/**
 * Marks a payment received. Restricted to admins and order managers, and
 * recorded in the audit log with the confirming account.
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reference }: { orderId: string; reference?: string }) =>
      api.post<{ order: Order }>(`/api/payments/${orderId}/confirm`, {
        reference: reference?.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
}
