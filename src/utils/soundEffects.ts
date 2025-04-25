
const playSound = (soundUrl: string) => {
  const audio = new Audio(soundUrl);
  audio.play().catch(error => {
    console.error('Erreur lors de la lecture du son:', error);
  });
};

export const playSounds = {
  newOrder: () => playSound('/new-order.mp3'),
  preparing: () => playSound('/preparing.mp3'),
  ready: () => playSound('/ready.mp3'),
  delivered: () => playSound('/ready.mp3'), // Nous utilisons le même son pour le moment
  success: () => playSound('/notification-sound.mp3')
};
