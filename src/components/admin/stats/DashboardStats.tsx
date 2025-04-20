import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from './StatCard';
import { TopDishesCard } from './TopDishesCard';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Check, Truck, X, Trash2, RefreshCw, Timer } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TimeRange = 'day' | 'week' | 'month';

interface DashboardStatsProps {
  className?: string;
}

interface PendingOrder {
  id: string;
  created_at: string;
  total_amount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    orderCount: 0,
    ordersByStatus: {
      validated: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      deleted: 0,
      pending: 0
    },
    revenue: 0,
    avgPrepTime: 0,
    topDishes: [] as { dish: string; count: number }[],
    revenueData: [] as { date: string; amount: number }[]
  });

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case 'day':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now, { locale: fr }),
          end: endOfWeek(now, { locale: fr })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);
      
      let query = supabase
        .from("orders")
        .select("id, total_amount, created_at, payment_status")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const { data: orders, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Calculate order status counts
      const ordersByStatus = {
        validated: orders?.filter(order => order.payment_status === 'validated').length || 0,
        delivered: orders?.filter(order => order.payment_status === 'delivered').length || 0,
        completed: orders?.filter(order => order.payment_status === 'completed').length || 0,
        cancelled: orders?.filter(order => order.payment_status === 'cancelled').length || 0,
        deleted: orders?.filter(order => order.payment_status === 'deleted').length || 0,
        pending: orders?.filter(order => order.payment_status === 'pending').length || 0
      };

      // Récupérer les commandes en attente
      const pendingOrdersData = orders?.filter(order => 
        order.payment_status === 'pending'
      ) || [];

      setPendingOrders(pendingOrdersData);

      // Calculer les revenus uniquement pour les commandes validées
      const validatedOrders = orders?.filter(order => 
        order.payment_status === 'validated'
      ) || [];

      const revenue = validatedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('main_dish, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (itemsError) throw itemsError;

      const dishCounts: Record<string, number> = {};
      orderItems?.forEach(item => {
        dishCounts[item.main_dish] = (dishCounts[item.main_dish] || 0) + 1;
      });

      const topDishes = Object.entries(dishCounts)
        .map(([dish, count]) => ({ dish, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const revenueByDate = validatedOrders.reduce((acc: Record<string, number>, order) => {
        const date = format(new Date(order.created_at), 'dd/MM');
        acc[date] = (acc[date] || 0) + Number(order.total_amount || 0);
        return acc;
      }, {});

      const revenueData = Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount: Number(amount)
      }));

      setStats({
        orderCount: validatedOrders.length,
        ordersByStatus,
        revenue,
        avgPrepTime: 30,
        topDishes,
        revenueData
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('dashboard-stats-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `payment_status=eq.validated`
        },
        (payload) => {
          console.log('Order validated:', payload);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const renderPercentageChange = (value: number) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>{Math.abs(value)}%</span>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Tableau de bord</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard
          title="Total Commandes"
          value={stats.orderCount}
          description="Commandes validées"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Revenus"
          value={formatPrice(stats.revenue)}
          description="Chiffre d'affaires total"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Temps moyen"
          value={`${stats.avgPrepTime} min`}
          description="Temps de préparation moyen"
          icon={<Timer className="h-4 w-4" />}
        />
        <TopDishesCard dishes={stats.topDishes} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 mb-4">
        <StatCard
          title="Validées"
          value={stats.ordersByStatus.validated}
          description="Commandes validées"
          className="bg-blue-50"
          icon={<Check className="h-4 w-4 text-blue-500" />}
        />
        <StatCard
          title="Livrées"
          value={stats.ordersByStatus.delivered}
          description="Commandes livrées"
          className="bg-green-50"
          icon={<Truck className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          title="Terminées"
          value={stats.ordersByStatus.completed}
          description="Commandes terminées"
          className="bg-purple-50"
          icon={<Check className="h-4 w-4 text-purple-500" />}
        />
        <StatCard
          title="Annulées"
          value={stats.ordersByStatus.cancelled}
          description="Commandes annulées"
          className="bg-orange-50"
          icon={<X className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Supprimées"
          value={stats.ordersByStatus.deleted}
          description="Commandes supprimées"
          className="bg-red-50"
          icon={<Trash2 className="h-4 w-4 text-red-500" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Évolution des revenus</h3>
            {isMobile && (
              <Button variant="ghost" size="sm" onClick={() => {}}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  name="Revenus (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Commandes en attente</h3>
            <Timer className="h-5 w-5 text-orange-500" />
          </div>
          {pendingOrders.length > 0 ? (
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune commande en attente
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
