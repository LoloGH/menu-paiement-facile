
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, paymentSimulationDelay, paymentMessages, generateReceiptId } from "@/config/paymentConfig";
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentLoginDialog } from './PaymentLoginDialog';
import { PaymentReceiptDialog } from './PaymentReceiptDialog';

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
  });

  const handlePayment = () => {
    // Ouvrir le dialogue de connexion
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    // Fermer le dialogue de connexion
    setIsLoginDialogOpen(false);
    
    // Afficher le toast pour informer l'utilisateur
    toast({
      title: paymentMessages.redirecting,
      description: paymentMessages.redirectDescription(price, details),
    });

    // Redirection vers Wave
    window.location.href = `${paymentRedirectUrl}?amount=${Math.round(price)}&details=${encodeURIComponent(details || '')}`;
    
    // Note: Le code suivant ne s'exécutera pas à cause de la redirection
    // Dans un environnement réel, il faudrait gérer le retour de Wave avec un webhook
    // Pour la simulation, nous allons supprimer ce code car le reçu devrait être
    // affiché seulement après le retour de Wave, pas avant la redirection
  };

  const handlePaymentSuccess = () => {
    // Simulation d'un paiement réussi après retour de Wave
    // Ce code devrait être appelé via un webhook ou une page de retour
    const receiptId = generateReceiptId();
    setReceiptData({
      date: new Date(),
      receiptId,
    });
    
    // Afficher le dialogue du reçu
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
      />
    </>
  );
};
