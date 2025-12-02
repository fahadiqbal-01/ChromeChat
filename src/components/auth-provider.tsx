'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  signup: (username: string, email: string, password: string) => Promise<User | null>;
  logout: () => void;
  users: User[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('chromechat-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('chromechat-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userToStore } = foundUser;
      localStorage.setItem('chromechat-user', JSON.stringify(userToStore));
      setUser(userToStore);
      return userToStore;
    }
    return null;
  }, [users]);

  const signup = useCallback(async (username: string, email: string, password: string): Promise<User | null> => {
    if (users.some(u => u.email === email)) {
      throw new Error('User with this email already exists.');
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username is already taken.');
    }

    const newUser: User = { id: `user-${Date.now()}`, username, email, password };
    const { password: _, ...userToStore } = newUser;
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    localStorage.setItem('chromechat-user', JSON.stringify(userToStore));
    setUser(userToStore);
    return userToStore;
  }, [users]);

  const logout = useCallback(() => {
    localStorage.removeItem('chromechat-user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, users }}>
      {children}
    </AuthContext.Provider>
  );
}
