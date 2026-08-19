
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, UtensilsCrossed, CheckCircle, Clock, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderItemNotification } from "@/components/kitchen/OrderItemNotification";
import { KitchenOrderList } from "@/components/kitchen/KitchenOrderList";
import { KitchenHeader } from "@/components/kitchen/KitchenHeader";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const KitchenInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, adminData, isLoading } = useAdminAuth();
  const [hasNewOrder, setHasNewOrder] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !isAdmin && !isLoading) {
      toast({
        title: "Accès refusé",
        description: "Votre compte n'a pas les droits administrateur nécessaires.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isLoggedIn, isAdmin, isLoading, navigate, toast]);

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order received:', payload);
          
          // Show a toast notification
          toast({
            title: "Nouvelle commande !",
            description: `Une nouvelle commande (#${payload.new.receipt_id}) a été reçue.`,
          });
          
          // Play notification sound
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(err => console.error('Error playing notification sound:', err));
          
          // Show visual indicator
          setHasNewOrder(true);
          
          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-restaurant-purple text-white p-4 shadow-md">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-md mr-3">
                  <img 
                    src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                    alt="Logo"
                    className="h-10 w-auto"
                  />
                </div>
                <h1 className="text-2xl font-bold">Interface Cuisine</h1>
              </div>
              <Link to="/interface-admin" className="flex items-center text-white hover:text-gray-200 transition">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Retour à l'administration
              </Link>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto flex flex-col items-center justify-center py-20 px-4">
          <UtensilsCrossed className="w-20 h-20 text-restaurant-red mb-6" />
          <h1 className="text-3xl font-bold mb-3">Accès réservé</h1>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            Vous devez être connecté en tant qu'administrateur pour accéder à cette page.
          </p>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <KitchenHeader hasNewOrder={hasNewOrder} setHasNewOrder={setHasNewOrder} />
      
      <div className="container mx-auto p-4 py-8">
        <Tabs defaultValue="preparing" className="space-y-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Commandes du jour</span>
                {hasNewOrder && (
                  <Badge className="bg-red-500 animate-pulse flex items-center gap-1">
                    <Bell className="h-4 w-4 mr-1" /> 
                    Nouvelles commandes
                  </Badge>
                )}
              </CardTitle>
              <TabsList className="grid grid-cols-4 gap-4">
                <TabsTrigger value="preparing" className="relative">
                  <Clock className="h-4 w-4 mr-2" />
                  En préparation
                </TabsTrigger>
                <TabsTrigger value="ready">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Prêtes
                </TabsTrigger>
                <TabsTrigger value="all">
                  Toutes les commandes
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Commandes archivées
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="preparing" className="space-y-4 mt-2">
                <KitchenOrderList 
                  status="preparing" 
                  setHasNewOrder={setHasNewOrder} 
                />
              </TabsContent>
              
              <TabsContent value="ready" className="space-y-4 mt-2">
                <KitchenOrderList 
                  status="ready" 
                  setHasNewOrder={setHasNewOrder} 
                />
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4 mt-2">
                <KitchenOrderList 
                  status="all" 
                  setHasNewOrder={setHasNewOrder} 
                />
              </TabsContent>
              
              <TabsContent value="archived" className="space-y-4 mt-2">
                <KitchenOrderList 
                  status="archived" 
                  setHasNewOrder={setHasNewOrder} 
                />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
        
        <OrderItemNotification />
      </div>
    </div>
  );
};

export default KitchenInterface;
