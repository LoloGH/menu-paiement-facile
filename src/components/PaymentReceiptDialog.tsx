
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Download, FileText } from "lucide-react";

interface PaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
  details?: string;
  date: Date;
  receiptId: string;
}

export const PaymentReceiptDialog: React.FC<PaymentReceiptDialogProps> = ({
  isOpen,
  onClose,
  price,
  details,
  date,
  receiptId
}) => {
  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDownloadReceipt = () => {
    // Création du contenu du reçu
    const receiptContent = `
=======================================================
                REÇU DE COMMANDE
=======================================================

ID Commande: ${receiptId}
Date: ${formatDate(date)}

Détails: ${details || 'Menu personnalisé'}
Montant: ${price.toFixed(0)} FCFA

Merci pour votre commande !
=======================================================
    `;

    // Création d'un blob et téléchargement
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-commande-${receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-green-600">
            <Check className="mr-2 h-5 w-5" />
            Paiement réussi !
          </DialogTitle>
          <DialogDescription>
            Votre commande a été confirmée et traitée avec succès.
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
              <span>{price.toFixed(0)} FCFA</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Button 
            onClick={handleDownloadReceipt} 
            className="bg-restaurant-purple hover:bg-restaurant-red transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger le reçu
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
