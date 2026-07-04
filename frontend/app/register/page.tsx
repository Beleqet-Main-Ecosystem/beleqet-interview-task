"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { Loader2 } from "lucide-react";

function RegisterForm() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "EMPLOYER" ? "EMPLOYER" : "JOB_SEEKER";
  const plan = searchParams.get("plan");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"JOB_SEEKER" | "EMPLOYER">(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ email, password, firstName, lastName, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-16 max-w-md">
      <h1 className="text-pageH1">Create your account</h1>
      <p className="text-muted text-sm mt-2">Join Beleqet as a job seeker or employer.</p>
      {plan && role === "EMPLOYER" && (
        <p className="text-sm text-brandGreen mt-2 font-medium capitalize">
          Selected plan: {plan}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-4">
        {error && (
          <p className="text-sm text-redAccent bg-redAccent/10 border border-redAccent/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("JOB_SEEKER")}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
              role === "JOB_SEEKER"
                ? "border-brandGreen bg-brandGreen/10 text-brandGreen"
                : "border-border text-muted hover:bg-pageBg"
            }`}
          >
            Job Seeker
          </button>
          <button
            type="button"
            onClick={() => setRole("EMPLOYER")}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
              role === "EMPLOYER"
                ? "border-brandGreen bg-brandGreen/10 text-brandGreen"
                : "border-border text-muted hover:bg-pageBg"
            }`}
          >
            Employer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">First name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Last name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
          <p className="text-[11px] text-muted mt-1">At least 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </button>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brandGreen font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
