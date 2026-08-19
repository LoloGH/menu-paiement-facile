import { useMemo } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CircleDollarSign, ClipboardList, Clock, Utensils } from "lucide-react";
import { formatAmount } from "@menu/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminOrders } from "@/hooks/api/use-orders";
import { StatCard } from "./StatCard";

/**
 * Overview of the recent activity.
 *
 * Figures are derived from the orders the API already returns rather than from
 * a second set of aggregate queries, so the dashboard cannot disagree with the
 * order list sitting next to it.
 */
export function DashboardStats() {
  const { data, isLoading, isError, error } = useAdminOrders({ page: 1, pageSize: 100 });
  const orders = useMemo(() => data?.orders ?? [], [data]);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === "paid");
    const awaitingPayment = orders.filter((order) => order.paymentStatus === "pending");
    const inKitchen = orders.filter((order) =>
      ["new", "preparing"].includes(order.fulfillmentStatus),
    );

    // Only settled money is counted as revenue: an order can sit unpaid for
    // days, and counting it would overstate takings.
    const revenue = paid.reduce((sum, order) => sum + order.totalAmount, 0);

    const dishCounts = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        dishCounts.set(item.articleName, (dishCounts.get(item.articleName) ?? 0) + item.quantity);
      }
    }
    const topDishes = [...dishCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return {
      total: data?.total ?? orders.length,
      revenue,
      awaitingPayment: awaitingPayment.length,
      inKitchen: inKitchen.length,
      topDishes,
    };
  }, [orders, data]);

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : "Statistiques indisponibles."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Commandes"
          value={isLoading ? "…" : String(stats.total)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Encaissé"
          value={isLoading ? "…" : formatAmount(stats.revenue)}
          icon={<CircleDollarSign className="h-5 w-5" />}
          description="Commandes dont le paiement est confirmé"
        />
        <StatCard
          title="Paiements en attente"
          value={isLoading ? "…" : String(stats.awaitingPayment)}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="En cuisine"
          value={isLoading ? "…" : String(stats.inKitchen)}
          icon={<Utensils className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plats les plus commandés</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topDishes.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Pas encore de données.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topDishes} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Commandés" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
