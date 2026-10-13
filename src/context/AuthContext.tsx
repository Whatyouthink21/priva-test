import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, firebaseReady } from '../lib/firebase';

interface AuthValue {
  user: User | null;
  loading: boolean;
  ready: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'Use at least 6 characters for your password.',
    'auth/email-already-in-use': 'An account already exists for that email.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
    'auth/network-request-failed': 'Network problem. Check your connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase yet.',
    'auth/configuration-not-found': 'Firebase Auth is not set up for this project yet.',
  };
  return map[code] ?? (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthValue>(() => {
    const need = () => {
      if (!auth) throw new Error('Accounts are not configured yet. Add your Firebase keys to .env.local.');
      return auth;
    };
    return {
      user,
      loading,
      ready: firebaseReady,
      signInGoogle: async () => {
        await signInWithPopup(need(), new GoogleAuthProvider());
      },
      signInEmail: async (email, password) => {
        await signInWithEmailAndPassword(need(), email.trim(), password);
      },
      signUpEmail: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(need(), email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(need(), email.trim());
      },
      signOut: async () => {
        if (auth) await fbSignOut(auth);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
