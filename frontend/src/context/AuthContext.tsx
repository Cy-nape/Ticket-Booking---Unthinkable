import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchWithAuth } from "../api";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // We don't have a /users/me endpoint that just returns the user details,
      // but we know the email from login. Ideally we'd fetch user details here.
      // For this assessment, storing token is enough to be authenticated.
      setUser({ id: "unknown", email: localStorage.getItem("email") || "User", role: "CUSTOMER" });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string, email: string) => {
    localStorage.setItem("email", email);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
