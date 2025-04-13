
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { OrderForm } from "./OrderForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface OrdersTableProps {
  searchTerm: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

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
          users (
            email,
            name
          )
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

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
        
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les articles de la commande: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleView = async (order: any) => {
    setCurrentOrder(order);
    await fetchOrderItems(order.id);
    setIsViewOpen(true);
  };

  const handleEdit = (order: any) => {
    setCurrentOrder(order);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      try {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "La commande a été supprimée avec succès",
        });
        
        fetchOrders();
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Impossible de supprimer la commande: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSubmit = async (orderData: any) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: orderData.payment_status,
          details: orderData.details,
        })
        .eq("id", currentOrder.id);
        
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Commande mise à jour avec succès",
      });
      
      setIsFormOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'enregistrement: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Complété</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Échoué</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Commandes ({loading ? "..." : orders.length})</h2>
      </div>

      {loading ? (
        <div className="text-center py-4">Chargement des commandes...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Aucune commande ne correspond à votre recherche" : "Aucune commande trouvée"}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.receipt_id}</TableCell>
                  <TableCell>
                    {order.users ? (
                      <div>
                        <div>{order.users.name || "Sans nom"}</div>
                        <div className="text-xs text-gray-500">{order.users.email}</div>
                      </div>
                    ) : (
                      "Client anonyme"
                    )}
                  </TableCell>
                  <TableCell>{order.total_amount} €</TableCell>
                  <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleView(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal pour éditer une commande */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          <OrderForm 
            initialData={currentOrder} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Modal pour voir les détails de la commande */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          
          {currentOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID de la commande</p>
                  <p>{currentOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Numéro de reçu</p>
                  <p>{currentOrder.receipt_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p>{currentOrder.users?.name || "Sans nom"}</p>
                  <p className="text-sm text-gray-500">{currentOrder.users?.email || "Email inconnu"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut</p>
                  <p>{getStatusBadge(currentOrder.payment_status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Montant total</p>
                  <p className="font-semibold">{currentOrder.total_amount} €</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de création</p>
                  <p>{new Date(currentOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              {currentOrder.details && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Détails</p>
                  <p>{currentOrder.details}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">Articles commandés</h3>
                {orderItems.length === 0 ? (
                  <p className="text-gray-500">Aucun article trouvé pour cette commande</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jour</TableHead>
                        <TableHead>Plat principal</TableHead>
                        <TableHead>Accompagnement</TableHead>
                        <TableHead>Dessert</TableHead>
                        <TableHead>Prix</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.day}</TableCell>
                          <TableCell>{item.main_dish}</TableCell>
                          <TableCell>{item.side_dish || "-"}</TableCell>
                          <TableCell>{item.dessert || "-"}</TableCell>
                          <TableCell>{item.price} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
