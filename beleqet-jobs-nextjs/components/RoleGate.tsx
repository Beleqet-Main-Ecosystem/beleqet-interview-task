"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

type RoleGateProps = {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
};

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandGreen"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">Access Denied</h1>
          <p className="text-muted mt-2">You don&apos;t have permission to view this page.</p>
          <p className="text-sm text-muted mt-1">Required role: {allowedRoles.join(" or ")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
