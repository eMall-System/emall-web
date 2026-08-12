"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user?.id) {
        console.error("[ProtectedRoute] No user found, redirecting to login");
        router.push("/login");
      } else {
        console.log("[ProtectedRoute] User authenticated:", { userId: user.id });
        setIsChecking(false);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || isChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}