"use client";

import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/lib/firebase";
import { getAppUser } from "@/lib/firebase-client";
import type { AppUser } from "@/types/creatorflow";

interface AuthContextValue {
  authUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setAppUser(null);
      return;
    }

    const userDoc = await getAppUser(currentUser.uid);
    setAppUser(userDoc);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      const userDoc = await getAppUser(user.uid);
      setAppUser(userDoc);
      setLoading(false);
    });
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setAppUser(null);
  }, []);

  const value = useMemo(
    () => ({ authUser, appUser, loading, refreshUser, signOut }),
    [appUser, authUser, loading, refreshUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
