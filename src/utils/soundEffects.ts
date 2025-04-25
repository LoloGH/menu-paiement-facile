
// Sound effects for the application

// Helper to create and play audio
const playAudio = (url: string) => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5; // Set volume to 50%
    return audio.play();
  } catch (error) {
    console.error("Error playing sound:", error);
    return Promise.reject(error);
  }
};

// Common sound effects for the application
export const playSounds = {
  newOrder: () => playAudio('/sounds/new-order.mp3'),
  preparing: () => playAudio('/sounds/preparing.mp3'),
  ready: () => playAudio('/sounds/ready.mp3'),
  delivered: () => playAudio('/sounds/delivered.mp3'),
  error: () => playAudio('/sounds/error.mp3'),
  success: () => playAudio('/sounds/success.mp3'),
  notification: () => playAudio('/sounds/notification.mp3')
};
