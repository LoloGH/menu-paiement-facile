
// Payment configuration

// Redirect URL for payment processing (this should be replaced with your actual payment provider URL)
export const paymentRedirectUrl = "https://payment-provider.example.com/process";

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
