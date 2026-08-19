
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Calendar, ChevronDown, Eye } from "lucide-react";

const UserOrders = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      try {
        // Récupérer toutes les commandes de l'utilisateur
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          throw ordersError;
        }
        
        // Pour chaque commande, récupérer ses articles
        const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          
          if (itemsError) {
            console.error(`Erreur lors de la récupération des articles pour la commande ${order.id}:`, itemsError);
            return {
              ...order,
              items: []
            };
          }
          
          return {
            ...order,
            items: itemsData
          };
        }));
        
        setOrders(ordersWithItems);
      } catch (error) {
        console.error("Erreur lors de la récupération des commandes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos commandes.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserOrders();
  }, [navigate, toast]);

  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center justify-center mb-8">
        <ShoppingBag className="h-8 w-8 text-restaurant-purple mr-3" />
        <h1 className="text-3xl font-bold text-center">Mes Commandes</h1>
      </div>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-4">Vous n'avez pas encore passé de commande.</p>
              <Button onClick={() => navigate("/")}>
                Voir le menu
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Commande #{order.receipt_id}</CardTitle>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                  </div>
                </div>
                <CardDescription className="flex justify-between">
                  <span>Total: <strong className="text-restaurant-purple">{order.total_amount} FCFA</strong></span>
                  <span className={`font-medium ${
                    order.payment_status === 'completed' 
                      ? 'text-green-600' 
                      : order.payment_status === 'pending' 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {order.payment_status === 'completed' 
                      ? 'Payé' 
                      : order.payment_status === 'pending' 
                        ? 'En attente' 
                        : 'Annulé'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{order.details || "Commande de repas"}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center" 
                    onClick={() => toggleOrderDetails(order.id)}
                  >
                    {expandedOrder === order.id ? 'Masquer les détails' : 'Voir les détails'}
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                      expandedOrder === order.id ? 'transform rotate-180' : ''
                    }`} />
                  </Button>
                </div>
                
                {expandedOrder === order.id && order.items && order.items.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Détails de la commande</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jour</TableHead>
                          <TableHead>Plat principal</TableHead>
                          <TableHead>Accompagnement</TableHead>
                          <TableHead>Dessert</TableHead>
                          <TableHead className="text-right">Prix</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.day}</TableCell>
                            <TableCell>{item.main_dish}</TableCell>
                            <TableCell>{item.side_dish || "-"}</TableCell>
                            <TableCell>{item.dessert || "-"}</TableCell>
                            <TableCell className="text-right">{item.price} FCFA</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default UserOrders;
