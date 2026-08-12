"use client";

import { useState } from "react";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Mail, Phone, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

const registerSchema = z.object({
  shopName: z.string().min(2, "Retail name is required"),
  email: z.string().email("Enter a valid email address"),
  tellphone: z.string().regex(/^\d{10}$/, "Must be a 10-digit phone number"),
  shopType: z.string().min(1, "Business type is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [hasBranches, setHasBranches] = useState(false);
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [cipcDocFile, setCipcDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      shopName: "",
      email: "",
      tellphone: "",
      shopType: "",
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    if (!shopImageFile) {
      toast.error("Please upload a shop image.");
      return;
    }
    if (!cipcDocFile) {
      toast.error("Please upload your CIPC document.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ShopName", data.shopName);
      formData.append("Email", data.email);
      formData.append("Tellphone", data.tellphone);
      formData.append("ShopType", data.shopType);
      formData.append("HasBranches", hasBranches ? "true" : "false");
      formData.append("image", shopImageFile);
      formData.append("cipc", cipcDocFile);

      const response = await authAPI.registerRetail(formData);

      if (response.statusCode === 200) {
        toast.success(response.message || "Registration received. Check your email for confirmation.");
        router.push("/login");
      } else {
        toast.error(response.message || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-md bg-white/90 shadow-xl border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Register Your Business</CardTitle>
            <CardDescription>
              We'll review your application and email you once it's approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <Label htmlFor="shopName">Retail Name</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="shopName"
                    type="text"
                    placeholder="Your business name"
                    className="pl-10"
                    {...form.register("shopName")}
                    aria-invalid={!!form.formState.errors.shopName}
                  />
                </div>
                {form.formState.errors.shopName && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shopName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="business@example.com"
                    className="pl-10"
                    {...form.register("email")}
                    aria-invalid={!!form.formState.errors.email}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tellphone">Telephone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="tellphone"
                    type="text"
                    placeholder="0821234567"
                    className="pl-10"
                    {...form.register("tellphone")}
                    aria-invalid={!!form.formState.errors.tellphone}
                  />
                </div>
                {form.formState.errors.tellphone && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.tellphone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="shopType">Business Type</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="shopType"
                    type="text"
                    placeholder="e.g. Grocery, Electronics"
                    className="pl-10"
                    {...form.register("shopType")}
                    aria-invalid={!!form.formState.errors.shopType}
                  />
                </div>
                {form.formState.errors.shopType && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.shopType.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="hasBranches"
                  type="checkbox"
                  checked={hasBranches}
                  onChange={(e) => setHasBranches(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <Label htmlFor="hasBranches" className="cursor-pointer">
                  Does your business have branches?
                </Label>
              </div>

              <div>
                <Label htmlFor="shopImage">Shop Image</Label>
                <Input
                  id="shopImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setShopImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="cipcDoc">CIPC Document</Label>
                <Input
                  id="cipcDoc"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setCipcDocFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Apply"}
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-green-600 hover:text-green-700 hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
