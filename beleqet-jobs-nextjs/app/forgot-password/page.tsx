"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Check your email</h1>
          <p className="text-muted mt-3">
            We sent a password reset link to <span className="font-semibold text-ink">{email}</span>
          </p>
          <p className="text-sm text-muted mt-2">
            Didn&apos;t receive it? Check your spam folder or try again.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-brandGreen hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
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
          <h1 className="text-3xl font-extrabold text-ink mt-4">Forgot password?</h1>
          <p className="text-muted mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-border p-8 space-y-5">
          {error && (
            <div className="bg-redAccent/10 text-redAccent text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Email</label>
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
              <Mail className="h-5 w-5 text-muted shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full text-sm text-ink placeholder:text-muted outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brandGreen py-3.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-brandGreen hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
