"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Store } from "lucide-react";

// Minimal placeholder — proves the registration/2FA-login/forced-password-change
// loop closes end to end. Real retail-shop management UI is future work.
export default function RetailShopDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-md bg-white/90 shadow-xl border-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Store className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome, {user?.name || "Retail Shop"}
          </CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-500">
            Username: {user?.username}
          </p>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
