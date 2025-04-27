
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, generateReceiptId } from '@/config/paymentConfig';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { GuestInfoDialog } from '@/components/GuestInfoDialog';
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

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  price,
  label,
  details,
  additionalData
}) => {
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showGuestInfoDialog, setShowGuestInfoDialog] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const { toast } = useToast();
  const { isLoggedIn, userData } = useUserAuth();
  const roundedPrice = Math.round(price);

  const handlePayment = () => {
    if (isLoggedIn && userData) {
      proceedWithPayment({
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber
      });
    } else {
      setShowGuestInfoDialog(true);
    }
  };

  const saveOrderToDatabase = async (
    receiptId: string, 
    fullDetails: any, 
    guestInfo?: { fullName: string; phoneNumber?: string; loyaltyNumber?: string }
  ) => {
    try {
      let clientId = null;
      let loyaltyNumber = null;

      if (guestInfo) {
        if (guestInfo.loyaltyNumber) {
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id, loyalty_number')
            .eq('loyalty_number', guestInfo.loyaltyNumber)
            .single();

          if (existingClient) {
            clientId = existingClient.id;
            loyaltyNumber = existingClient.loyalty_number;
            await supabase
              .from('clients')
              .update({
                name: guestInfo.fullName,
                phone: guestInfo.phoneNumber,
              })
              .eq('id', clientId);

            toast({
              title: "Client fidèle reconnu",
              description: `Merci de votre fidélité ! Votre commande sera ajoutée à votre historique.`,
            });
          }
        }

        if (!clientId) {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: guestInfo.fullName,
              phone: guestInfo.phoneNumber,
            })
            .select('id, loyalty_number')
            .single();

          if (clientError) {
            console.error("Erreur lors de la création du client:", clientError);
          } else {
            clientId = newClient.id;
            loyaltyNumber = newClient.loyalty_number;
            
            toast({
              title: "Numéro de fidélité créé",
              description: `Votre numéro de fidélité est : ${loyaltyNumber}. Conservez-le pour vos prochaines commandes !`,
            });
          }
        }
      }

      const orderDetails = {
        ...fullDetails,
        loyalty_number: loyaltyNumber
      };

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        receipt_id: receiptId,
        user_id: userData?.id || null,
        client_id: clientId,
        total_amount: roundedPrice,
        details: JSON.stringify(orderDetails),
        guest_name: guestInfo?.fullName,
        guest_phone: guestInfo?.phoneNumber,
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
      playSounds.newOrder();
      
      toast({
        title: "Succès",
        description: "Votre commande a été enregistrée avec succès.",
      });

    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la commande:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre commande.",
        variant: "destructive"
      });
    }
  };

  const proceedWithPayment = (guestInfo?: { fullName: string; phoneNumber: string }) => {
    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    setShowReceiptDialog(true);
    
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && { table: additionalData.tableNumber }),
      ...(additionalData?.clientNote && { note: additionalData.clientNote }),
      ...(guestInfo?.fullName && { client: guestInfo.fullName }),
      ...(guestInfo?.phoneNumber && { phone: guestInfo.phoneNumber })
    };

    saveOrderToDatabase(newReceiptId, fullDetails, guestInfo);

    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));

    window.location.href = `${paymentRedirectUrl}?amount=${roundedPrice}&details=${encodedDetails}&return_url=${returnUrl}`;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
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
        />
      )}

      <GuestInfoDialog
        isOpen={showGuestInfoDialog}
        onClose={() => setShowGuestInfoDialog(false)}
        onSubmit={proceedWithPayment}
        price={roundedPrice}
        details={details}
      />
    </>
  );
};
