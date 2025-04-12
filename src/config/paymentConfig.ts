
// Configuration des paiements pour l'application
// Vous pouvez modifier ces valeurs selon vos besoins

// Prix hebdomadaire pour tous les repas de la semaine
export const weeklyPackagePrice = 150;

// URL de redirection pour le paiement (lien Wave)
export const paymentRedirectUrl = "https://pay.wave.com/m/M_sn_e0AALi3GMxex/c/sn/";

// Messages de notification pour le paiement
export const paymentMessages = {
  redirecting: "Redirection vers le paiement",
  redirectDescription: (price: number, details?: string) => 
    `Vous allez être redirigé vers notre portail de paiement pour un montant de ${Math.round(price)} FCFA${details ? ` pour ${details}` : ''}.`,
  simulatedTitle: "Paiement simulé",
  simulatedDescription: "Dans une application réelle, vous seriez maintenant sur la page de paiement.",
  weeklyTitle: "Commande pour la semaine",
  weeklyDescription: (price: number) => 
    `Vous allez être redirigé vers notre portail de paiement pour un montant de ${Math.round(price)} FCFA pour tous les menus de la semaine.`,
  loginRequired: "Connexion requise",
  loginDescription: "Veuillez vous connecter pour finaliser votre commande.",
  paymentSuccess: "Paiement réussi !",
  paymentSuccessDescription: "Votre commande a été confirmée avec succès. Votre reçu est disponible.",
  userCreated: "Compte créé avec succès",
  userCreatedDescription: "Votre compte a été créé avec succès. Vous pouvez maintenant finaliser votre paiement.",
  returnToSite: "Retour au site marchand",
  returnToSiteDescription: "Vous êtes redirigé vers le site marchand..."
};

// Fonction pour générer un ID de reçu unique
export const generateReceiptId = (): string => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CMD-${timestamp}-${random}`;
};
