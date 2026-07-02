import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/api/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredToken();
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    authApi
      .getMe()
      .then(me => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      async login(email, password) {
        const result = await authApi.login(email, password);
        setStoredToken(result.accessToken);
        setUser(result.user);
        setStatus("authenticated");
      },
      async register(email, password) {
        const result = await authApi.register(email, password);
        setStoredToken(result.accessToken);
        setUser(result.user);
        setStatus("authenticated");
      },
      logout() {
        clearStoredToken();
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
