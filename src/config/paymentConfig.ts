
// Configuration des paiements pour l'application
// Vous pouvez modifier ces valeurs selon vos besoins

// Prix hebdomadaire pour tous les repas de la semaine
export const weeklyPackagePrice = 149.99;

// URL de redirection pour le paiement (remplacez par votre lien de paiement réel)
export const paymentRedirectUrl = "https://example.com/payment";

// Délai de simulation du paiement en millisecondes
export const paymentSimulationDelay = 2000;

// Messages de notification pour le paiement
export const paymentMessages = {
  redirecting: "Redirection vers le paiement",
  redirectDescription: (price: number, details?: string) => 
    `Vous allez être redirigé vers notre portail de paiement pour un montant de ${price.toFixed(0)} FCFA${details ? ` pour ${details}` : ''}.`,
  simulatedTitle: "Paiement simulé",
  simulatedDescription: "Dans une application réelle, vous seriez maintenant sur la page de paiement.",
  weeklyTitle: "Commande pour la semaine",
  weeklyDescription: (price: number) => 
    `Vous allez être redirigé vers notre portail de paiement pour un montant de ${price.toFixed(0)} FCFA pour tous les menus de la semaine.`,
};
