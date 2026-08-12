"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Username is required")
    .refine((val) => val.startsWith("P"), {
      message: "Username must start with 'P' for Packager",
    }),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm new password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface UserData {
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
}

const decodeJWT = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.UserID;
  } catch (e) {
    console.error("[decodeJWT] Failed to decode token:", e);
    return null;
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeMode, setChangeMode] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: "" },
  });

  // ── ALL ORIGINAL LOGIC PRESERVED ──────────────────────────────────────────

  const handleLogin = async (data: LoginFormData) => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      console.log("[handleLogin] Cleared localStorage token and userId");
      console.log("[handleLogin] Attempting login with username:", data.email);

      let response;
      try {
        console.log("[handleLogin] Trying /api/Authentication/LoginManager");
        response = await authAPI.login(
          data.email,
          data.password,
          "/api/Authentication/LoginManager"
        );
      } catch (packagerError: any) {
        console.warn("[handleLogin] LoginManager endpoint failed:", {
          message: packagerError.message || "Unknown error",
          code: packagerError.code,
          status: packagerError.response?.status,
          data: packagerError.response?.data
            ? JSON.stringify(packagerError.response.data, null, 2)
            : null,
          config: packagerError.config
            ? JSON.stringify(
                {
                  url: packagerError.config.url,
                  method: packagerError.config.method,
                  headers: packagerError.config.headers,
                  data: packagerError.config.data,
                },
                null,
                2
              )
            : null,
          cause: packagerError.cause
            ? JSON.stringify(packagerError.cause, null, 2)
            : null,
        });
        console.log("[handleLogin] Trying /api/Authentication/LoginManager");
        response = await authAPI.login(
          data.email,
          data.password,
          "/api/Authentication/LoginManager"
        );
      }

      console.log(
        "[handleLogin] API Response:",
        JSON.stringify(response, null, 2)
      );
      if (!response.token) {
        const errorMessage =
          response.message || "Login failed. Please check your credentials.";
        console.error("[handleLogin] Login failed:", errorMessage);
        toast.error(errorMessage);
        return;
      }

      const userId = decodeJWT(response.token);
      if (!userId) {
        console.error("[handleLogin] Failed to extract user ID from token");
        toast.error("Invalid login response. Please try again.");
        return;
      }

      localStorage.setItem("userId", userId);
      localStorage.setItem("token", response.token);
      console.log("[handleLogin] Token stored:", response.token);

      const isTemporaryPassword = response.message
        ?.toLowerCase()
        .includes("temporary password");
      if (isTemporaryPassword) {
        console.log(
          "[handleLogin] Temporary password detected. Switching to change password mode."
        );
        setTempUsername(data.email);
        setChangeMode(true);
        toast.info("Please change your temporary password to continue.");
        changePasswordForm.reset();
        return;
      }

      let userResponse;
      try {
        console.log("[handleLogin] Fetching user details for ID:", userId);
        userResponse = await authAPI.getUserById(parseInt(userId));
        console.log(
          "[handleLogin] User Response:",
          JSON.stringify(userResponse, null, 2)
        );
      } catch (userError: any) {
        console.error("[handleLogin] getUserById failed:", {
          message: userError.message || "Unknown error",
          code: userError.code,
          status: userError.response?.status,
          data: userError.response?.data
            ? JSON.stringify(userError.response.data, null, 2)
            : null,
        });
        throw userError;
      }

      let shopId: number | undefined = undefined;
      let storeName = "Not Assigned";
      if (userResponse.roleID) {
        try {
          console.log(
            `[handleLogin] Fetching shopId for pacID: ${userResponse.roleID}`
          );
          shopId =
            (await authAPI.getShopIdByPacID(userResponse.roleID)) ?? undefined;
          if (shopId !== undefined) {
            const shop = await authAPI.getShopByID(shopId);
            storeName = shop.dto.shopName;
            console.log(
              `[handleLogin] Shop found: ${storeName} (ID: ${shopId})`
            );
          } else {
            console.warn("[handleLogin] No shop found for packager");
          }
        } catch (shopError: any) {
          console.error("[handleLogin] Failed to fetch shop:", {
            message: shopError.message || "Unknown error",
            code: shopError.code,
            status: shopError.response?.status,
            data: shopError.response?.data
              ? JSON.stringify(shopError.response.data, null, 2)
              : null,
          });
        }
      } else {
        console.warn("[handleLogin] No roleID found in userResponse");
      }

      if (!userResponse.user) {
        console.warn(
          "[handleLogin] No user data returned, using fallback user data"
        );
        const userData: UserData = {
          id: parseInt(userId),
          name: "Packager",
          surname: "",
          email: data.email,
          contacts: "",
          gender: "Other",
          type: "Packager",
          username: data.email,
          storeName,
          shopId,
        };
        login(response.token, userData);
        toast.success("Packager Login Successful!");
        router.push("/dashboard");
        return;
      }

      const userDetails = userResponse.user;
      const userData: UserData = {
        id: parseInt(userId),
        name: userDetails.uName || "Packager",
        surname: userDetails.uSurname || "",
        email: userDetails.uEmail || data.email,
        contacts: userDetails.uPhone || "",
        gender: userDetails.uGender || "Other",
        type: userDetails.uType || "Packager",
        username: data.email,
        storeName,
        shopId,
      };

      if (userData.type !== "Packager") {
        console.error("[handleLogin] Invalid user type:", userData.type);
        toast.error("Invalid user type. Must be 'Packager'.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        return;
      }

      console.log("[handleLogin] Logging in user:", userData);
      login(response.token, userData);
      toast.success("Packager Login Successful!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("[handleLogin] Login error:", {
        message: error.message || "Unknown error",
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : null,
        config: error.config
          ? JSON.stringify(
              {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                data: error.config?.data,
              },
              null,
              2
            )
          : null,
        stack: error.stack,
        cause: error.cause ? JSON.stringify(error.cause, null, 2) : null,
      });
      const errorMessage =
        (error.response?.data as { message?: string } | undefined)?.message ||
        error.message ||
        "Login failed. Please check your username and password.";
      toast.error(errorMessage);
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      console.log(
        "[handleChangePassword] Changing password for:",
        tempUsername
      );
      const response = await authAPI.changePassword(
        tempUsername,
        data.currentPassword,
        data.newPassword
      );
      console.log("[handleChangePassword] Success:", response);
      toast.success(
        "Password changed successfully! Please log in with your new password."
      );
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setChangeMode(false);
      loginForm.reset({ email: tempUsername, password: "" });
      changePasswordForm.reset();
    } catch (error: any) {
      console.error("[handleChangePassword] Error:", {
        message: error.message || "Unknown error",
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : null,
      });
      const errorMessage =
        (error.response?.data as { message?: string } | undefined)?.message ||
        error.message ||
        "Failed to change password. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    try {
      console.log(
        "[handleForgotPassword] Submitting for username:",
        data.username
      );
      await authAPI.forgotPassword(data.username);
      toast.info("Password reset request submitted. Check your email.");
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      console.error("[handleForgotPassword] Error:", {
        message: error.message || "Unknown error",
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : null,
      });
      const errorMessage =
        (error.response?.data as { message?: string } | undefined)?.message ||
        error.message ||
        "Failed to submit request. Please try again.";
      toast.error(errorMessage);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Geist', 'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .login-input {
          height: 42px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          padding: 0 12px;
          width: 100%;
          outline: none;
        }
        .login-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.10);
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-input.has-icon-right { padding-right: 40px; }

        .login-btn-primary {
          height: 42px;
          width: 100%;
          background: #16a34a;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          letter-spacing: 0.01em;
        }
        .login-btn-primary:hover:not(:disabled) {
          background: #15803d;
          box-shadow: 0 2px 8px rgba(22,163,74,0.25);
        }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        .field-error {
          font-size: 12px;
          color: #dc2626;
          margin-top: 4px;
        }

        .left-panel-pattern {
          background-color: #f0fdf4;
          background-image:
            radial-gradient(circle at 1px 1px, #bbf7d0 1px, transparent 0);
          background-size: 28px 28px;
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 left-panel-pattern flex-col justify-between p-12 relative overflow-hidden">
        {/* Top-left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-green-600" />

        <div>
          <img src="/logo.png" alt="eMALL" className="h-20 w-auto" />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-green-600/10 border border-green-600/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            <span className="text-green-700 text-xs font-medium tracking-wide">
              Packager Portal
            </span>
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 leading-tight mb-3">
            Manage orders
            <br />
            efficiently.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Track, pack, and confirm customer orders from your assigned store —
            all in one place.
          </p>

          <div className="mt-10 space-y-3">
            {[
              { label: "Real-time order tracking" },
              { label: "Instant collection confirmation" },
              { label: "Full packaging history" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} eMALL. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.png" alt="eMALL" className="h-30 w-auto mx-auto" />
          </div>

          <AnimatePresence mode="wait">
            {!changeMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    Sign in
                  </h1>
                  <p className="text-sm text-gray-500">
                    Enter your credentials to access your account.
                  </p>
                </div>

                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-5"
                >
                  <div>
                    <label className="field-label" htmlFor="email">
                      Username
                    </label>
                    <input
                      id="email"
                      type="text"
                      placeholder="e.g. P225BM123"
                      className="login-input"
                      autoComplete="username"
                      aria-invalid={!!loginForm.formState.errors.email}
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="field-error">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="field-label" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="login-input has-icon-right"
                        autoComplete="current-password"
                        aria-invalid={!!loginForm.formState.errors.password}
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="field-error">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
                      onClick={() => setIsForgotPasswordOpen(true)}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loginForm.formState.isSubmitting}
                    className="login-btn-primary"
                  >
                    {loginForm.formState.isSubmitting
                      ? "Signing in…"
                      : "Sign In"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="change"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1 mb-4">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M6 1L11 10H1L6 1Z"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 5V7"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
                    </svg>
                    Temporary password detected
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                    Update password
                  </h1>
                  <p className="text-sm text-gray-500">
                    Choose a new password to secure your account.
                  </p>
                </div>

                <form
                  onSubmit={changePasswordForm.handleSubmit(
                    handleChangePassword
                  )}
                  className="space-y-5"
                >
                  {[
                    {
                      id: "currentPassword",
                      label: "Current Password",
                      show: showPassword,
                      toggle: () => setShowPassword(!showPassword),
                    },
                    {
                      id: "newPassword",
                      label: "New Password",
                      show: showNewPassword,
                      toggle: () => setShowNewPassword(!showNewPassword),
                    },
                    {
                      id: "confirmPassword",
                      label: "Confirm New Password",
                      show: showConfirmPassword,
                      toggle: () =>
                        setShowConfirmPassword(!showConfirmPassword),
                    },
                  ].map(({ id, label, show, toggle }) => (
                    <div key={id}>
                      <label className="field-label" htmlFor={id}>
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          id={id}
                          type={show ? "text" : "password"}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          className="login-input has-icon-right"
                          aria-invalid={
                            !!(changePasswordForm.formState.errors as any)[id]
                          }
                          {...changePasswordForm.register(id as any)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={toggle}
                          tabIndex={-1}
                          aria-label={show ? "Hide" : "Show"}
                        >
                          {show ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {(changePasswordForm.formState.errors as any)[id] && (
                        <p className="field-error">
                          {
                            (changePasswordForm.formState.errors as any)[id]
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={changePasswordForm.formState.isSubmitting}
                    className="login-btn-primary"
                  >
                    {changePasswordForm.formState.isSubmitting
                      ? "Updating…"
                      : "Update Password"}
                  </button>

                  <button
                    type="button"
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => {
                      setChangeMode(false);
                      localStorage.removeItem("token");
                      localStorage.removeItem("userId");
                    }}
                  >
                    ← Back to sign in
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-10 text-center text-xs text-gray-400">
            Having trouble? Contact your store manager.
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD DIALOG ── */}
      <Dialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      >
        <DialogContent className="sm:max-w-sm rounded-xl border border-gray-200 shadow-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Reset your password
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter your username and we'll send a reset link to your registered
              email.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
            className="space-y-4 mt-1"
          >
            <div>
              <label className="field-label" htmlFor="forgot-username">
                Username
              </label>
              <input
                id="forgot-username"
                type="text"
                placeholder="Enter your username"
                className="login-input"
                autoComplete="username"
                aria-invalid={!!forgotPasswordForm.formState.errors.username}
                {...forgotPasswordForm.register("username")}
              />
              {forgotPasswordForm.formState.errors.username && (
                <p className="field-error">
                  {forgotPasswordForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-9 text-sm rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
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
                className="flex-1 h-9 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                {forgotPasswordForm.formState.isSubmitting
                  ? "Sending…"
                  : "Send Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
