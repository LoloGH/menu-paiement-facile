
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase, setupRealtimeTables } from '@/integrations/supabase/client';

// Initialize realtime functionality for important tables
setupRealtimeTables().then(success => {
  if (success) {
    console.log("Realtime functionality enabled for important tables");
  } else {
    console.warn("Could not enable realtime for some tables. Some features may not work correctly.");
  }
});

// Check for payment completion in URL
const url = new URL(window.location.href);
const paymentStatus = url.searchParams.get('payment_status');
const receiptId = url.searchParams.get('receipt_id');

if (paymentStatus === 'success') {
  console.log("Payment successful, receipt ID:", receiptId);
  
  // Vérifier que la commande existe bien dans la base de données
  if (receiptId) {
    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, payment_status')
          .eq('receipt_id', receiptId)
          .maybeSingle();
          
        if (error) {
          console.error("Error checking order:", error);
        } else if (data) {
          console.log("Order found in database:", data);
          
          // Si la commande est toujours en état 'pending', la mettre à jour
          if (data.payment_status === 'pending') {
            const { error: updateError } = await supabase
              .from('orders')
              .update({ payment_status: 'validated' })
              .eq('id', data.id);
              
            if (updateError) {
              console.error("Error updating order status:", updateError);
            } else {
              console.log("Order status updated to validated");
            }
          }
        } else {
          console.warn("Order not found in database!", receiptId);
          
          // Vérifier s'il y a des informations dans le localStorage
          const pendingOrdersString = localStorage.getItem('pendingOrders');
          if (pendingOrdersString) {
            const pendingOrders = JSON.parse(pendingOrdersString);
            const matchingOrder = pendingOrders.find(o => o.receiptId === receiptId);
            
            if (matchingOrder) {
              console.log("Found matching order in localStorage, will try to recover");
            }
          }
        }
      } catch (e) {
        console.error("Exception checking order:", e);
      }
    }, 1000);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
