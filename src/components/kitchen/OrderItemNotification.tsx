
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { playSounds } from "@/utils/soundEffects";
import { useToast } from "@/hooks/use-toast";

export const OrderItemNotification: React.FC = () => {
  const [newOrder, setNewOrder] = useState<any | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('orders-notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order notification received:', payload);
          setNewOrder(payload.new);
          setShowNotification(true);
          
          // Play notification sound
          try {
            console.log("Playing new order sound");
            playSounds.newOrder();
          } catch (error) {
            console.error('Failed to play notification sound:', error);
          }
          
          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          
          // Show toast notification
          toast({
            title: "Nouvelle commande !",
            description: `Une commande (#${payload.new.receipt_id}) vient d'être reçue.`,
            variant: "default",
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status for orders-notification:', status);
        if (status !== 'SUBSCRIBED') {
          console.warn('Could not subscribe to realtime notifications for orders');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Hide notification after 10 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const closeNotification = () => {
    setShowNotification(false);
  };

  if (!showNotification || !newOrder) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      <Card className="border-2 border-restaurant-red shadow-lg animate-bounce">
        <CardHeader className="pb-2 pt-4 flex flex-row justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2 text-restaurant-red" />
            Nouvelle commande !
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={closeNotification}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-medium">Commande #{newOrder.receipt_id}</p>
          <p className="text-sm text-gray-500">
            {new Date(newOrder.created_at).toLocaleDateString()} {new Date(newOrder.created_at).toLocaleTimeString()}
          </p>
          <div className="flex justify-end mt-2">
            <Button 
              size="sm" 
              className="bg-restaurant-purple"
              onClick={() => {
                // Mark the notification as acknowledged and close it
                setShowNotification(false);
                
                // Trigger a page reload or update to show the new order
                window.location.reload();
              }}
            >
              Voir les détails
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
