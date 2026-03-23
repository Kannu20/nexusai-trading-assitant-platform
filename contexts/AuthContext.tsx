'use client';

// ================================================================
// contexts/AuthContext.tsx — Global Firebase auth state
// ================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  type User,
} from '@/lib/firebase';

interface DBUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  provider: string;
  plan: string;
  role: string;
  preferences: {
    currency: string;
    theme: string;
    riskProfile: string;
  };
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  dbUser: DBUser | null;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const createSession = useCallback(async (user: User) => {
    // const idToken = await user.getIdToken();
    const idToken = await user.getIdToken(true); // 🔥 force fresh token
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    const data = await res.json();
    setDbUser(data.user ?? null);
  }, []);

  useEffect(() => {
    // Only run auth listener on the client
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user ?? null);
          }
        } catch (err) {
          console.error("ME ERROR:", err);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      // await createSession(user);
      // router.push('/dashboard');
      await createSession(user);

      // 🔥 force sync
      await fetch('/api/auth/me', {
        credentials: 'include',
      });

      router.push('/dashboard');
    } catch (err: any) {
      setAuthError(parseFirebaseError(err.code) ?? err.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const user = await signInWithEmail(email, password);
      await createSession(user);
      router.push('/dashboard');
    } catch (err: any) {
      setAuthError(parseFirebaseError(err.code) ?? err.message);
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    setAuthError(null);
    try {
      const user = await signUpWithEmail(email, password, name);
      await createSession(user);
      router.push('/dashboard');
    } catch (err: any) {
      setAuthError(parseFirebaseError(err.code) ?? err.message);
    }
  };

  const logout = async () => {
    await signOut();
    setCurrentUser(null);
    setDbUser(null);
    router.push('/auth/signin');
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser, dbUser, loading, authError,
        loginWithGoogle, loginWithEmail, registerWithEmail,
        logout, clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

function parseFirebaseError(code?: string): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/user-disabled': 'This account has been disabled.',
  };
  return map[code] ?? null;
}