// src/app/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPage from "@/components/auth/LoginPage";
import ShopManagerDashboard from "@/components/shop/ShopManagerDashboard";
import MallManagerDashboard from "@/components/mall/MallManagerDashboard";
import RetailShopDashboard from "@/components/retail/ShopManagerDashboard";
import Loader from "@/components/ui/Loader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minLoading, setMinLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !minLoading && user?.type === "Retail Shop" && user.isTempPassword) {
      router.push("/change-password");
    }
  }, [loading, minLoading, user, router]);

  if (loading || minLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Route based on user type
  if (user.type === "ShopManager") {
    return <ShopManagerDashboard />;
  }

  if (user.type === "MallManager") {
    return <MallManagerDashboard />;
  }

  if (user.type === "Retail Shop") {
    if (user.isTempPassword) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      );
    }
    return <RetailShopDashboard />;
  }

  // Default fallback
  return <LoginPage />;
}
