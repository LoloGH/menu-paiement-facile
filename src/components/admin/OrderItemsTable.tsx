
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
import { ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface OrderItemsTableProps {
  searchTerm: string;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ searchTerm }) => {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrderItems();
  }, [searchTerm, page]);

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
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrderItems(data || []);
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      try {
        const { error } = await supabase.from("order_items").delete().eq("id", id);
        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "L'article a été supprimé avec succès",
        });
        
        fetchOrderItems();
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Impossible de supprimer l'article: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Articles commandés ({loading ? "..." : totalItems})</h2>
      </div>

      {loading ? (
        <div className="text-center py-4">Chargement des articles...</div>
      ) : orderItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Aucun article ne correspond à votre recherche" : "Aucun article trouvé"}
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
                <TableHead>Commande</TableHead>
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
                  <TableCell>
                    {item.orders ? (
                      <div className="flex items-center">
                        <span className="font-mono text-xs mr-2">{item.orders.receipt_id}</span>
                        {item.orders.users && (
                          <span className="text-xs text-gray-500">{item.orders.users.name || item.orders.users.email}</span>
                        )}
                      </div>
                    ) : (
                      "Commande inconnue"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`#orders?id=${item.order_id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
  );
};
