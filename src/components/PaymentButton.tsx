
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, generateReceiptId } from '@/config/paymentConfig';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { PaymentLoginDialog } from '@/components/PaymentLoginDialog';
import { useToast } from "@/hooks/use-toast";
import { useUserAuth } from '@/hooks/use-user-auth';
import { supabase } from "@/integrations/supabase/client";
import { playSounds } from '@/utils/soundEffects';

interface PaymentButtonProps {
  price: number;
  label: string;
  details: string;
  additionalData?: {
    tableNumber?: string;
    clientNote?: string;
  };
}

interface OrderItem {
  order_id: string;
  main_dish: string;
  price: number;
  day: string;
  meal_option_id: string;
  side_dish?: string;
  dessert?: string;
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
  const {
    toast
  } = useToast();
  const {
    isLoggedIn,
    userData
  } = useUserAuth();
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
      console.log("Enregistrement de la commande dans la base de données", {
        receipt_id: receiptId,
        user_id: userData.id,
        total_amount: roundedPrice,
        details: JSON.stringify(fullDetails)
      });

      const {
        data: orderData,
        error: orderError
      } = await supabase.from('orders').insert({
        receipt_id: receiptId,
        user_id: userData.id,
        total_amount: roundedPrice,
        details: JSON.stringify(fullDetails),
        payment_status: 'pending'
      }).select('id');

      if (orderError) {
        console.error("Erreur lors de l'enregistrement de la commande:", orderError);
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer votre commande. Veuillez réessayer.",
          variant: "destructive"
        });
        return;
      }

      console.log("Commande enregistrée avec succès:", orderData);

      if (orderData && orderData.length > 0) {
        const orderId = orderData[0].id;

        const orderItem: OrderItem = {
          order_id: orderId,
          main_dish: details,
          price: roundedPrice,
          day: new Date().toLocaleDateString('fr-FR', {
            weekday: 'long'
          }),
          meal_option_id: `manual-${Date.now()}`
        };

        if (additionalData?.tableNumber) {
          orderItem.side_dish = `Table: ${additionalData.tableNumber}`;
        }

        if (additionalData?.clientNote) {
          orderItem.dessert = additionalData.clientNote;
        }

        const {
          error: itemError
        } = await supabase.from('order_items').insert(orderItem);

        if (itemError) {
          console.error("Erreur lors de l'enregistrement des éléments de commande:", itemError);
          toast({
            title: "Avertissement",
            description: "Votre commande a été enregistrée mais certains détails n'ont pas pu être sauvegardés.",
            variant: "default"
          });
        } else {
          // Lecture explicite du son de nouvelle commande
          try {
            console.log("Lecture du son de nouvelle commande");
            playSounds.newOrder();
          } catch (soundError) {
            console.error("Erreur lors de la lecture du son:", soundError);
          }
          
          console.log("Éléments de commande enregistrés avec succès");
          toast({
            title: "Succès",
            description: "Votre commande a été enregistrée avec succès.",
            variant: "default"
          });
        }
      } else {
        console.error("Aucun ID de commande retourné après insertion");
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la commande:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre commande.",
        variant: "destructive"
      });
    }
  };

  const proceedWithPayment = () => {
    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    setShowReceiptDialog(true);
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && {
        table: additionalData.tableNumber
      }),
      ...(additionalData?.clientNote && {
        note: additionalData.clientNote
      }),
      ...(userData?.fullName && {
        client: userData.fullName
      })
    };

    saveOrderToDatabase(newReceiptId, fullDetails);
    toast({
      title: "Reçu disponible",
      description: "Votre reçu est disponible pour téléchargement."
    });

    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));

    window.location.href = `${paymentRedirectUrl}?amount=${roundedPrice}&details=${encodedDetails}&return_url=${returnUrl}`;
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    proceedWithPayment();
  };

  return <>
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handlePayment} className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors">
        <ShoppingCart className="mr-2 h-5 w-5" />
        {label}
      </Button>
    </div>
    
    {showReceiptDialog && <PaymentReceiptDialog isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} price={roundedPrice} details={details} date={new Date()} receiptId={receiptId} orderId={`ORD-${Date.now()}`} tableNumber={additionalData?.tableNumber} clientNote={additionalData?.clientNote} clientName={userData?.fullName} />}

    <PaymentLoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} onLoginSuccess={handleLoginSuccess} price={roundedPrice} details={details} />
  </>;
};
