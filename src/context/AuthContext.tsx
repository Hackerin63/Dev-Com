import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ensureProfile, loginWithEmail, logout, readIsAdmin, registerWithEmail } from '@/services/authService';
import { auth } from '@/services/firebase';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import type { UserProfile } from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (changes: { displayName: string; phone: string; address: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      setProfile(await getUserProfile(uid));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (next) => {
      if (!next) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Force-refresh the token so a newly granted (or revoked) admin claim applies on app start.
      setIsAdmin(await readIsAdmin(next, true));
      try {
        await ensureProfile(next);
      } catch {
        // The profile can be created later; do not block sign-in.
      }
      await loadProfile(next.uid);
      setUser(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await registerWithEmail(name, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.uid);
  }, [user, loadProfile]);

  const saveProfile = useCallback(
    async (changes: { displayName: string; phone: string; address: string }) => {
      if (!user) throw new Error('You are signed out.');
      await updateUserProfile(user.uid, changes);
      await loadProfile(user.uid);
    },
    [user, loadProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isAdmin, loading, signIn, signUp, signOut, saveProfile, refreshProfile }),
    [user, profile, isAdmin, loading, signIn, signUp, signOut, saveProfile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
