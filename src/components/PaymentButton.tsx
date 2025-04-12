
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart } from "lucide-react";
import { paymentRedirectUrl, paymentMessages, generateReceiptId } from "@/config/paymentConfig";
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

  // Check for payment success in URL parameters when component mounts
  useEffect(() => {
    const checkPaymentStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      
      if (paymentStatus === 'success') {
        // Clear URL parameters without refreshing the page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Simulate successful payment return
        handlePaymentSuccess();
        
        // Show success toast
        toast({
          title: paymentMessages.paymentSuccess,
          description: paymentMessages.paymentSuccessDescription,
        });
      }
    };

    // Check immediately on mount
    checkPaymentStatus();

    // Also check when the window gains focus (user returns from payment page)
    const handleFocus = () => {
      checkPaymentStatus();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handlePayment = () => {
    // Open login dialog - let the user login first
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    // Close login dialog
    setIsLoginDialogOpen(false);
    
    // Show redirecting toast
    toast({
      title: paymentMessages.redirecting,
      description: paymentMessages.redirectDescription(price, details),
    });

    // Generate receipt data - do this BEFORE redirecting to payment
    handlePaymentSuccess();
    
    // IMPORTANT: For a real implementation, both show the receipt AND redirect to Wave payment
    const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success`);
    
    // This is the actual redirect to Wave payment which would happen in production
    // The receipt dialog is already showing, but the user will now be redirected to Wave
    window.location.href = `${paymentRedirectUrl}?amount=${Math.round(price)}&details=${encodeURIComponent(details || '')}&return_url=${returnUrl}`;
  };

  const handlePaymentSuccess = () => {
    // Generate receipt data
    const receiptId = generateReceiptId();
    setReceiptData({
      date: new Date(),
      receiptId,
    });
    
    // Show receipt dialog
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
