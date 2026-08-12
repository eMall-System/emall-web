"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Save, X, User, Phone, Mail, Shield, LogOut, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

interface UserProfile {
  id: number;
  name: string;
  surname: string;
  phone: string;
  email: string;
  username: string;
  type: string;
  accountNumber: string;
  role: string;
  storeName: string;
  shopId?: number;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState({
    phone: false,
    email: false,
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: Number(user?.id) || 0,
    name: user?.name || "",
    surname: user?.surname || "",
    phone: user?.contacts || "",
    email: user?.email || "",
    username: user?.username || "",
    type: user?.type || "Packager",
    accountNumber: user?.username || "",
    role: "Packager",
    storeName: user?.storeName || "Not assigned",
    shopId: user?.shopId,
  });

  // Fetch user profile and shop data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        toast.error("User ID not found. Please log in again.");
        router.push("/login");
        return;
      }
      setLoading(true);
      try {
        // Fetch user details using UserID from login statusCode
        const userResponse = await authAPI.getUserById(Number(user.id));
        console.log("[AccountPage] getUserById Response:", JSON.stringify(userResponse, null, 2));
        const userData = userResponse.user;
        // Fetch shopId using roleID as pacID
        let shopId: number | undefined = undefined;
        let storeName = user?.storeName || "Not assigned";
        if (userResponse.roleID) {
          try {
            console.log(`[AccountPage] Fetching shopId for pacID: ${userResponse.roleID}`);
            shopId = (await authAPI.getShopIdByPacID(userResponse.roleID)) ?? undefined;
            if (shopId) {
              const shopResponse = await authAPI.getShopByID(shopId);
              storeName = shopResponse.dto.shopName || "Not assigned";
              console.log(`[AccountPage] Shop found: ${storeName} (ID: ${shopId})`);
            } else {
              console.warn("[AccountPage] No shop found for packager");
            }
          } catch (shopError: any) {
            console.error("[AccountPage] Failed to fetch shop data:", {
              message: shopError.message || "Unknown error",
              code: shopError.code,
              status: shopError.response?.status,
              data: shopError.response?.data ? JSON.stringify(shopError.response.data, null, 2) : null,
            });
            toast.error("Unable to fetch shop information.");
          }
        } else {
          console.warn("[AccountPage] No roleID found in userResponse");
        }
        setUserProfile({
          id: Number(user.id),
          name: userData?.uName || user?.name || "Unknown",
          surname: userData?.uSurname || user?.surname || "Unknown",
          phone: userData?.uPhone || user?.contacts || "",
          email: userData?.uEmail || user?.email || "",
          username: user?.username || userData?.uEmail || "",
          type: userData?.uType || user?.type || "Packager",
          accountNumber: user?.username || userData?.uEmail || "",
          role: "Packager",
          storeName,
          shopId,
        });
      } catch (error: any) {
        console.error("[AccountPage] Failed to fetch user profile:", {
          message: error.message || "Unknown error",
          code: error.code,
          status: error.response?.status,
          data: error.response?.data ? JSON.stringify(error.response.data, null, 2) : null,
        });
        toast.error("Failed to load profile information");
        setUserProfile((prev) => ({
          ...prev,
          storeName: "Not assigned",
          shopId: undefined,
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [user?.id, router]); // Simplified dependencies to avoid unnecessary re-fetches

  const handleEdit = (field: keyof typeof isEditing) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (field: keyof typeof isEditing) => {
    setLoading(true);
    try {
      const response = await authAPI.updateManager({
        id: userProfile.id,
        name: userProfile.name,
        surname: userProfile.surname,
        gender: user?.gender || "Other",
        contacts: userProfile.phone,
        email: userProfile.email,
        type: userProfile.type,
        password: "",
      });
      if (response.statusCode === 200) {
        setIsEditing((prev) => ({ ...prev, [field]: false }));
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error(`[AccountPage] Failed to update ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (field: keyof typeof isEditing) => {
    setIsEditing((prev) => ({ ...prev, [field]: false }));
    setUserProfile((prev) => ({
      ...prev,
      phone: user?.contacts || prev.phone,
      email: user?.email || prev.email,
    }));
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("[AccountPage] Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        const response = await authAPI.deleteManager(userProfile.id);
        if (response.statusCode === 200) {
          await logout();
          router.push("/login");
          toast.success("Account deleted successfully");
        } else {
          throw new Error(response.message || "Failed to delete account");
        }
      } catch (error: any) {
        console.error("[AccountPage] Delete account error:", error);
        toast.error("Failed to delete account");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePassword = () => {
    router.push("/packager/change-password");
  };

  if (loading && !userProfile.name) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <Card className="w-full rounded-lg shadow">
        <CardHeader className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <CardTitle className="flex items-center space-x-2 text-lg font-medium text-green-700">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
          <div className="text-right text-sm text-gray-600 space-y-1 mt-4 sm:mt-0">
            <div>Account reference no: {userProfile.accountNumber}</div>
            <div>Role: Packager</div>
            <div>Store: {userProfile.storeName}</div>
            <div>Shop ID: {userProfile.shopId || "Not assigned"}</div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" />
                <span>First Name</span>
              </Label>
              <Input
                value={userProfile.name}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">First name cannot be changed. Contact support if needed.</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <User className="h-4 w-4 text-gray-500" />
                <span>Last Name</span>
              </Label>
              <Input
                value={userProfile.surname}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Last name cannot be changed. Contact support if needed.</p>
            </div>
          </div>
          {/* Phone Field */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>Contact Number</span>
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                value={userProfile.phone}
                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                disabled={!isEditing.phone}
                className={isEditing.phone ? "border-green-300 focus:border-green-500" : "bg-gray-50"}
              />
              <div className="flex items-center space-x-1">
                {isEditing.phone ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave("phone")}
                      disabled={loading}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel("phone")}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("phone")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>Email Address</span>
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value, username: e.target.value })}
                disabled={!isEditing.email}
                className={isEditing.email ? "border-green-300 focus:border-green-500" : "bg-gray-50"}
              />
              <div className="flex items-center space-x-1">
                {isEditing.email ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave("email")}
                      disabled={loading}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel("email")}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("email")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Security & Actions */}
          <div className="pt-6">
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Shield className="h-5 w-5" />
                  <span>Security & Account Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={handleChangePassword}
                    className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

