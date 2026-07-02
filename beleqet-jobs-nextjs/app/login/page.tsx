"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-ink mt-4">Welcome back</h1>
          <p className="text-muted mt-2">Sign in to your Beleqet account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-border p-8 space-y-5">
          {error && (
            <div className="bg-redAccent/10 text-redAccent text-sm rounded-xl p-3 flex items-center gap-2">
              <span className="text-redAccent font-medium">Error:</span> {error}
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

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Password</label>
            <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
              <Lock className="h-5 w-5 text-muted shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-border text-brandGreen focus:ring-brandGreen" />
              <span className="text-sm text-muted">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-brandGreen hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brandGreen py-3.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brandGreen hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
