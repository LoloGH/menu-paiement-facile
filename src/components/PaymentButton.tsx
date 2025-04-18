
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, generateReceiptId } from '@/config/paymentConfig';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { PaymentLoginDialog } from '@/components/PaymentLoginDialog';
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from '@/hooks/use-user-auth';
import { supabase } from "@/integrations/supabase/client";

interface PaymentButtonProps {
  price: number;
  label: string;
  details: string;
  additionalData?: {
    tableNumber?: string;
    clientNote?: string;
  };
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ 
  price, 
  label, 
  details,
  additionalData 
}) => {
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const { toast } = useToast();
  const { isLoggedIn, userData } = useUserAuth();
  const roundedPrice = Math.round(price);

  const handlePayment = () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    proceedWithPayment();
  };

  const saveOrderToDatabase = async (receiptId: string, fullDetails: any) => {
    if (!isLoggedIn || !userData) {
      console.log("Non connecté, commande non enregistrée");
      return;
    }

    try {
      console.log("Enregistrement de la commande dans la base de données");
      
      // Enregistrer la commande principale
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          receipt_id: receiptId,
          user_id: userData.id,
          total_amount: roundedPrice,
          details: JSON.stringify(fullDetails),
          payment_status: 'pending'
        })
        .select('id')
        .single();
      
      if (orderError) {
        console.error("Erreur lors de l'enregistrement de la commande:", orderError);
        return;
      }
      
      console.log("Commande enregistrée avec succès:", orderData);
      
      // Vous pourriez également enregistrer des éléments de commande individuels si nécessaire
      // dans la table order_items
      if (orderData && orderData.id) {
        const orderItem = {
          order_id: orderData.id,
          main_dish: details,
          price: roundedPrice,
          day: new Date().toLocaleDateString('fr-FR', { weekday: 'long' }),
          meal_option_id: `manual-${Date.now()}`
        };
        
        if (additionalData?.tableNumber) {
          orderItem.side_dish = `Table: ${additionalData.tableNumber}`;
        }
        
        if (additionalData?.clientNote) {
          orderItem.dessert = additionalData.clientNote;
        }
        
        const { error: itemError } = await supabase
          .from('order_items')
          .insert(orderItem);
          
        if (itemError) {
          console.error("Erreur lors de l'enregistrement des éléments de commande:", itemError);
        } else {
          console.log("Éléments de commande enregistrés avec succès");
        }
      }
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la commande:", err);
    }
  };

  const proceedWithPayment = () => {
    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    setShowReceiptDialog(true);
    
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && { table: additionalData.tableNumber }),
      ...(additionalData?.clientNote && { note: additionalData.clientNote }),
      ...(userData?.fullName && { client: userData.fullName })
    };

    // Sauvegarder la commande dans la base de données
    saveOrderToDatabase(newReceiptId, fullDetails);

    toast({
      title: "Reçu disponible",
      description: "Votre reçu est disponible pour téléchargement."
    });

    // Préparer l'URL de redirection
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));
    
    // Rediriger vers la page de paiement
    window.location.href = `${paymentRedirectUrl}?amount=${roundedPrice}&details=${encodedDetails}&return_url=${returnUrl}`;
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    proceedWithPayment();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="text-lg font-bold text-restaurant-purple">
          Prix total : {roundedPrice} FCFA
        </div>
        <Button 
          onClick={handlePayment}
          className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {label}
        </Button>
      </div>
      
      {showReceiptDialog && (
        <PaymentReceiptDialog
          isOpen={showReceiptDialog}
          onClose={() => setShowReceiptDialog(false)}
          price={roundedPrice}
          details={details}
          date={new Date()}
          receiptId={receiptId}
          orderId={`ORD-${Date.now()}`}
          tableNumber={additionalData?.tableNumber}
          clientNote={additionalData?.clientNote}
          clientName={userData?.fullName}
        />
      )}

      <PaymentLoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLoginSuccess={handleLoginSuccess}
        price={roundedPrice}
        details={details}
      />
    </>
  );
};
