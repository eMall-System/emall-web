"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
  username: string;
  storeName?: string;
  shopId?: number;
  pacID?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          if (!parsedUser.pacID || !parsedUser.shopId) {
            const userResponse = await authAPI.getUserById(parsedUser.id);
            const pacID = userResponse.roleID;
            if (pacID) {
              try {
                const shopId = (await authAPI.getShopIdByPacID(pacID)) ?? undefined;
                if (shopId) {
                  const shopResponse = await authAPI.getShopByID(shopId);
                  const storeName = shopResponse.dto?.shopName || "Not assigned";
                  const updatedUser: User = { ...parsedUser, pacID, shopId, storeName };
                  setUser(updatedUser);
                  if (typeof window !== 'undefined') localStorage.setItem("user", JSON.stringify(updatedUser));
                }
              } catch (shopError: unknown) {
                console.error("[AuthContext] Failed to fetch shop data:", shopError);
              }
            }
          }
        }
      } catch (error: unknown) {
        console.error("[AuthContext] Check auth error:", error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        setToken(null);
        setUser(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const login = async (newToken: string, newUser: User) => {
    setIsLoading(true);
    try {
      setToken(newToken);
      let updatedUser: User = { ...newUser };
      if (!newUser.pacID || !newUser.shopId) {
        const userResponse = await authAPI.getUserById(newUser.id);
        const pacID = userResponse.roleID;
        let shopId: number | undefined;
        let storeName: string | undefined;
        try {
          if (pacID) {
            shopId = (await authAPI.getShopIdByPacID(pacID)) ?? undefined;
            if (shopId) {
              const shopResponse = await authAPI.getShopByID(shopId);
              storeName = shopResponse.dto?.shopName || "Not assigned";
            }
          }
        } catch (shopError: unknown) {
          console.error("[AuthContext] Failed to fetch shop data:", shopError);
        }
        updatedUser = { ...newUser, pacID: (userResponse.roleID ?? newUser.pacID), shopId, storeName };
      }
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("[AuthContext] Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
