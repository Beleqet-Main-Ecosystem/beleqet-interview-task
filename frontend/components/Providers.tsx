"use client";

import { AuthProvider } from "@/contexts/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
