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
import { Card } from "@/components/ui/card";
import { StatCard } from './StatCard';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month';

interface DashboardStatsProps {
  className?: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [stats, setStats] = useState({
    orderCount: 0,
    revenue: 0,
    avgPrepTime: 0,
    topDishes: [] as { dish: string; count: number }[],
    revenueData: [] as { date: string; amount: number }[]
  });

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
    const { start, end } = getDateRange(timeRange);

    try {
      // Fetch order count and revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (ordersError) throw ordersError;

      // Fetch top dishes
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('main_dish, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (itemsError) throw itemsError;

      // Calculate statistics
      const orderCount = orders?.length || 0;
      const revenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculate top dishes
      const dishCounts: Record<string, number> = {};
      orderItems?.forEach(item => {
        dishCounts[item.main_dish] = (dishCounts[item.main_dish] || 0) + 1;
      });

      const topDishes = Object.entries(dishCounts)
        .map(([dish, count]) => ({ dish, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Prepare revenue data for chart
      const revenueByDate = orders?.reduce((acc: Record<string, number>, order) => {
        const date = format(new Date(order.created_at), 'dd/MM');
        acc[date] = (acc[date] || 0) + (order.total_amount || 0);
        return acc;
      }, {});

      const revenueData = Object.entries(revenueByDate || {}).map(([date, amount]) => ({
        date,
        amount,
      }));

      setStats({
        orderCount,
        revenue,
        avgPrepTime: 30, // This would need to be calculated based on actual prep time data
        topDishes,
        revenueData
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Souscrire aux changements des commandes
    const channel = supabase
      .channel('order-changes')
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
          fetchStats(); // Rafraîchir les statistiques
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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Commandes"
          value={stats.orderCount}
          description="Total des commandes"
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
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Plats populaires"
          value={stats.topDishes[0]?.dish || 'Aucun'}
          description={`${stats.topDishes[0]?.count || 0} commandes`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Évolution des revenus</h3>
          <div className="h-[300px]">
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
          <h3 className="font-semibold mb-4">Top 5 des plats</h3>
          <div className="space-y-4">
            {stats.topDishes.map((dish, index) => (
              <div key={dish.dish} className="flex items-center justify-between">
                <span className="font-medium">{dish.dish}</span>
                <span className="text-muted-foreground">{dish.count} commandes</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
