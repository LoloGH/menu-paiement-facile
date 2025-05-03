
import React, { useState, useEffect } from "react";
import { supabase, logAdminAction } from "@/integrations/supabase/client";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
import { NewOrderForm } from "./NewOrderForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { 
  Printer, 
  MoreVertical, 
  Check, 
  X, 
  Trash2, 
  CalendarIcon, 
  CheckCircle,
  Clock,
  Package,
  Truck,
  UtensilsCrossed,
  Bell,
  Loader2,
  Plus
} from "lucide-react";
import { playSounds } from '@/utils/soundEffects';
import { globalTaskQueue } from '@/utils/backgroundWorker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

interface OrdersTableProps {
  searchTerm: string;
  readOnly?: boolean;
  onActionPerformed?: (action: string, resource: string, details?: any) => Promise<void>;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ 
  searchTerm, 
  readOnly = false, 
  onActionPerformed 
}) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNewOrderFormOpen, setIsNewOrderFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, any[]>>({});
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterClient, setFilterClient] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Subscribe to order changes - critical for afficher les nouvelles commandes
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, filterStatus, filterDate, filterClient]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Utiliser globalTaskQueue.safeExecute pour eviter de bloquer l'interface
      const result = await globalTaskQueue.safeExecute(async () => {
        let query = supabase
          .from("orders")
          .select(`
            *,
            users (email, name)
          `);
        
        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`receipt_id.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%,guest_name.ilike.%${searchTerm}%`);
        }
        
        if (filterStatus) {
          query = query.eq('payment_status', filterStatus);
        }
        
        if (filterDate) {
          const dateStr = format(filterDate, 'yyyy-MM-dd');
          query = query.gte('created_at', `${dateStr}T00:00:00`).lt('created_at', `${dateStr}T23:59:59`);
        }
        
        if (filterClient) {
          query = query.or(`client_id.eq.${filterClient},guest_name.ilike.%${filterClient}%`);
        }
        
        return await query.order("created_at", { ascending: false });
      });

      if (result.error) throw result.error;
      
      console.log("Fetched orders:", result.data);
      setOrders(result.data || []);
      
      // Charger les détails pour toutes les commandes en tâches de fond
      for (const order of result.data || []) {
        fetchOrderItems(order.id);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des commandes:", error);
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
      // Utiliser globalTaskQueue.add pour ne pas bloquer l'interface
      globalTaskQueue.add(async () => {
        const { data, error } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId);
        
        if (error) throw error;
        
        // Mettre à jour l'état de façon sécurisée
        setOrderDetails(prev => ({
          ...prev,
          [orderId]: data || []
        }));
      });
    } catch (error: any) {
      console.error("Erreur lors du chargement des articles:", error);
    }
  };

  const handleUpdateOrder = async (orderData: any) => {
    // Indiquer que la mise à jour est en cours
    setUpdatingOrder(true);
    
    try {
      // Utiliser globalTaskQueue pour éviter de bloquer l'UI
      const result = await globalTaskQueue.add(async () => {
        // Mettre à jour la commande
        const { error } = await supabase
          .from("orders")
          .update({
            payment_status: orderData.payment_status,
            details: orderData.details
          })
          .eq("id", currentOrder.id);

        if (error) throw error;
        
        // Enregistrer l'action dans les logs d'audit si nécessaire
        if (onActionPerformed) {
          await onActionPerformed('update_order', 'orders', {
            order_id: currentOrder.id,
            new_status: orderData.payment_status
          });
        }
        
        return { success: true };
      });

      if (!result.success) throw new Error("Échec de la mise à jour");
      
      toast({
        title: "Succès",
        description: "Commande mise à jour avec succès",
      });
      
      // Recharger les données en arrière-plan
      globalTaskQueue.add(() => fetchOrders());
      
      // Fermer la boîte de dialogue après la mise à jour réussie
      setIsFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la commande: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      // Réinitialiser l'état de mise à jour
      setUpdatingOrder(false);
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      const result = await globalTaskQueue.add(async () => {
        // Insérer la nouvelle commande
        const { data: newOrder, error } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;
        
        // Enregistrer l'action dans les logs d'audit si nécessaire
        if (onActionPerformed) {
          await onActionPerformed('create_order', 'orders', {
            order_id: newOrder.id,
            client_id: newOrder.client_id,
            guest_name: newOrder.guest_name,
            amount: newOrder.total_amount
          });
        }
        
        return { success: true, order: newOrder };
      });

      if (result.success) {
        toast({
          title: "Succès",
          description: `Commande #${orderData.receipt_id} créée avec succès`,
        });
        
        // Jouer un son de notification pour la nouvelle commande
        playSounds.preparing();
        
        // Fermer le formulaire
        setIsNewOrderFormOpen(false);
        
        // Recharger les commandes
        fetchOrders();
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error);
      toast({
        title: "Erreur",
        description: `Impossible de créer la commande: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const statusToUpdate = newStatus === 'validated' ? 'preparing' : newStatus;
    try {
      await globalTaskQueue.add(async () => {
        const { error } = await supabase
          .from("orders")
          .update({ payment_status: statusToUpdate })
          .eq("id", orderId);

        if (error) throw error;

        // Jouer le son approprié selon le statut
        if (statusToUpdate === 'preparing') {
          console.log("Lecture du son pour commande en préparation");
          playSounds.preparing();
        } else if (statusToUpdate === 'ready') {
          console.log("Lecture du son pour commande prête");
          playSounds.ready();
        } else if (statusToUpdate === 'delivered') {
          console.log("Lecture du son pour commande livrée");
          playSounds.delivered();
        }

        if (onActionPerformed) {
          await onActionPerformed('update_order_status', 'orders', {
            order_id: orderId,
            new_status: statusToUpdate
          });
        }
      });

      toast({
        title: "Statut mis à jour",
        description: `La commande a été marquée comme "${getStatusLabel(statusToUpdate)}"`,
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const confirmDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      await globalTaskQueue.add(async () => {
        // D'abord supprimer les articles liés
        const { error: itemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", orderToDelete);

        if (itemsError) throw itemsError;

        // Ensuite supprimer la commande
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderToDelete);

        if (error) throw error;

        if (onActionPerformed) {
          await onActionPerformed('delete_order', 'orders', { order_id: orderToDelete });
        }
      });

      toast({
        title: "Commande supprimée",
        description: "La commande et ses articles ont été supprimés avec succès",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la commande: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'validated': 'En préparation',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'delivered': 'Livrée',
      'completed': 'Complétée',
      'cancelled': 'Annulée',
      'failed': 'Échouée'
    };
    
    return statusMap[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'validated':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'cancelled':
      case 'failed':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusColorMap: Record<string, string> = {
      'pending': 'bg-yellow-500',
      'validated': 'bg-blue-500',
      'preparing': 'bg-indigo-500',
      'ready': 'bg-green-500',
      'completed': 'bg-green-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-gray-500',
      'failed': 'bg-red-500'
    };
    
    const color = statusColorMap[status] || 'bg-gray-500';
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const handleEditOrder = (order: any) => {
    // Utiliser requestAnimationFrame pour éviter de bloquer l'UI
    requestAnimationFrame(() => {
      setCurrentOrder(order);
      setIsFormOpen(true);
    });
  };

  const printOrder = (order: any) => {
    const items = orderDetails[order.id] || [];
    
    // Parse the details if it's a string
    const details = typeof order.details === 'string' 
      ? JSON.parse(order.details || '{}') 
      : (order.details || {});
    
    // Create a window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les paramètres de votre navigateur.",
        variant: "destructive",
      });
      return;
    }
    
    // Contenu HTML à imprimer
    printWindow.document.write(`
      <html>
        <head>
          <title>Bon de commande #${order.receipt_id}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Bon de commande #${order.receipt_id}</h1>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          
          ${details.table ? `<p><strong>Table:</strong> ${details.table}</p>` : ''}
          ${details.client ? `<p><strong>Client:</strong> ${details.client}</p>` : ''}
          ${order.guest_name ? `<p><strong>Nom invité:</strong> ${order.guest_name}</p>` : ''}
          
          <p><strong>Statut:</strong> ${getStatusLabel(order.payment_status)}</p>
          
          <h2>Articles commandés</h2>
          ${details.items ? `<p><strong>Détails:</strong> ${details.items}</p>` : ''}
          
          ${details.note ? `<p><strong>Notes supplémentaires:</strong> ${details.note}</p>` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Jour</th>
                <th>Plat principal</th>
                <th>Accompagnement</th>
                <th>Dessert</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.day}</td>
                  <td>${item.main_dish}</td>
                  <td>${item.side_dish || '-'}</td>
                  <td>${item.dessert || '-'}</td>
                  <td>${formatPriceInFCFA(item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p><strong>Montant total:</strong> ${formatPriceInFCFA(order.total_amount)}</p>
          
          <div class="footer">
            <p>Bon de commande généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
      </html>
    `);
    
    // Imprimer puis fermer
    printWindow.document.close();
    printWindow.print();
  };

  const formatPriceInFCFA = (amount: number) => {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gestion des commandes</h2>
        <div className="flex space-x-2">
          {!readOnly && (
            <Button 
              onClick={() => setIsNewOrderFormOpen(true)}
              className="bg-restaurant-purple hover:bg-restaurant-purple/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle commande
            </Button>
          )}
          <Link to="/cuisine">
            <Button variant="outline" className="flex items-center">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Interface Cuisine
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filtrer par statut</label>
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">En préparation</SelectItem>
                <SelectItem value="preparing">En préparation</SelectItem>
                <SelectItem value="ready">Prête</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="completed">Complétée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="failed">Échouée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Filtrer par date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? (
                    format(filterDate, "dd MMMM yyyy", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={(date) => setFilterDate(date)}
                  initialFocus
                />
                {filterDate && (
                  <div className="p-2 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilterDate(undefined)}
                      className="w-full"
                    >
                      Effacer la date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recherche client</label>
            <Input
              placeholder="Email ou nom du client"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-restaurant-purple" />
          <p className="mt-2">Chargement des commandes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Aucune commande trouvée</p>
          {!readOnly && (
            <Button 
              onClick={() => setIsNewOrderFormOpen(true)}
              className="bg-restaurant-purple hover:bg-restaurant-purple/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une commande
            </Button>
          )}
        </div>
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
              <React.Fragment key={order.id}>
                <TableRow className={order.payment_status === 'ready' ? 'bg-green-50' : ''}>
                  <TableCell>{order.receipt_id}</TableCell>
                  <TableCell>
                    {order.users ? (
                      `${order.users.name || 'Sans nom'} (${order.users.email})`
                    ) : order.guest_name ? (
                      `${order.guest_name}${order.guest_phone ? ` (${order.guest_phone})` : ''}`
                    ) : (
                      'Client anonyme'
                    )}
                  </TableCell>
                  <TableCell>{formatPriceInFCFA(order.total_amount)}</TableCell>
                  <TableCell>{renderStatusBadge(order.payment_status)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'validated')}>
                              <Package className="h-4 w-4 mr-2 text-blue-500" />
                              Passer en préparation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Marquer prête
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                              <Truck className="h-4 w-4 mr-2 text-indigo-500" />
                              Livrée
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                              <X className="h-4 w-4 mr-2 text-red-500" />
                              Annuler
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDeleteOrder(order.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => printOrder(order)}
                        title="Imprimer le bon de commande"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`items-${order.id}`} className="border-0">
                        <AccordionTrigger className="py-2 px-4 text-sm text-gray-500">
                          Afficher les articles ({(orderDetails[order.id] || []).length})
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 bg-gray-50">
                            {orderDetails[order.id] && orderDetails[order.id].length > 0 ? (
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
                                  {orderDetails[order.id].map((item: any) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.day}</TableCell>
                                      <TableCell>{item.main_dish}</TableCell>
                                      <TableCell>{item.side_dish || '-'}</TableCell>
                                      <TableCell>{item.dessert || '-'}</TableCell>
                                      <TableCell>{formatPriceInFCFA(item.price)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-2 text-gray-500">
                                Aucun article trouvé pour cette commande
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal de modification de commande */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        // Si on essaie de fermer pendant une mise à jour, empêcher la fermeture
        if (!open && updatingOrder) return;
        setIsFormOpen(open);
        // Si on ferme le dialog, réinitialiser l'ordre courant
        if (!open) {
          setTimeout(() => setCurrentOrder(null), 300);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          <OrderForm 
            initialData={currentOrder} 
            onSubmit={handleUpdateOrder}
            onCancel={() => !updatingOrder && setIsFormOpen(false)}
          />
          {updatingOrder && (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Mise à jour en cours...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de création de nouvelle commande */}
      <Dialog open={isNewOrderFormOpen} onOpenChange={setIsNewOrderFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle commande</DialogTitle>
          </DialogHeader>
          <NewOrderForm 
            onSubmit={handleCreateOrder}
            onCancel={() => setIsNewOrderFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
