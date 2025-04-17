
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";

interface OrdersTableProps {
  searchTerm: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          users (email, name)
        `);
      
      if (searchTerm) {
        query = query.or(`receipt_id.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
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

  const handleUpdateOrder = async (orderData: any) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: orderData.payment_status,
          details: orderData.details
        })
        .eq("id", currentOrder.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Commande mise à jour avec succès",
      });

      setIsFormOpen(false);
      fetchOrders(); // Refresh the orders list
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la commande: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'En attente', color: 'bg-yellow-500' },
      'completed': { label: 'Complété', color: 'bg-green-500' },
      'failed': { label: 'Échoué', color: 'bg-red-500' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-500' };
    
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const handleEditOrder = (order: any) => {
    setCurrentOrder(order);
    setIsFormOpen(true);
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-4">Chargement des commandes...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">Aucune commande trouvée</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.receipt_id}</TableCell>
                <TableCell>
                  {order.users ? `${order.users.name || 'Sans nom'} (${order.users.email})` : 'Client anonyme'}
                </TableCell>
                <TableCell>{order.total_amount} €</TableCell>
                <TableCell>{renderStatusBadge(order.payment_status)}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditOrder(order)}
                  >
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          <OrderForm 
            initialData={currentOrder} 
            onSubmit={handleUpdateOrder}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

