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
import { FirebaseError } from 'firebase/app';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export const useAuth = () => {
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (auth) {
      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Failed to set auth persistence", error);
      });
    }
  }, [auth]);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      if (!auth || !firestore) return null;
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(newUser, { displayName: username });

      // Create a user profile document in Firestore
      const userProfile = {
        id: newUser.uid,
        username,
        email,
      };
      const userDocRef = doc(firestore, 'users', newUser.uid);
      
      // Use the non-blocking version with proper error handling
      setDocumentNonBlocking(userDocRef, userProfile, {});
      
      return newUser;
    },
    [auth, firestore]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (!auth) return null;
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
