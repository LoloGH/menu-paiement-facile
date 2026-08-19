import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { formatAmount } from "@menu/shared";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@/hooks/api/use-orders";
import { ApiError } from "@/lib/api";
import type { DayMenu } from "@/data/menuData";
import type { Order } from "@/hooks/api/types";
import { LoginDialog } from "./LoginDialog";
import { OrderReceiptDialog } from "./OrderReceiptDialog";

/**
 * Orders the main course of every published day at once.
 *
 * The old button showed a receipt for a flat 75 000 FCFA package, redirected to
 * the payment link, and wrote nothing to the database — the customer paid and
 * neither the kitchen nor the back office ever saw the order. This one creates
 * a real order through the same route as any other, and the price is the sum of
 * the actual dishes, computed by the server.
 */
export function WeeklyOrderButton({ menus }: { menus: DayMenu[] }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();
  const createOrder = useCreateOrder();
  const [showLogin, setShowLogin] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const { items, estimate, summary } = useMemo(() => {
    const mains = menus
      .flatMap((menu) => menu.combos.slice(0, 1))
      .map((combo) => combo.mainDish)
      .filter((dish) => dish.isAvailable);

    return {
      items: mains.map((dish) => ({ menuItemId: dish.menuItemId, quantity: 1 })),
      estimate: mains.reduce((sum, dish) => sum + dish.price, 0),
      summary: mains.map((dish) => dish.name).join(", "),
    };
  }, [menus]);

  const placeOrder = async () => {
    try {
      const order = await createOrder.mutateAsync({ items });
      setPlacedOrder(order);
      toast({
        title: "Commande de la semaine enregistrée",
        description: `Reçu ${order.receiptId} — ${formatAmount(order.totalAmount)}.`,
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

  if (items.length === 0) return null;

  return (
    <>
      <Button
        size={isMobile ? "default" : "lg"}
        disabled={createOrder.isPending}
        className={`bg-restaurant-purple hover:bg-restaurant-red transition-colors ${isMobile ? "w-full" : ""}`}
        onClick={() => (isLoggedIn ? void placeOrder() : setShowLogin(true))}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {createOrder.isPending
          ? "Enregistrement…"
          : isMobile
            ? `Semaine entière — ${formatAmount(estimate)}`
            : `Commander les ${items.length} plats de la semaine — ${formatAmount(estimate)}`}
      </Button>

      <LoginDialog
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          void placeOrder();
        }}
        reason="Connectez-vous pour commander la semaine complète."
      />

      {placedOrder && (
        <OrderReceiptDialog
          order={placedOrder}
          summary={summary}
          serviceDate={menus[0]?.serviceDate ?? ""}
          onClose={() => setPlacedOrder(null)}
        />
      )}
    </>
  );
}
