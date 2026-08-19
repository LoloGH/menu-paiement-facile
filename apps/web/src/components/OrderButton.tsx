import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@/hooks/api/use-orders";
import { ApiError } from "@/lib/api";
import { playSounds } from "@/utils/soundEffects";
import type { Order } from "@/hooks/api/types";
import { LoginDialog } from "./LoginDialog";
import { OrderReceiptDialog } from "./OrderReceiptDialog";

interface OrderButtonProps {
  items: { menuItemId: string; quantity: number }[];
  /** Human-readable list of what was chosen, for the receipt. */
  summary: string;
  serviceDate: string;
  tableNumber?: string;
  customerNote?: string;
}

/**
 * Places the order.
 *
 * Replaces the old PaymentButton, which wrote the order straight to the
 * database with a client-supplied `total_amount`, then redirected to a payment
 * link carrying that amount in the query string, and finally trusted the return
 * URL to mark the order paid. None of that happens here: the order is created
 * server-side and stays unpaid until the payment is confirmed on the server.
 */
export function OrderButton({
  items,
  summary,
  serviceDate,
  tableNumber,
  customerNote,
}: OrderButtonProps) {
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();
  const createOrder = useCreateOrder();
  const [showLogin, setShowLogin] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const placeOrder = async () => {
    try {
      const order = await createOrder.mutateAsync({
        items,
        tableNumber: tableNumber?.trim() || null,
        customerNote: customerNote?.trim() || null,
      });
      setPlacedOrder(order);
      playSounds.newOrder();
      toast({
        title: "Commande enregistrée",
        description: `Reçu ${order.receiptId}. Elle sera préparée après confirmation du paiement.`,
      });
    } catch (error) {
      toast({
        title: "Commande impossible",
        description:
          error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleClick = () => {
    if (items.length === 0) {
      toast({
        title: "Rien à commander",
        description: "Sélectionnez au moins un plat.",
        variant: "destructive",
      });
      return;
    }
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    void placeOrder();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={createOrder.isPending || items.length === 0}
        className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {createOrder.isPending ? "Enregistrement…" : "Commander"}
      </Button>

      <LoginDialog
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          void placeOrder();
        }}
        reason="Connectez-vous pour enregistrer votre commande."
      />

      {placedOrder && (
        <OrderReceiptDialog
          order={placedOrder}
          summary={summary}
          serviceDate={serviceDate}
          onClose={() => setPlacedOrder(null)}
        />
      )}
    </>
  );
}
