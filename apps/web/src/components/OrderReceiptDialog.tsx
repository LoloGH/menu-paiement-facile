import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Download } from "lucide-react";
import { formatAmount } from "@menu/shared";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import type { Order } from "@/hooks/api/types";

interface OrderReceiptDialogProps {
  order: Order;
  summary: string;
  serviceDate: string;
  onClose: () => void;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Receipt for an order that has been recorded.
 *
 * Every figure comes from the server's response, not from what the browser
 * believed it was ordering — this is the amount actually due. The wording says
 * so plainly: the order exists, the payment does not yet.
 */
export function OrderReceiptDialog({
  order,
  summary,
  serviceDate,
  onClose,
}: OrderReceiptDialogProps) {
  const { toast } = useToast();

  const downloadPdf = async () => {
    try {
      // jsPDF and its dependencies weigh close to 400 kB. Loading them only
      // when someone actually downloads a receipt keeps them out of the bundle
      // every visitor pays for.
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      let y = 20;
      const line = (text: string, size = 11) => {
        doc.setFontSize(size);
        doc.text(text, 20, y);
        y += size < 12 ? 7 : 10;
      };

      line("REÇU DE COMMANDE", 16);
      y += 4;
      line(`Reçu     : ${order.receiptId}`);
      line(`Date     : ${formatDateTime(order.createdAt)}`);
      line(`Service  : ${serviceDate}`);
      if (order.tableNumber) line(`Table    : ${order.tableNumber}`);
      y += 4;

      line("Détail", 13);
      for (const item of order.items) {
        line(`  ${item.quantity} × ${item.articleName} — ${formatAmount(item.unitPrice)}`, 10);
      }
      y += 4;
      line(`TOTAL : ${formatAmount(order.totalAmount)}`, 14);
      y += 4;
      line("Paiement : en attente de confirmation", 10);
      if (order.customerNote) line(`Note : ${order.customerNote}`, 10);

      doc.save(`recu-${order.receiptId}.pdf`);
    } catch (error) {
      logger.error("génération du PDF impossible", error);
      toast({
        title: "Téléchargement impossible",
        description: "Le reçu n'a pas pu être généré.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Commande enregistrée
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-gray-600">Reçu</dt>
              <dd className="font-mono">{order.receiptId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Date</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Table</dt>
                <dd>{order.tableNumber}</dd>
              </div>
            )}
          </dl>

          <div className="border-t pt-3">
            <p className="text-sm text-gray-600 mb-2">{summary}</p>
            <ul className="text-sm space-y-1">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.articleName}
                  </span>
                  <span>{formatAmount(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-3 flex justify-between items-baseline">
            <span className="font-medium">Total</span>
            <span className="text-xl font-semibold">{formatAmount(order.totalAmount)}</span>
          </div>

          <p className="text-sm bg-amber-50 border border-amber-200 rounded p-3">
            Votre commande est enregistrée. Elle passera en préparation une fois le paiement
            confirmé par le restaurant.
          </p>

          <div className="flex gap-2">
            <Button onClick={() => void downloadPdf()} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Télécharger le reçu
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
