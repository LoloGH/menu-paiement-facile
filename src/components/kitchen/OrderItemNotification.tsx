
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

interface OrderNotification {
  id: string;
  order: any;
  timestamp: number;
}

export const OrderItemNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('orders-notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order notification:', payload);
          
          // Add new notification
          setNotifications(prev => [...prev, {
            id: payload.new.id,
            order: payload.new,
            timestamp: Date.now()
          }]);
          
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Clean up old notifications after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notif => now - notif.timestamp < 10000)
      );
      
      if (notifications.length === 0) {
        setShowNotification(false);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [notifications]);

  const closeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
    
    if (notifications.length <= 1) {
      setShowNotification(false);
    }
  };

  if (!showNotification || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full space-y-4">
      {notifications.map(notification => (
        <Card key={notification.id} className="border-2 border-restaurant-red shadow-lg animate-bounce">
          <CardHeader className="pb-2 pt-4 flex flex-row justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Bell className="h-5 w-5 mr-2 text-restaurant-red" />
              Nouvelle commande !
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => closeNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="font-medium">Commande #{notification.order.receipt_id}</p>
            <p className="text-sm text-gray-500">
              {new Date(notification.order.created_at).toLocaleString()}
            </p>
            <div className="flex justify-end mt-2">
              <Button 
                size="sm" 
                className="bg-restaurant-purple"
                onClick={() => {
                  closeNotification(notification.id);
                  window.location.reload();
                }}
              >
                Voir les détails
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
