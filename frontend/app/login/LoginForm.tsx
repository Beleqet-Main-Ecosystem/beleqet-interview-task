"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-md">
      <h1 className="text-pageH1">Welcome back</h1>
      <p className="text-muted text-sm mt-2">Sign in to apply for jobs or manage your listings.</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-4">
        {error && (
          <p className="text-sm text-redAccent bg-redAccent/10 border border-redAccent/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="text-xs font-semibold text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign In
        </button>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brandGreen font-semibold hover:underline">
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-muted border-t border-border pt-4">
          Demo: employer@beleqet.com or seeker@beleqet.com — Password123!
        </p>
      </form>
    </div>
  );
}
