
/**
 * Sound effects utility for the application
 */

// Préchargez les sons pour une lecture plus rapide
const preloadSound = (url: string) => {
  const audio = new Audio(url);
  audio.preload = 'auto';
  return audio;
};

// Sons préchargés
const newOrderSound = preloadSound('/sounds/new-order.mp3');
const preparingSound = preloadSound('/sounds/preparing.mp3');
const readySound = preloadSound('/sounds/ready.mp3');
const deliveredSound = preloadSound('/sounds/delivered.mp3');

// Fonction utilitaire pour jouer un son avec gestion d'erreurs
const playSoundWithErrorHandling = (audio: HTMLAudioElement) => {
  // Réinitialiser le son si nécessaire
  try {
    audio.currentTime = 0;
  } catch (e) {
    console.warn("Impossible de réinitialiser le son:", e);
  }

  // Essayer de jouer le son
  try {
    const playPromise = audio.play();
    
    // La méthode play() retourne une promesse
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Son joué avec succès");
        })
        .catch(error => {
          console.error("Erreur lors de la lecture du son:", error);
          
          // En cas d'erreur, on essaie une alternative
          setTimeout(() => {
            try {
              audio.play();
            } catch (retryError) {
              console.error("Échec de la seconde tentative de lecture:", retryError);
            }
          }, 1000);
        });
    }
  } catch (e) {
    console.error("Exception lors de la lecture du son:", e);
  }
};

// Interface d'export pour les sons
export const playSounds = {
  newOrder: () => playSoundWithErrorHandling(newOrderSound),
  preparing: () => playSoundWithErrorHandling(preparingSound),
  ready: () => playSoundWithErrorHandling(readySound),
  delivered: () => playSoundWithErrorHandling(deliveredSound),
};
