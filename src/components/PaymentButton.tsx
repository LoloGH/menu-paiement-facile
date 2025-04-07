
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";

interface PaymentButtonProps {
  price: number;
  label: string;
  details?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ price, label, details }) => {
  const { toast } = useToast();

  const handlePayment = () => {
    // Dans une application réelle, cela redirigerait vers une passerelle de paiement
    toast({
      title: "Redirection vers le paiement",
      description: `Vous allez être redirigé vers notre portail de paiement pour un montant de ${price.toFixed(0)} FCFA${details ? ` pour ${details}` : ''}.`,
    });

    // Simuler une redirection après un court délai
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
      className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
};
