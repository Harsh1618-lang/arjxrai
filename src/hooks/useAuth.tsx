import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/services/auth";
import { setActor } from "@/services/api";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setUser: (p: Profile | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const setUser = useCallback((p: Profile | null) => {
    setUserState(p);
    setActor(p?.email);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUser(await auth.getCurrent());
    } catch {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    let mounted = true;
    auth
      .getCurrent()
      .then((p) => mounted && setUser(p))
      .catch(() => mounted && setUser(null))
      .finally(() => mounted && setLoading(false));
    const unsubscribe = auth.subscribe((p) => {
      if (mounted) setUser(p);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setUser]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    qc.removeQueries({ queryKey: ["users"] });
  }, [qc, setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      isAuthenticated: !!user,
      setUser,
      refresh,
      signOut,
    }),
    [user, loading, setUser, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
