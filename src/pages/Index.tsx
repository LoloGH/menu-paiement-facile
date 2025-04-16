
import React, { useState, useEffect } from 'react';
import { MenuCard } from '@/components/MenuCard';
import { WeekNavigation } from '@/components/WeekNavigation';
import { weeklyMenu } from '@/data/menuData';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CalendarCheck, ShoppingCart } from "lucide-react";
import { weeklyPackagePrice, paymentRedirectUrl, paymentMessages } from '@/config/paymentConfig';
import { SocialMediaButtons } from '@/components/SocialMediaButtons';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserHeader } from '@/components/user-header/UserHeader';
import { PaymentLoginDialog } from '@/components/PaymentLoginDialog';
import { useState as useHookState } from 'react';
import { useUserAuth } from '@/hooks/use-user-auth';
import { supabase } from "@/integrations/supabase/client";
import { generateReceiptId } from '@/config/paymentConfig';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';

const Index = () => {
  const [activeDay, setActiveDay] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useHookState(false);
  const { isLoggedIn, userData } = useUserAuth();
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState({
    date: new Date(),
    receiptId: '',
    orderId: '',
  });

  useEffect(() => {
    const getCurrentDay = () => {
      const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const currentDayName = daysOfWeek[new Date().getDay()];
      
      const todayMenu = weeklyMenu.find(menu => menu.day.includes(currentDayName));
      
      if (todayMenu) {
        setActiveDay(todayMenu.id);
      } else {
        setActiveDay(weeklyMenu[0].id);
      }
    };
    
    getCurrentDay();
    
    // Check for payment success in URL parameters
    const checkPaymentStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      
      console.log("Checking payment status:", paymentStatus);
      
      if (paymentStatus === 'success') {
        // Clear URL parameters without refreshing the page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Récupérer l'ID de commande temporaire du localStorage pour mise à jour
        const tempOrderId = localStorage.getItem('temp_order_id');
        console.log("Retrieved temp order ID:", tempOrderId);
        
        if (tempOrderId) {
          // Mettre à jour le statut de la commande dans Supabase
          updateOrderStatus(tempOrderId, 'completed');
          localStorage.removeItem('temp_order_id');
        }
        
        // Show success toast
        toast({
          title: paymentMessages.paymentSuccess,
          description: paymentMessages.paymentSuccessDescription,
        });
      }
    };
    
    checkPaymentStatus();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      console.log("Updating order status:", orderId, status);
      
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);
      
      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }
      
      console.log("Order status updated successfully");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
    }
  };

  const handleWeeklyPayment = async () => {
    console.log("Weekly payment button clicked");
    
    if (isLoggedIn && userData) {
      console.log("User already logged in:", userData.id);
      
      // User is already logged in, proceed with payment
      const orderResult = await createOrder(userData);
      
      if (!orderResult) {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la création de la commande.",
          variant: "destructive"
        });
        return;
      }
      
      // Generate receipt data
      setReceiptData({
        date: new Date(),
        receiptId: orderResult.receiptId,
        orderId: orderResult.orderId
      });
      
      // Show receipt dialog
      setIsReceiptDialogOpen(true);
      
      // Redirect to payment
      setTimeout(() => {
        proceedToPayment();
      }, 1000);
    } else {
      // Not logged in, open login dialog
      setIsLoginDialogOpen(true);
    }
  };
  
  const createOrder = async (userData: any) => {
    try {
      console.log("Creating order for user:", userData);
      
      // Générer un ID de reçu
      const receiptId = generateReceiptId();
      console.log("Generated receipt ID:", receiptId);

      // Créer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userData.id,
          receipt_id: receiptId,
          total_amount: weeklyPackagePrice,
          details: 'Menu Semaine Complete',
          payment_status: 'pending'
        })
        .select('id')
        .single();
      
      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }
      
      console.log("Order created successfully:", orderData);
      
      // Stocker l'ID de commande temporairement dans le localStorage
      localStorage.setItem('temp_order_id', orderData.id);
      
      return {
        userId: userData.id,
        orderId: orderData.id,
        receiptId
      };
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      return null;
    }
  };
  
  const proceedToPayment = () => {
    console.log("Proceeding to payment");
    
    // Rediriger vers Wave pour le paiement
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const paymentUrl = `${paymentRedirectUrl}?amount=${Math.round(weeklyPackagePrice)}&details=Menu_Semaine_Complete&return_url=${returnUrl}`;
    console.log("Redirecting to payment URL:", paymentUrl);
    window.location.href = paymentUrl;
  };
  
  const handleLoginSuccess = async (userData: any) => {
    console.log("Login successful:", userData);
    
    // Fermer la boîte de dialogue de connexion
    setIsLoginDialogOpen(false);
    
    // Afficher le toast de redirection
    toast({
      title: paymentMessages.redirecting,
      description: paymentMessages.redirectDescription(weeklyPackagePrice, "Menu Semaine Complete"),
    });
    
    // Créer la commande dans Supabase
    const orderResult = await createOrder(userData);
    if (!orderResult) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de la commande.",
        variant: "destructive"
      });
      return;
    }

    // Générer les données du reçu
    setReceiptData({
      date: new Date(),
      receiptId: orderResult.receiptId,
      orderId: orderResult.orderId
    });
    
    // Afficher la boîte de dialogue du reçu
    setIsReceiptDialogOpen(true);
    
    // Procéder au paiement après un court délai
    setTimeout(() => {
      proceedToPayment();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30">
      <header className="bg-restaurant-purple text-white py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-2 rounded-lg">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png" 
                  alt="AXESS Logo" 
                  className="h-16 md:h-20 mr-4"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserHeader className="mr-4" />
              <SocialMediaButtons />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Menu de la Semaine</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Découvrez nos délicieux repas préparés par nos chefs pour chaque jour de la semaine.
              Commandez à l'avance et profitez de repas frais et savoureux.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-restaurant-red text-white text-lg font-semibold px-6 py-3 rounded-full mb-6">
            Économisez en commandant pour toute la semaine !
          </div>
          <Button 
            onClick={handleWeeklyPayment}
            size={isMobile ? "default" : "lg"} 
            className={`bg-restaurant-purple hover:bg-restaurant-red transition-colors ${isMobile ? 'w-full' : ''}`}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isMobile ? (
              "Semaine entière - " + weeklyPackagePrice.toFixed(0) + " FCFA"
            ) : (
              "Payez Maintenant - Tous les repas de la semaine pour " + weeklyPackagePrice.toFixed(0) + " FCFA"
            )}
            <CalendarCheck className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {activeDay && (
          <>
            <WeekNavigation 
              menus={weeklyMenu} 
              activeDay={activeDay} 
              setActiveDay={setActiveDay} 
            />

            <div className="animate-fade-in">
              {weeklyMenu.map((menu) => (
                <div 
                  key={menu.id} 
                  className={`transition-all duration-500 ${
                    activeDay === menu.id ? "block" : "hidden"
                  }`}
                >
                  <MenuCard menu={menu} isActive={activeDay === menu.id} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="bg-restaurant-purple text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white p-2 rounded-lg mr-4">
                <img 
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png" 
                  alt="AXESS Logo" 
                  className="h-12"
                />
              </div>
              <p className="text-sm">© 2025 Semaine Menu Paiement Facile</p>
            </div>
            <SocialMediaButtons />
          </div>
          <div className="text-center mt-4">
            <p className="text-sm">
              Tous nos plats sont préparés avec des ingrédients frais et de qualité.
              Livraison disponible dans un rayon de 10 km.
            </p>
          </div>
        </div>
      </footer>
      
      <PaymentLoginDialog 
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        price={weeklyPackagePrice}
        details="Menu Semaine Complete"
      />
      
      <PaymentReceiptDialog 
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        price={weeklyPackagePrice}
        details="Menu Semaine Complete"
        date={receiptData.date}
        receiptId={receiptData.receiptId}
        orderId={receiptData.orderId}
      />
    </div>
  );
};

export default Index;
