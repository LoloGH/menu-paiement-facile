
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CheckCircle, X } from "lucide-react";

interface KitchenOrderItemsProps {
  orderId: string;
}

export const KitchenOrderItems: React.FC<KitchenOrderItemsProps> = ({ orderId }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderItems();
  }, [orderId]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      
      if (error) throw error;
      
      setItems(data || []);
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

  if (loading) {
    return <div className="text-center py-4">Chargement des articles...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-4">Aucun article trouvé pour cette commande.</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jour</TableHead>
            <TableHead>Plat principal</TableHead>
            <TableHead>Accompagnement</TableHead>
            <TableHead>Dessert</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.day}</TableCell>
              <TableCell>{item.main_dish}</TableCell>
              <TableCell>{item.side_dish || <X className="h-4 w-4 text-gray-400" />}</TableCell>
              <TableCell>{item.dessert || <X className="h-4 w-4 text-gray-400" />}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
