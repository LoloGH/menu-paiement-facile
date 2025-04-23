
// Payment configuration

// Weekly package price
export const weeklyPackagePrice = 7500;

// Redirect URL for payment processing (this should be replaced with your actual payment provider URL)
export const paymentRedirectUrl = "https://payment-provider.example.com/process";

// Payment messages and notifications
export const paymentMessages = {
  success: "Votre paiement a été effectué avec succès",
  pending: "Votre paiement est en cours de traitement",
  failed: "Votre paiement a échoué, veuillez réessayer"
};

// Generate a unique receipt ID
export const generateReceiptId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCPT-${timestamp}-${random}`;
};

// Format price in FCFA
export const formatPriceInFCFA = (price: number): string => {
  return `${price.toLocaleString()} FCFA`;
};
