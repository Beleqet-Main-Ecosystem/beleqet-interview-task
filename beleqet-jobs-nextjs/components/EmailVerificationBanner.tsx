"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, X } from "lucide-react";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  return (
    <div className="bg-orangeAccent/10 border-b border-orangeAccent/20">
      <div className="container-page py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orangeAccent shrink-0" />
          <p className="text-sm text-ink">
            <span className="font-semibold">Please verify your email.</span>{" "}
            Check <span className="font-medium">{user.email}</span> for a verification link.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-ink p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
