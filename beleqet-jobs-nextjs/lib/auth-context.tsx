"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "./api";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  resendVerification: () => Promise<void>;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJWT(token: string): { exp: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getTokenExpiration(token: string): number | null {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    const expiration = getTokenExpiration(currentToken);
    if (expiration && Date.now() >= expiration) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.get<User>("/users/profile", currentToken);
      setUser(userData);
      setToken(currentToken);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!token) return;

    const expiration = getTokenExpiration(token);
    if (!expiration) return;

    const timeout = setTimeout(() => {
      logout();
    }, expiration - Date.now() - 60000);

    return () => clearTimeout(timeout);
  }, [token, logout]);

  async function login(email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: User }>("/auth/login", { email, password });
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("token", res.accessToken);
    localStorage.setItem("user", JSON.stringify(res.user));
  }

  async function register(data: RegisterData) {
    const res = await api.post<{ accessToken: string; user: User }>("/auth/register", data);
    setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("token", res.accessToken);
    localStorage.setItem("user", JSON.stringify(res.user));
  }

  async function resendVerification() {
    throw new Error("Email verification not configured on this server");
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
