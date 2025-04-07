
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";

interface PaymentButtonProps {
  price: number;
  label: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ price, label }) => {
  const { toast } = useToast();

  const handlePayment = () => {
    // In a real application, this would redirect to a payment gateway
    toast({
      title: "Redirection vers le paiement",
      description: `Vous allez être redirigé vers notre portail de paiement pour un montant de ${price.toFixed(2)}€.`,
    });

    // Simulate a redirect after a short delay
    setTimeout(() => {
      toast({
        title: "Paiement simulé",
        description: "Dans une application réelle, vous seriez maintenant sur la page de paiement.",
        variant: "default",
      });
    }, 2000);
  };

  return (
    <Button 
      onClick={handlePayment} 
      className="w-full bg-restaurant-terracotta hover:bg-restaurant-brown transition-colors"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
};
