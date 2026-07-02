"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle } from "lucide-react";

const roles = [
  { value: "JOB_SEEKER", label: "Job Seeker", desc: "Find and apply to jobs" },
  { value: "EMPLOYER", label: "Employer", desc: "Post jobs and hire talent" },
  { value: "FREELANCER", label: "Freelancer", desc: "Find freelance gigs" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("JOB_SEEKER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ firstName, lastName, email, password, role });
      setRegistered(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-pageBg">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-3xl font-extrabold text-ink">Check your email</h1>
          <p className="text-muted mt-3">
            We sent a verification link to <span className="font-semibold text-ink">{email}</span>
          </p>
          <p className="text-sm text-muted mt-2">
            Click the link in the email to verify your account. You can close this page.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-xl bg-brandGreen py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="block w-full rounded-xl border border-border py-3 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-pageBg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-ink mt-4">Create your account</h1>
          <p className="text-muted mt-2">Join thousands of professionals in Ethiopia</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-border p-8 space-y-5">
          {error && (
            <div className="bg-redAccent/10 text-redAccent text-sm rounded-xl p-3 flex items-center gap-2">
              <span className="text-redAccent font-medium">Error:</span> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">I want to</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    role === r.value
                      ? "border-brandGreen bg-brandGreen/5 ring-2 ring-brandGreen/20"
                      : "border-border hover:border-brandGreen/50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${role === r.value ? "text-brandGreen" : "text-ink"}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">First Name</label>
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
                <User className="h-5 w-5 text-muted shrink-0" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Henok"
                  required
                  className="w-full text-sm text-ink placeholder:text-muted outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Last Name</label>
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 focus-within:border-brandGreen focus-within:ring-2 focus-within:ring-brandGreen/20 transition-all">
                <User className="h-5 w-5 text-muted shrink-0" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mekonnen"
                  required
                  className="w-full text-sm text-ink placeholder:text-muted outline-none"
                />
              </div>
            </div>
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brandGreen py-3.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brandGreen hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}