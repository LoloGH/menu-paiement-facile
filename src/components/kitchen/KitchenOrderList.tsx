import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Truck, 
  Clock, 
  Package, 
  Utensils, 
  Printer 
} from "lucide-react";
import { KitchenOrderItems } from "./KitchenOrderItems";
import { playSounds } from '@/utils/soundEffects';

interface KitchenOrderListProps {
  status: "preparing" | "ready" | "all" | "archived";
  setHasNewOrder: React.Dispatch<React.SetStateAction<boolean>>;
}

export const KitchenOrderList: React.FC<KitchenOrderListProps> = ({ 
  status, 
  setHasNewOrder 
}) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          users (email, name)
        `);
      
      if (status === "preparing") {
        query = query.eq('payment_status', 'preparing');
      } else if (status === "ready") {
        query = query.eq('payment_status', 'ready');
      } else if (status === "archived") {
        query = query.or('payment_status.eq.delivered,payment_status.eq.completed');
      } else if (status === "all") {
        query = query.or('payment_status.eq.preparing,payment_status.eq.validated,payment_status.eq.ready');
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const hasNewPreparing = data.some(order => 
        order.payment_status === "preparing" && 
        new Date(order.created_at) > new Date(Date.now() - 30 * 60 * 1000)
      );
      
      if (hasNewPreparing && status === "preparing") {
        setHasNewOrder(true);
      }
      
      setOrders(data || []);
      
      const expanded: Record<string, boolean> = {};
      data?.forEach(order => {
        expanded[order.id] = expandedOrders[order.id] || false;
      });
      setExpandedOrders(expanded);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les commandes: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channels = [
      supabase
        .channel('new-orders')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('New order received:', payload);
            fetchOrders();
            
            toast({
              title: "Nouvelle commande !",
              description: `Une nouvelle commande (${payload.new.receipt_id}) a été reçue.`,
            });
            
            try {
              console.log("Playing new order sound");
              playSounds.newOrder();
            } catch (error) {
              console.error('Failed to play notification sound:', error);
            }
          }
        )
        .subscribe(),

      supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          () => {
            console.log('Order updated, refreshing...');
            fetchOrders();
          }
        )
        .subscribe(),

      supabase
        .channel('order-deletions')
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          () => {
            console.log('Order deleted, refreshing...');
            fetchOrders();
          }
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [status]);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const markOrderAsReady = async (orderId: string, notify = true) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: 'ready' })
        .eq("id", orderId);

      if (error) throw error;

      console.log("Lecture du son pour commande prête");
      playSounds.ready();

      toast({
        title: "Commande prête",
        description: "La commande a été marquée comme prête.",
      });

      if (notify) {
        const order = orders.find(o => o.id === orderId);
        console.log("Notifying client about ready order:", order?.receipt_id);
        toast({
          title: "Client notifié",
          description: "Une notification a été envoyée au client.",
        });
      }

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la commande: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const markOrderAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: 'delivered' })
        .eq("id", orderId);

      if (error) throw error;

      console.log("Lecture du son pour commande livrée");
      playSounds.delivered();

      toast({
        title: "Commande livrée",
        description: "La commande a été marquée comme livrée.",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la commande: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'validated':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" /> Validée</Badge>;
      case 'preparing':
        return <Badge className="bg-indigo-500"><Utensils className="h-3 w-3 mr-1" /> En préparation</Badge>;
      case 'ready':
        return <Badge className="bg-green-500"><Package className="h-3 w-3 mr-1" /> Prête</Badge>;
      case 'delivered':
        return <Badge className="bg-purple-500"><Truck className="h-3 w-3 mr-1" /> Livrée</Badge>;
      case 'completed':
        return <Badge className="bg-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Complétée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression.",
        variant: "destructive",
      });
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Bon de cuisine #${order.receipt_id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { text-align: center; margin-bottom: 5px; }
            h2 { text-align: center; margin-top: 0; color: #666; }
            .order-header { display: flex; justify-content: space-between; margin: 20px 0; }
            .order-info { border: 1px solid #ddd; padding: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .priority { font-weight: bold; color: red; }
            .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>BON DE PRÉPARATION</h1>
          <h2>Commande #${order.receipt_id}</h2>
          
          <div class="order-info">
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()} à ${new Date(order.created_at).toLocaleTimeString()}</div>
            <div><strong>Client:</strong> ${order.users ? (order.users.name || 'Sans nom') : 'Client'} (${order.users ? order.users.email : 'Anonyme'})</div>
            <div><strong>Statut:</strong> ${order.payment_status}</div>
          </div>
          
          <div id="itemsContainer">Chargement des articles...</div>
          
          <div class="footer">
            <p>Imprimé le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <script>
            fetch('https://kqukhginnbwuqrejhlsp.supabase.co/rest/v1/order_items?order_id=eq.${order.id}', {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWtoZ2lubmJ3dXFyZWpobHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTgzNTUsImV4cCI6MjA2MDAzNDM1NX0.-yB90sffHThPfh8dwwNpiCZCUbr2syv7rZWO6_7w2cs'
              }
            })
            .then(response => response.json())
            .then(items => {
              const itemsHtml = \`
                <table>
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Plat principal</th>
                      <th>Accompagnement</th>
                      <th>Dessert</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${items.map(item => \`
                      <tr>
                        <td>\${item.day}</td>
                        <td>\${item.main_dish}</td>
                        <td>\${item.side_dish || '-'}</td>
                        <td>\${item.dessert || '-'}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              \`;
              
              document.getElementById('itemsContainer').innerHTML = itemsHtml;
              
              setTimeout(() => {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des commandes...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-2">Aucune commande {
          status === "preparing" ? "en préparation" : 
          status === "ready" ? "prête" : 
          status === "archived" ? "archivée" : ""
        } pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id} className={`overflow-hidden ${
          order.payment_status === 'preparing' && new Date(order.created_at) > new Date(Date.now() - 30 * 60 * 1000) 
            ? 'border-2 border-restaurant-red' 
            : ''
        }`}>
          <CardContent className="p-0">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => toggleOrderExpanded(order.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="font-semibold">#{order.receipt_id}</div>
                <div className="text-sm text-gray-500 hidden md:block">
                  {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                </div>
                {getStatusBadge(order.payment_status)}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm">
                  <span className="font-medium">{order.users ? (order.users.name || order.users.email) : 'Client'}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      printOrder(order);
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  
                  {order.payment_status === 'preparing' && (
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        markOrderAsReady(order.id, true);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Marquer prête
                    </Button>
                  )}
                  
                  {order.payment_status === 'ready' && (
                    <Button 
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        markOrderAsDelivered(order.id);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Marquer livrée
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {expandedOrders[order.id] && (
              <div className="border-t p-4">
                <KitchenOrderItems orderId={order.id} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
