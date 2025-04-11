
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, paymentSimulationDelay, paymentMessages } from "@/config/paymentConfig";
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentButtonProps {
  price: number;
  label: string;
  details?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ price, label, details }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handlePayment = () => {
    // Afficher le toast pour informer l'utilisateur
    toast({
      title: paymentMessages.redirecting,
      description: paymentMessages.redirectDescription(price, details),
    });

    // Redirection après un court délai
    setTimeout(() => {
      // Redirection vers le lien de paiement Wave
      window.location.href = `${paymentRedirectUrl}?amount=${price}&details=${encodeURIComponent(details || '')}`;
    }, paymentSimulationDelay);
  };

  return (
    <Button 
      onClick={handlePayment} 
      className={`w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors ${isMobile ? 'py-3 text-sm' : ''}`}
    >
      <ShoppingCart className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
      {isMobile ? `Payez: ${price.toFixed(0)} FCFA` : label}
    </Button>
  );
};
