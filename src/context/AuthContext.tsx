/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { loginRequest, registerRequest } from "../services/api";
import type { AuthContextType, LoginPayload, RegisterPayload, TokenPayload, UserInfo } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): UserInfo | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload)) as TokenPayload;
    return {
      id: decoded.userId,
      email: decoded.email ?? "",
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sg_token"));
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem("sg_token");
    return saved ? decodeJwt(saved) : null;
  });

  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    localStorage.setItem("sg_token", response.token);
    setToken(response.token);
    setUser(decodeJwt(response.token));
  };

  const register = async (payload: RegisterPayload) => {
    await registerRequest(payload);
  };

  const logout = () => {
    localStorage.removeItem("sg_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<UserInfo>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      logout,
      updateUser,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
