
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
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn, userData } = useUserAuth();
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
      return false;
    }

    try {
      setIsProcessingOrder(true);
      console.log("Enregistrement de la commande dans la base de données", {
        receipt_id: receiptId,
        user_id: userData.id,
        total_amount: roundedPrice,
        details: JSON.stringify(fullDetails)
      });

      // Vérifie si le token est toujours valide
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("Session expirée, rafraîchissement nécessaire");
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        return false;
      }

      // Utilisez une transaction pour garantir que les deux opérations réussissent ou échouent ensemble
      // Commençons par enregistrer la commande principale
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
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
        return false;
      }

      console.log("Commande enregistrée avec succès:", orderData);

      if (orderData && orderData.length > 0) {
        const orderId = orderData[0].id;

        console.log("Enregistrement des articles de commande pour l'ID:", orderId);

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
          console.log("Ajout du numéro de table:", additionalData.tableNumber);
        }

        if (additionalData?.clientNote) {
          orderItem.dessert = additionalData.clientNote;
          console.log("Ajout de la note client:", additionalData.clientNote);
        }

        // Ajout d'une nouvelle tentative en cas d'échec
        const maxRetries = 2;
        let attemptCount = 0;
        let itemError = null;
        
        while (attemptCount <= maxRetries) {
          const { error } = await supabase.from('order_items').insert(orderItem);
          
          if (!error) {
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
            return true;
          }
          
          itemError = error;
          attemptCount++;
          
          if (attemptCount <= maxRetries) {
            console.log(`Tentative ${attemptCount}/${maxRetries} échouée. Nouvelle tentative...`);
            // Attendre un peu avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Si nous arrivons ici, c'est que toutes les tentatives ont échoué
        console.error("Toutes les tentatives d'enregistrement des éléments ont échoué:", itemError);
        toast({
          title: "Avertissement",
          description: "Votre commande a été partiellement enregistrée. Veuillez contacter le support.",
          variant: "destructive" // Changed from "warning" to "destructive" since "warning" is not a valid variant
        });
        return false;
        
      } else {
        console.error("Aucun ID de commande retourné après insertion");
        toast({
          title: "Erreur",
          description: "Commande créée mais impossible d'obtenir son identifiant.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la commande:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre commande.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessingOrder(false);
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
      }),
      timestamp: new Date().toISOString() // Ajout d'un horodatage pour le suivi
    };

    // Nous sauvegardons d'abord et vérifions le résultat
    saveOrderToDatabase(newReceiptId, fullDetails)
      .then(success => {
        toast({
          title: success ? "Reçu disponible" : "Attention",
          description: success 
            ? "Votre reçu est disponible pour téléchargement." 
            : "Nous avons rencontré un problème avec votre commande, mais votre paiement va être traité.",
          variant: success ? "default" : "destructive" // Changed from "warning" to "destructive" since "warning" is not a valid variant
        });
        
        // On ajoute des informations pour le suivi des pannes
        const diagnosticInfo = {
          timestamp: new Date().toISOString(),
          receiptId: newReceiptId,
          userId: userData?.id || 'guest',
          browser: navigator.userAgent,
          screen: `${window.innerWidth}x${window.innerHeight}`
        };
        
        console.log("Informations de diagnostic:", diagnosticInfo);
        
        // Délai augmenté à 3 secondes pour s'assurer que l'enregistrement est terminé
        setTimeout(() => {
          const returnUrl = encodeURIComponent(`${window.location.origin}?payment_status=success&receipt_id=${newReceiptId}`);
          const encodedDetails = encodeURIComponent(JSON.stringify(fullDetails));
          
          // Tenter de stocker localement la commande au cas où
          try {
            const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
            pendingOrders.push({
              receiptId: newReceiptId,
              details: fullDetails,
              amount: roundedPrice,
              createdAt: new Date().toISOString()
            });
            localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
          } catch (e) {
            console.error("Erreur lors de la sauvegarde locale:", e);
          }
          
          window.location.href = `${paymentRedirectUrl}?amount=${roundedPrice}&details=${encodedDetails}&return_url=${returnUrl}&receipt_id=${newReceiptId}`;
        }, 3000); // Augmentation du délai à 3 secondes
      });
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    proceedWithPayment();
  };

  return <>
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handlePayment} 
        className="w-full bg-restaurant-purple hover:bg-restaurant-red transition-colors"
        disabled={isProcessingOrder}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isProcessingOrder ? "Traitement en cours..." : label}
      </Button>
    </div>
    
    {showReceiptDialog && <PaymentReceiptDialog isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} price={roundedPrice} details={details} date={new Date()} receiptId={receiptId} orderId={`ORD-${Date.now()}`} tableNumber={additionalData?.tableNumber} clientNote={additionalData?.clientNote} clientName={userData?.fullName} />}

    <PaymentLoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} onLoginSuccess={handleLoginSuccess} price={roundedPrice} details={details} />
  </>;
};
