
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, generateReceiptId } from '@/config/paymentConfig';
import { PaymentReceiptDialog } from '@/components/PaymentReceiptDialog';
import { useToast } from "@/hooks/use-toast";

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
  const [receiptId, setReceiptId] = useState("");
  const { toast } = useToast();

  const handlePayment = () => {
    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    setShowReceiptDialog(true);
    
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && { table: additionalData.tableNumber }),
      ...(additionalData?.clientNote && { note: additionalData.clientNote })
    };

    toast({
      title: "Reçu disponible",
      description: "Votre reçu est disponible pour téléchargement."
    });

    // Préparer l'URL de redirection (ne rediriger que lorsque le client ferme le reçu)
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));
    const roundedPrice = Math.round(price);
    
    sessionStorage.setItem('paymentRedirectURL', `${paymentRedirectUrl}?amount=${roundedPrice}&details=${encodedDetails}&return_url=${returnUrl}`);
  };

  const handleCloseReceipt = () => {
    setShowReceiptDialog(false);
    // Rediriger vers la page de paiement après la fermeture du reçu
    const redirectURL = sessionStorage.getItem('paymentRedirectURL');
    if (redirectURL) {
      sessionStorage.removeItem('paymentRedirectURL');
      window.location.href = redirectURL;
    }
  };

  return (
    <>
      <Button 
        onClick={handlePayment}
        className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {label} - {Math.round(price)} FCFA
      </Button>
      
      {showReceiptDialog && (
        <PaymentReceiptDialog
          isOpen={showReceiptDialog}
          onClose={handleCloseReceipt}
          price={Math.round(price)}
          details={details}
          date={new Date()}
          receiptId={receiptId}
          orderId={`ORD-${Date.now()}`}
        />
      )}
    </>
  );
};
