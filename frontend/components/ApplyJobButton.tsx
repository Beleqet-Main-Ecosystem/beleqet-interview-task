"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type JobType } from "@/lib/api";

export default function ApplyJobButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState(
    `I am very interested in the ${jobTitle} position and believe my skills and experience make me a strong candidate for this role.`
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApplyClick() {
    if (!user || !token) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }
    if (user.role !== "JOB_SEEKER") {
      setError("Only job seekers can apply. Please sign in with a job seeker account.");
      setOpen(true);
      return;
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.applyToJob(token, { jobId, coverLetter });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-brandGreen font-semibold">Application submitted successfully!</p>
        <Link href="/dashboard" className="block text-center text-sm text-brandGreen hover:underline">
          View my applications →
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleApplyClick}
        className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors"
      >
        Apply Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-border w-full max-w-md p-6 shadow-cardHover">
            <h3 className="text-sm font-semibold text-ink">Apply for {jobTitle}</h3>

            {error && (
              <p className="text-sm text-redAccent mt-3 bg-redAccent/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {user?.role === "JOB_SEEKER" && (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink">Cover letter</label>
                  <textarea
                    required
                    minLength={50}
                    rows={5}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
                  />
                  <p className="text-[11px] text-muted mt-1">Minimum 50 characters</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-border text-sm font-semibold py-2.5 hover:bg-pageBg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-brandGreen text-white text-sm font-semibold py-2.5 hover:bg-darkGreen disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit
                  </button>
                </div>
              </form>
            )}

            {user && user.role !== "JOB_SEEKER" && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full rounded-full border border-border text-sm font-semibold py-2.5"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
