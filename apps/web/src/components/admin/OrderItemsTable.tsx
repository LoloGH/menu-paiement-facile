
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
import { ExternalLink, Trash2, ArrowLeft, ArrowRight, History, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface OrderItemsTableProps {
  searchTerm: string;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(0);
  const [orderFilter, setOrderFilter] = useState<string>("");
  const itemsPerPage = 10;

  useEffect(() => {
    // Check URL for order ID parameter
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const orderId = urlParams.get('id');
    
    if (orderId) {
      setSelectedOrderId(orderId);
      fetchOrderItemsByOrderId(orderId);
      setViewingHistory(true);
    } else {
      fetchOrderItems();
    }
  }, [searchTerm, page, selectedDate]);

  useEffect(() => {
    if (viewingHistory) {
      fetchOrderHistory();
    }
  }, [viewingHistory, historyPage]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      // Count total items
      let countQuery = supabase
        .from("order_items")
        .select("*", { count: "exact" });
        
      if (searchTerm) {
        countQuery = countQuery.or(`main_dish.ilike.%${searchTerm}%,side_dish.ilike.%${searchTerm}%,dessert.ilike.%${searchTerm}%,day.ilike.%${searchTerm}%`);
      }

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        countQuery = countQuery
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalItems(count || 0);
      
      // Fetch items for current page
      let query = supabase
        .from("order_items")
        .select(`
          *,
          orders (
            id,
            receipt_id,
            payment_status,
            created_at,
            users (
              email,
              name
            )
          )
        `)
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);
      
      if (searchTerm) {
        query = query.or(`main_dish.ilike.%${searchTerm}%,side_dish.ilike.%${searchTerm}%,dessert.ilike.%${searchTerm}%,day.ilike.%${searchTerm}%`);
      }

      if (selectedDate) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrderItems(data || []);
      setViewingHistory(false);
      setSelectedOrderId(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les articles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItemsByOrderId = async (orderId: string) => {
    setLoading(true);
    try {
      // Fetch order information first
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          users (
            email,
            name
          )
        `)
        .eq("id", orderId)
        .single();
        
      if (orderError) throw orderError;
      
      // Then fetch the items for this order
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("day", { ascending: true });
        
      if (itemsError) throw itemsError;
      
      // Attach order info to each item
      const enrichedItems = itemsData.map(item => ({
        ...item,
        orders: orderData
      }));
      
      setOrderItems(enrichedItems || []);
      setTotalItems(enrichedItems.length);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger les articles de la commande: ${error.message}`,
        variant: "destructive",
      });
      fetchOrderItems(); // Fallback to all items
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      // Fetch the total count of orders
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact" });
        
      setTotalHistoryPages(Math.ceil((count || 0) / itemsPerPage));
      
      // Fetch the orders for the current page
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          users (
            email,
            name
          )
        `)
        .range((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage - 1)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setOrderHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: `Impossible de charger l'historique: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      try {
        const { error } = await supabase.from("order_items").delete().eq("id", id);
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "L'article a été supprimé avec succès",
        });
        
        if (selectedOrderId) {
          fetchOrderItemsByOrderId(selectedOrderId);
        } else {
          fetchOrderItems();
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Impossible de supprimer l'article: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const viewOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    fetchOrderItemsByOrderId(orderId);
    // Update URL with order ID parameter without reload
    window.history.pushState({}, '', `#/interface-admin?id=${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusColorMap: Record<string, string> = {
      'pending': 'bg-yellow-500',
      'validated': 'bg-blue-500',
      'preparing': 'bg-indigo-500',
      'delivered': 'bg-green-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-gray-500',
      'failed': 'bg-red-500'
    };
    
    const statusLabelMap: Record<string, string> = {
      'pending': 'En attente',
      'validated': 'Validée',
      'preparing': 'En préparation',
      'delivered': 'Livrée',
      'completed': 'Complétée',
      'cancelled': 'Annulée',
      'failed': 'Échouée'
    };
    
    const color = statusColorMap[status] || 'bg-gray-500';
    
    return (
      <Badge className={`${color}`}>
        {statusLabelMap[status] || status}
      </Badge>
    );
  };

  const toggleHistoryView = () => {
    if (!viewingHistory) {
      fetchOrderHistory();
    } else {
      // Clear URL parameters when going back to all items
      window.history.pushState({}, '', `#/interface-admin`);
      fetchOrderItems();
    }
    setViewingHistory(!viewingHistory);
  };

  const navigateToOrder = (direction: 'prev' | 'next') => {
    if (!orderHistory.length || !selectedOrderId) return;
    
    const currentIndex = orderHistory.findIndex(order => order.id === selectedOrderId);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = Math.min(currentIndex + 1, orderHistory.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    const newOrderId = orderHistory[newIndex].id;
    viewOrderDetails(newOrderId);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {viewingHistory 
              ? (selectedOrderId 
                  ? "Détails de la commande" 
                  : "Historique des commandes") 
              : `Articles commandés (${loading ? "..." : totalItems})`}
          </h2>
          {selectedOrderId && (
            <Badge variant="outline" className="ml-2">
              {orderItems[0]?.orders?.receipt_id || ''}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleHistoryView}
          >
            {viewingHistory 
              ? "Retour aux articles" 
              : <><History className="h-4 w-4 mr-2" /> Historique des commandes</>}
          </Button>
          
          {selectedOrderId && (
            <div className="flex gap-1 ml-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateToOrder('prev')}
                disabled={!orderHistory.length}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateToOrder('next')}
                disabled={!orderHistory.length}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {!viewingHistory && (
        <div className="mb-4 flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`${selectedDate ? 'border-blue-500' : ''}`}
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDate 
                  ? format(selectedDate, "dd MMMM yyyy", { locale: fr })
                  : "Filtrer par date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
              {selectedDate && (
                <div className="p-2 border-t border-gray-200">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedDate(undefined)}
                    className="w-full"
                  >
                    Effacer la date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {viewingHistory && !selectedOrderId ? (
        <div>
          {loading ? (
            <div className="text-center py-4">Chargement des commandes...</div>
          ) : orderHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune commande trouvée</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderHistory.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.receipt_id}</TableCell>
                      <TableCell>
                        {order.users ? `${order.users.name || 'Sans nom'} (${order.users.email})` : 'Client anonyme'}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                      <TableCell>{order.total_amount} €</TableCell>
                      <TableCell>{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => viewOrderDetails(order.id)}
                        >
                          Voir les articles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination for history */}
          {totalHistoryPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      className={historyPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - historyPage) < 3 || p === 1 || p === totalHistoryPages)
                    .map((p, i, arr) => {
                      // Add ellipsis
                      if (i > 0 && p - arr[i - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${p}`}>
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                            <PaginationItem key={p}>
                              <PaginationLink 
                                onClick={() => setHistoryPage(p)}
                                isActive={historyPage === p}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink 
                            onClick={() => setHistoryPage(p)}
                            isActive={historyPage === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                      className={historyPage >= totalHistoryPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="text-center py-4">Chargement des articles...</div>
          ) : orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm 
                ? "Aucun article ne correspond à votre recherche" 
                : selectedOrderId 
                  ? "Aucun article trouvé pour cette commande" 
                  : "Aucun article trouvé"}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jour</TableHead>
                    <TableHead>Plat principal</TableHead>
                    <TableHead>Accompagnement</TableHead>
                    <TableHead>Dessert</TableHead>
                    <TableHead>Prix</TableHead>
                    {!selectedOrderId && <TableHead>Commande</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
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
                      {!selectedOrderId && (
                        <TableCell>
                          {item.orders ? (
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span className="font-mono text-xs mr-2">{item.orders.receipt_id}</span>
                                {getStatusBadge(item.orders.payment_status)}
                              </div>
                              {item.orders.users && (
                                <span className="text-xs text-gray-500 mt-1">
                                  {item.orders.users.name || item.orders.users.email}
                                </span>
                              )}
                            </div>
                          ) : (
                            "Commande inconnue"
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {!selectedOrderId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewOrderDetails(item.order_id)}
                            title="Voir tous les articles de cette commande"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          title="Supprimer cet article"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination for normal view */}
          {!selectedOrderId && totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) < 3 || p === 1 || p === totalPages)
                    .map((p, i, arr) => {
                      // Add ellipsis
                      if (i > 0 && p - arr[i - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${p}`}>
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                            <PaginationItem key={p}>
                              <PaginationLink 
                                onClick={() => setPage(p)}
                                isActive={page === p}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <PaginationItem key={p}>
                          <PaginationLink 
                            onClick={() => setPage(p)}
                            isActive={page === p}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
