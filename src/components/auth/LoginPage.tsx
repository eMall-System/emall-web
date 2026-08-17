"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingUsername, setPendingUsername] = useState("");
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(3);
  const { login } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      const response = await authAPI.retailLogin(data.email, data.password);

      if (response.statusCode === 202) {
        setPendingUsername(data.email);
        setOtpAttemptsLeft(3);
        otpForm.reset();
        setStep("otp");
        toast.info(response.message || "OTP sent to your registered email.");
      } else {
        toast.error(response.message || "Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    try {
      const response = await authAPI.verifyOtp(pendingUsername, data.otp);

      if (response.statusCode === 200 && response.token) {
        const userData = {
          id: response.rShop_ID ?? response.shop_ID ?? 0,
          name: response.shopName || "",
          surname: "",
          email: response.email || "",
          contacts: "",
          gender: "",
          type: "Retail Shop",
          username: response.username || pendingUsername,
          isTempPassword: response.isTempPassword,
        };

        login(response.token, userData);

        if (userData.isTempPassword) {
          toast.info("Please change your temporary password.");
          router.push("/change-password");
        } else {
          toast.success("Login successful!");
          router.push("/");
        }
      } else if (response.statusCode === 429) {
        toast.error(response.message || "Too many incorrect attempts. Please log in again.");
        setStep("credentials");
        loginForm.reset();
        otpForm.reset();
      } else {
        setOtpAttemptsLeft((prev) => Math.max(prev - 1, 0));
        toast.error(response.message || "Incorrect OTP.");
        otpForm.reset();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Failed to verify OTP.");
    }
  };

  const handleBackToLogin = () => {
    setStep("credentials");
    setPendingUsername("");
    otpForm.reset();
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    try {
      await authAPI.forgotPassword(data.username);
      toast.info("Password reset request submitted. Check your email.");
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to submit request. Please try again.");
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
            <CardTitle className="text-2xl font-bold">
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="eMALL Logo"
                  className="h-40 w-auto"
                />
              </div>
            </CardTitle>
            <CardDescription>
              {step === "credentials" ? "Sign in to your account" : "Enter the code we emailed you"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "credentials" ? (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="email">Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your username"
                      className="pl-10"
                      {...loginForm.register("email")}
                      aria-invalid={!!loginForm.formState.errors.email}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      {...loginForm.register("password")}
                      aria-invalid={!!loginForm.formState.errors.password}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-green-600 hover:text-green-700 px-0"
                    onClick={() => setIsForgotPasswordOpen(true)}
                  >
                    Forgotten Password?
                  </Button>
                  <Link href="/register" className="text-green-600 hover:text-green-700 hover:underline">
                    Register your business
                  </Link>
                </div>
              </motion.form>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter the 6-digit code"
                      className="pl-10"
                      {...otpForm.register("otp")}
                      aria-invalid={!!otpForm.formState.errors.otp}
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-500 text-xs mt-1">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {otpAttemptsLeft} attempt(s) remaining
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={otpForm.formState.isSubmitting}
                >
                  {otpForm.formState.isSubmitting ? "Verifying..." : "Verify"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={handleBackToLogin}
                  >
                    Back to login
                  </Button>
                </div>
              </motion.form>
            )}
          </CardContent>
        </Card>

        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your username to receive a password reset link.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="forgot-username">Username</Label>
                <Input
                  id="forgot-username"
                  type="text"
                  placeholder="Enter your username"
                  {...forgotPasswordForm.register("username")}
                  aria-invalid={!!forgotPasswordForm.formState.errors.username}
                />
                {forgotPasswordForm.formState.errors.username?.message && (
                  <p className="text-red-500 text-xs mt-1">
                    {forgotPasswordForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    forgotPasswordForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotPasswordForm.formState.isSubmitting}
                >
                  {forgotPasswordForm.formState.isSubmitting
                    ? "Submitting..."
                    : "Submit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
