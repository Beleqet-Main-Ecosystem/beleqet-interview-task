"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
  type StoredUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "EMPLOYER" | "JOB_SEEKER";
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = getAccessToken();
    const storedUser = getStoredUser();
    if (!storedToken || !storedUser) {
      setLoading(false);
      return;
    }
    setToken(storedToken);
    setUser(storedUser);
    api
      .me(storedToken)
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        clearSession();
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string, redirectTo = "/dashboard") => {
    const data = await api.login({ email, password });
    saveSession(data);
    setToken(data.accessToken);
    setUser(data.user);
    router.push(redirectTo);
  }, [router]);

  const register = useCallback(
    async (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "EMPLOYER" | "JOB_SEEKER";
    }) => {
      const data = await api.register(body);
      saveSession(data);
      setToken(data.accessToken);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    const t = getAccessToken();
    if (t) {
      try {
        await api.logout(t);
      } catch {
        // clear local session even if API fails
      }
    }
    clearSession();
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
