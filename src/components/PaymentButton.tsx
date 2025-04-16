
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, paymentMessages, generateReceiptId } from "@/config/paymentConfig";
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentLoginDialog } from './PaymentLoginDialog';
import { PaymentReceiptDialog } from './PaymentReceiptDialog';
import { supabase } from "@/integrations/supabase/client";

interface PaymentButtonProps {
  price: number;
  label: string;
  details?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ price, label, details }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState({
    date: new Date(),
    receiptId: '',
    orderId: '', // ID de la commande dans Supabase
  });

  // Check for payment success in URL parameters when component mounts
  useEffect(() => {
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
        
        // Simulate successful payment return
        handlePaymentSuccess();
        
        // Show success toast
        toast({
          title: paymentMessages.paymentSuccess,
          description: paymentMessages.paymentSuccessDescription,
        });
      }
    };

    // Check immediately on mount
    checkPaymentStatus();

    // Also check when the window gains focus (user returns from payment page)
    const handleFocus = () => {
      checkPaymentStatus();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [toast]);

  const handlePayment = async () => {
    console.log("Payment button clicked");
    
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.user) {
      console.log("User already logged in:", session.user.id);
      
      // Récupérer les informations utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        console.error("Erreur lors de la récupération des données utilisateur:", userError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos informations. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }
      
      // User is already logged in, proceed with payment
      const orderResult = await createOrder({
        id: session.user.id,
        email: session.user.email || "",
        fullName: userData?.name || session.user.user_metadata?.name || "Utilisateur",
        phoneNumber: userData?.phone || session.user.user_metadata?.phone || ""
      });
      
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
      proceedToPayment();
    } else {
      // Not logged in, open login dialog
      setIsLoginDialogOpen(true);
    }
  };

  // Fonction pour créer un utilisateur et une commande dans Supabase
  const createOrder = async (userData: any) => {
    try {
      console.log("Creating order for user:", userData);
      
      // 1. Insérer l'utilisateur (ou le récupérer s'il existe déjà)
      let userId = userData.id;
      
      // 2. Générer un ID de reçu
      const receiptId = generateReceiptId();
      console.log("Generated receipt ID:", receiptId);

      // 3. Créer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          receipt_id: receiptId,
          total_amount: price,
          details: details || 'Menu personnalisé',
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
        userId,
        orderId: orderData.id,
        receiptId
      };
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      return null;
    }
  };

  // Fonction pour mettre à jour le statut de paiement d'une commande
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

  const handleLoginSuccess = async (userData: any) => {
    console.log("Login successful:", userData);
    
    // Fermer la boîte de dialogue de connexion
    setIsLoginDialogOpen(false);
    
    // Afficher le toast de redirection
    toast({
      title: paymentMessages.redirecting,
      description: paymentMessages.redirectDescription(price, details),
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
    
    // Procéder au paiement
    proceedToPayment();
  };
  
  const proceedToPayment = () => {
    console.log("Proceeding to payment");
    
    // Rediriger vers Wave pour le paiement
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    
    // Délai court pour permettre à l'utilisateur de voir le reçu avant redirection
    setTimeout(() => {
      const paymentUrl = `${paymentRedirectUrl}?amount=${Math.round(price)}&details=${encodeURIComponent(details || '')}&return_url=${returnUrl}`;
      console.log("Redirecting to payment URL:", paymentUrl);
      window.location.href = paymentUrl;
    }, 1500);
  };

  const handlePaymentSuccess = () => {
    console.log("Payment success handler called");
    
    // Si nous n'avons pas d'ID de reçu (par exemple, après retour de paiement),
    // en générer un nouveau
    if (!receiptData.receiptId) {
      const newReceiptData = {
        date: new Date(),
        receiptId: generateReceiptId(),
        orderId: ''
      };
      console.log("Generated new receipt data:", newReceiptData);
      setReceiptData(newReceiptData);
    }
    
    // Afficher la boîte de dialogue du reçu
    setIsReceiptDialogOpen(true);
  };

  const handleReceiptClose = () => {
    setIsReceiptDialogOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handlePayment} 
        className={`w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors ${isMobile ? 'py-3 text-sm' : ''}`}
      >
        <ShoppingCart className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
        {isMobile ? `Payez: ${Math.round(price)} FCFA` : label}
      </Button>
      
      <PaymentLoginDialog 
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        price={price}
        details={details}
      />
      
      <PaymentReceiptDialog 
        isOpen={isReceiptDialogOpen}
        onClose={handleReceiptClose}
        price={price}
        details={details}
        date={receiptData.date}
        receiptId={receiptData.receiptId}
        orderId={receiptData.orderId}
      />
    </>
  );
};
