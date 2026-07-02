"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    async function verify() {
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
        setMessage("Email verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Verification failed");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-pageBg">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-brandGreen animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-extrabold text-ink">Verifying your email...</h1>
            <p className="text-muted mt-3">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">Email verified!</h1>
            <p className="text-muted mt-3">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
            >
              Sign in
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-redAccent/10 mb-6">
              <XCircle className="h-8 w-8 text-redAccent" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink">Verification failed</h1>
            <p className="text-muted mt-3">{message}</p>
            <Link
              href="/login"
              className="inline-block mt-6 rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
            >
              Go to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
