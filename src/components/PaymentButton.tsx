
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
    // Generate a receipt ID
    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    
    // Show the receipt dialog
    setShowReceiptDialog(true);
    
    // Format details for the payment URL
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && { table: additionalData.tableNumber }),
      ...(additionalData?.clientNote && { note: additionalData.clientNote })
    };

    // Notify user
    toast({
      title: "Reçu disponible",
      description: "Votre reçu est disponible pour téléchargement. Vous allez être redirigé vers la page de paiement."
    });
    
    // Prepare the redirect URL (delayed to allow user to see the receipt)
    setTimeout(() => {
      const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
      const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));
      
      window.location.href = `${paymentRedirectUrl}?amount=${price}&details=${encodedDetails}&return_url=${returnUrl}`;
    }, 500);
  };

  const handleCloseReceipt = () => {
    setShowReceiptDialog(false);
  };

  return (
    <>
      <Button 
        onClick={handlePayment}
        className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {label}
      </Button>
      
      {showReceiptDialog && (
        <PaymentReceiptDialog
          isOpen={showReceiptDialog}
          onClose={handleCloseReceipt}
          price={price}
          details={details}
          date={new Date()}
          receiptId={receiptId}
          orderId={`ORD-${Date.now()}`}
        />
      )}
    </>
  );
};
