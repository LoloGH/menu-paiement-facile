
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
      
      if (paymentStatus === 'success') {
        // Clear URL parameters without refreshing the page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Récupérer l'ID de commande temporaire du localStorage pour mise à jour
        const tempOrderId = localStorage.getItem('temp_order_id');
        if (tempOrderId) {
          // Mettre à jour le statut de la commande dans Supabase
          updateOrderStatus(tempOrderId, 'paid');
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
  }, []);

  const handlePayment = () => {
    // Open login dialog - let the user login first
    setIsLoginDialogOpen(true);
  };

  // Fonction pour créer un utilisateur et une commande dans Supabase
  const createOrder = async (userData) => {
    try {
      // 1. Insérer l'utilisateur (ou le récupérer s'il existe déjà)
      let userId;
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();
      
      if (userCheckError || !existingUser) {
        // L'utilisateur n'existe pas, on le crée
        const { data: newUser, error: userInsertError } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            name: userData.fullName,
            phone: userData.phoneNumber
          })
          .select('id')
          .single();
        
        if (userInsertError) throw userInsertError;
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }
      
      // 2. Générer un ID de reçu
      const receiptId = generateReceiptId();

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
      
      if (orderError) throw orderError;
      
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
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
    }
  };

  const handleLoginSuccess = async (userData) => {
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
    
    // Rediriger vers Wave pour le paiement
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    
    // Délai court pour permettre à l'utilisateur de voir le reçu avant redirection
    setTimeout(() => {
      window.location.href = `${paymentRedirectUrl}?amount=${Math.round(price)}&details=${encodeURIComponent(details || '')}&return_url=${returnUrl}`;
    }, 1500);
  };

  const handlePaymentSuccess = () => {
    // Si nous n'avons pas d'ID de reçu (par exemple, après retour de paiement),
    // en générer un nouveau
    if (!receiptData.receiptId) {
      setReceiptData({
        date: new Date(),
        receiptId: generateReceiptId(),
        orderId: ''
      });
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
