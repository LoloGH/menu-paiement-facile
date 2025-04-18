
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl } from '@/config/paymentConfig';

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
  const handlePayment = () => {
    const fullDetails = {
      items: details,
      ...(additionalData?.tableNumber && { table: additionalData.tableNumber }),
      ...(additionalData?.clientNote && { note: additionalData.clientNote })
    };

    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));
    
    window.location.href = `${paymentRedirectUrl}?amount=${price}&details=${encodedDetails}&return_url=${returnUrl}`;
  };

  return (
    <Button 
      onClick={handlePayment}
      className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );
};
