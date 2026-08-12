"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isRole } from "@/lib/permissions";
import type { AppUser, Role } from "@/types";
import {
  fetchUserRole,
  logout as logoutService,
  signIn as signInService,
} from "@/services/auth-service";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string;
  role: Role;
  profile?: AppUser | null;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  updateSession: (patch: Partial<Pick<SessionUser, "name" | "email">>) => void;
}

const SESSION_KEY = "rb-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed?.uid && isRole(parsed.role)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: SessionUser | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // abaikan jika localStorage tidak tersedia
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreFirebaseSession(uid: string, email: string | null, name: string | null) {
      const role = await fetchUserRole(uid);
      if (!active) return;
      const session: SessionUser = {
        uid,
        email,
        name: name ?? email?.split("@")[0] ?? "Pengguna",
        role: role ?? "student",
      };
      setUser(session);
      writeStoredSession(session);
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          restoreFirebaseSession(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName
          ).finally(() => {
            if (active) setLoading(false);
          });
        } else {
          if (active) {
            setUser(readStoredSession());
            setLoading(false);
          }
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }

    setUser(readStoredSession());
    setLoading(false);
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInService(email, password);
    const session: SessionUser = {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.name,
      role: result.role,
    };
    setUser(session);
    writeStoredSession(session);
    return session;
  }, []);

  const signOut = useCallback(async () => {
    await logoutService();
    setUser(null);
    writeStoredSession(null);
  }, []);

  const updateSession = useCallback(
    (patch: Partial<Pick<SessionUser, "name" | "email">>) => {
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        writeStoredSession(next);
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, updateSession }),
    [user, loading, signIn, signOut, updateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return context;
}
