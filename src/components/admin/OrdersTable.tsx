
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { OrderForm } from "./OrderForm";
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
  Bell
} from "lucide-react";

interface OrdersTableProps {
  searchTerm: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, any[]>>({});
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterClient, setFilterClient] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order status changed:', payload);
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
      let query = supabase
        .from("orders")
        .select(`
          *,
          users (email, name)
        `);
      
      // Appliquer les filtres
      if (searchTerm) {
        query = query.or(`receipt_id.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }
      
      if (filterStatus) {
        query = query.eq('payment_status', filterStatus);
      }
      
      if (filterDate) {
        const dateStr = format(filterDate, 'yyyy-MM-dd');
        query = query.gte('created_at', `${dateStr}T00:00:00`).lt('created_at', `${dateStr}T23:59:59`);
      }
      
      if (filterClient) {
        query = query.eq('user_id', filterClient);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
      
      // Charger les détails pour toutes les commandes
      for (const order of data || []) {
        fetchOrderItems(order.id);
      }
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
      
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: data || []
      }));
    } catch (error: any) {
      console.error("Erreur lors du chargement des articles:", error);
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La commande a été marquée comme "${getStatusLabel(newStatus)}"`,
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      return;
    }

    try {
      // D'abord supprimer les articles liés
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Ensuite supprimer la commande
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

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
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'validated': 'Validée',
      'preparing': 'En préparation',
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
      'delivered': 'bg-green-500',
      'completed': 'bg-green-500',
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
    setCurrentOrder(order);
    setIsFormOpen(true);
  };

  const printOrder = (order: any) => {
    const items = orderDetails[order.id] || [];
    
    // Créer une fenêtre d'impression
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
          <p><strong>Client:</strong> ${order.users ? `${order.users.name || 'Sans nom'} (${order.users.email})` : 'Client anonyme'}</p>
          <p><strong>Statut:</strong> ${getStatusLabel(order.payment_status)}</p>
          
          <h2>Articles commandés</h2>
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
                  <td>${item.price} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p><strong>Montant total:</strong> ${order.total_amount} €</p>
          
          ${order.details ? `<p><strong>Détails:</strong> ${order.details}</p>` : ''}
          
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Gestion des commandes</h2>
        <div className="flex space-x-2">
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
                <SelectItem value="validated">Validée</SelectItem>
                <SelectItem value="preparing">En préparation</SelectItem>
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
              <React.Fragment key={order.id}>
                <TableRow className={order.payment_status === 'ready' ? 'bg-green-50' : ''}>
                  <TableCell>{order.receipt_id}</TableCell>
                  <TableCell>
                    {order.users ? `${order.users.name || 'Sans nom'} (${order.users.email})` : 'Client anonyme'}
                  </TableCell>
                  <TableCell>{order.total_amount} €</TableCell>
                  <TableCell>{renderStatusBadge(order.payment_status)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
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
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Valider
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'preparing')}>
                            <Package className="h-4 w-4 mr-2 text-blue-500" />
                            En préparation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Marquer prête
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                            <Truck className="h-4 w-4 mr-2 text-indigo-500" />
                            Livrée
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Terminer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                            <X className="h-4 w-4 mr-2 text-red-500" />
                            Annuler
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
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
                                      <TableCell>{item.price} €</TableCell>
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
