import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Download, FileText, File } from "lucide-react";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  details?: string;
  date: Date;
  receiptId: string;
  orderId?: string;
}

export const PaymentReceiptDialog: React.FC<PaymentReceiptDialogProps> = ({
  isOpen,
  onClose,
  price,
  details,
  date,
  receiptId,
  orderId
}) => {
  const { toast } = useToast();
  const roundedPrice = Math.round(price);
  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDownloadTextReceipt = () => {
    const receiptContent = `
=======================================================
                REÇU DE COMMANDE
=======================================================

ID Commande: ${receiptId}
${orderId ? `Référence DB: ${orderId}` : ''}
Date: ${formatDate(date)}

Détails: ${details || 'Menu personnalisé'}
Montant: ${roundedPrice} FCFA

Merci pour votre commande !
=======================================================
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-commande-${receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Reçu téléchargé",
      description: "Votre reçu a été téléchargé avec succès au format texte.",
    });
  };

  const handleDownloadPdfReceipt = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(128, 0, 128); // Purple color
    
    doc.text("REÇU DE COMMANDE", 105, 20, { align: "center" });
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(20, 30, 170, 15, 3, 3, 'FD');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Menu Paiement Facile", 105, 40, { align: "center" });
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 50, 170, 100, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.text("Détails de la commande:", 30, 65);
    
    doc.setFontSize(11);
    doc.text(`Numéro de commande: ${receiptId}`, 40, 80);
    if (orderId) {
      doc.text(`Référence interne: ${orderId}`, 40, 90);
    }
    doc.text(`Date: ${formatDate(date)}`, 40, orderId ? 100 : 90);
    doc.text(`Produit: ${details || 'Menu personnalisé'}`, 40, orderId ? 110 : 100);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Montant total: ${roundedPrice} FCFA`, 40, orderId ? 130 : 120);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Merci pour votre commande !", 105, 140, { align: "center" });
    
    doc.setFontSize(9);
    doc.text("Ce reçu est une preuve d'achat. Pour toute question, contactez notre service client.", 105, 180, { align: "center" });
    
    doc.save(`recu-${receiptId}.pdf`);
    
    toast({
      title: "Reçu téléchargé",
      description: "Votre reçu a été téléchargé avec succès au format PDF.",
    });
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-green-600">
            <Check className="mr-2 h-5 w-5" />
            Reçu Téléchargeable
          </DialogTitle>
          <DialogDescription>
            Votre reçu est disponible. Vous serez redirigé vers la page de paiement pour confirmer la transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 border rounded-lg p-4 my-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-restaurant-purple mr-2" />
              <h3 className="font-medium">Détails du reçu</h3>
            </div>
            <span className="text-sm text-gray-500">#{receiptId}</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Détails:</span>
              <span>{details || 'Menu personnalisé'}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-600">Total:</span>
              <span>{roundedPrice} FCFA</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button 
            onClick={handleDownloadPdfReceipt} 
            className="bg-restaurant-purple hover:bg-restaurant-red transition-colors"
          >
            <File className="mr-2 h-4 w-4" />
            Télécharger le reçu en PDF
          </Button>
          <Button 
            onClick={handleDownloadTextReceipt}
            variant="outline" 
            className="border-restaurant-purple text-restaurant-purple hover:bg-gray-100"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger en format texte
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
