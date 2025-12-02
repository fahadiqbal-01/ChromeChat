
'use client';

// A simple map to hold our Audio objects
const audioCache: { [key: string]: HTMLAudioElement } = {};

function playSound(src: string, volume: number = 0.5) {
  try {
    // If the audio is already cached, just play it.
    if (audioCache[src]) {
      audioCache[src].currentTime = 0;
      audioCache[src].volume = volume;
      // The play() method returns a Promise.
      // We'll catch potential errors to avoid unhandled promise rejections.
      audioCache[src].play().catch(error => {
        console.error(`Error playing cached sound: ${src}`, error);
      });
    } else {
      // Otherwise, create a new Audio object, cache it, and play it.
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(error => {
        console.error(`Error playing new sound: ${src}`, error);
      });
      audioCache[src] = audio;
    }
  } catch (error) {
    console.error(`Failed to play sound: ${src}`, error);
  }
}


export function playMessageSentSound() {
    // A subtle "swoosh" sound
    playSound('https://firebasestudio.app/sounds/swoosh.mp3', 0.3);
}

export function playFriendRequestSound() {
    // A gentle "pop" sound
    playSound('https://firebasestudio.app/sounds/pop.mp3', 0.5);
}

