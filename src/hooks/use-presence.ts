'use client';

import { useEffect } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function usePresence(userId?: string) {
  const firestore = useFirestore();

  useEffect(() => {
    if (!userId || !firestore) return;

    const userStatusRef = doc(firestore, 'users', userId);

    const goOnline = async () => {
      try {
        await updateDoc(userStatusRef, {
          isActive: true,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to set user status to online:', error);
      }
    };

    const goOffline = async () => {
      try {
        await updateDoc(userStatusRef, {
          isActive: false,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to set user status to offline:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        goOnline();
      } else {
        goOffline();
      }
    };

    // Set online on initial load
    goOnline();

    // Listen for visibility changes (tab focus/unfocus)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for page close/unload
    window.addEventListener('beforeunload', goOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', goOffline);
      // Attempt to set offline when component unmounts (e.g., logout)
      // This is not guaranteed to run, but it's a good fallback
      goOffline();
    };
  }, [userId, firestore]);
}
