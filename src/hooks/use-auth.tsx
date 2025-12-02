'use client';

import {
  useAuth as useFirebaseAuth,
  useFirestore,
} from '@/firebase';
import {
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export const useAuth = () => {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (auth) {
      // This ensures the session is persisted across browser tabs and sessions.
      setPersistence(auth, browserLocalPersistence);
    }
  }, [auth]);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      if (!auth || !firestore) return null;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newUser = userCredential.user;
        if (newUser) {
          // Update Firebase Auth profile
          await updateProfile(newUser, { displayName: username });

          // Create a user profile document in Firestore
          const userProfile = {
            id: newUser.uid,
            username,
            email,
          };
          const userDocRef = doc(firestore, 'users', newUser.uid);
          await setDoc(userDocRef, userProfile);
          
          return newUser;
        }
        return null;
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      }
    },
    [auth, firestore]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (!auth) return null;
      // The component calling this will handle try-catch for UI feedback.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    },
    [auth]
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  }, [auth, router]);

  return { signup, login, logout };
};
