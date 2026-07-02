"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-extrabold text-ink">Invalid reset link</h1>
          <p className="text-muted mt-3">This password reset link is invalid or has expired.</p>
          <Link
            href="/forgot-password"
            className="inline-block mt-6 rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Password reset successful</h1>
          <p className="text-muted mt-3">Your password has been updated. You can now sign in.</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-2xl text-primary mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brandGreen text-white text-lg">
              B
            </span>
            <span>
              Beleqet <span className="text-brandGreen">Jobs</span>
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold text-ink mt-4">Set new password</h1>
          <p className="text-muted mt-2">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-border p-8 space-y-5">
          {error && (
            <div className="bg-redAccent/10 text-redAccent text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">New Password</label>
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
              <Lock className="h-5 w-5 text-muted shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full text-sm text-ink placeholder:text-muted outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Confirm Password</label>
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
              <Lock className="h-5 w-5 text-muted shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                className="w-full text-sm text-ink placeholder:text-muted outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brandGreen py-3.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
