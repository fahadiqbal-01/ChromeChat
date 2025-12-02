'use client';

function playSound(src: string, volume: number = 0.5) {
  try {
    // Create a new Audio object for each playback.
    // This is more reliable across browsers than caching and reusing a single audio element,
    // especially for short sound effects, as it avoids issues with play state and browser policies.
    const audio = new Audio(src);
    audio.volume = volume;

    // The play() method returns a Promise.
    // We catch potential errors to avoid unhandled promise rejections if playback fails.
    audio.play().catch(error => {
      // Log errors for debugging, e.g., if the browser blocks autoplay.
      console.error(`Error playing sound: ${src}`, error);
    });
  } catch (error) {
    // Catch any synchronous errors during Audio object creation.
    console.error(`Failed to create or play sound: ${src}`, error);
  }
}

export function playMessageSentSound() {
    // A subtle "swoosh" sound.
    playSound('https://storage.googleapis.com/firebase-studio-starter-app-assets/swoosh.mp3', 0.3);
}

export function playFriendRequestSound() {
    // A gentle "pop" sound.
    playSound('https://storage.googleapis.com/firebase-studio-starter-app-assets/pop.mp3', 0.5);
}
