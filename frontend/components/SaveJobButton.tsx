"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api } from "@/lib/api";

export default function SaveJobButton({ jobId }: { jobId: string }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .isJobSaved(token, jobId)
      .then((r) => setSaved(r.saved))
      .catch(() => {});
  }, [token, jobId]);

  async function toggleSave() {
    if (!user || !token) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        await api.unsaveJob(token, jobId);
        setSaved(false);
      } else {
        await api.saveJob(token, jobId);
        setSaved(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={loading}
      className={`w-full rounded-full border text-sm font-semibold py-3 mt-2 transition-colors flex items-center justify-center gap-2 ${
        saved
          ? "border-brandGreen bg-brandGreen/10 text-brandGreen"
          : "border-border text-ink hover:bg-pageBg"
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      )}
      {saved ? "Saved" : "Save Job"}
    </button>
  );
}
