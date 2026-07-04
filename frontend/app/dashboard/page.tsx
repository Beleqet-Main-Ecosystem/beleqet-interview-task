"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api, formatJobType, toJobCard, type ApiApplication, type ApiJob } from "@/lib/api";

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [savedJobs, setSavedJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    const load =
      user.role === "EMPLOYER" || user.role === "ADMIN"
        ? api.getMyJobs(token).then(setJobs)
        : Promise.all([
            api.getMyApplications(token).then(setApplications),
            api.getSavedJobs(token).then(setSavedJobs),
          ]);

    load
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user, token, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="container-page py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
      </div>
    );
  }

  if (!user) return null;

  const isEmployer = user.role === "EMPLOYER" || user.role === "ADMIN";

  return (
    <div className="container-page py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-pageH1">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            {user.firstName} {user.lastName} · {user.role.replace("_", " ").toLowerCase()}
          </p>
        </div>
        {isEmployer ? (
          <Link
            href="/post-job"
            className="rounded-full bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
          >
            Post a Job
          </Link>
        ) : (
          <Link
            href="/jobs"
            className="rounded-full bg-brandGreen text-white text-sm font-semibold px-5 py-2.5 hover:bg-darkGreen transition-colors"
          >
            Browse Jobs
          </Link>
        )}
      </div>

      {error && (
        <p className="text-sm text-redAccent bg-redAccent/10 border border-redAccent/20 rounded-lg px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
        </div>
      ) : isEmployer ? (
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">My Job Listings</h2>
          </div>
          {jobs.length === 0 ? (
            <p className="p-8 text-sm text-muted text-center">
              No jobs posted yet.{" "}
              <Link href="/post-job" className="text-brandGreen font-semibold hover:underline">
                Post your first job
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {jobs.map((job) => (
                <li key={job.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-ink hover:text-brandGreen">
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">
                      {job.location} · {formatJobType(job.type)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-brandGreen bg-brandGreen/10 px-2.5 py-1 rounded-full shrink-0">
                    Live
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-ink">My Applications</h2>
            </div>
            {applications.length === 0 ? (
              <p className="p-8 text-sm text-muted text-center">
                You haven&apos;t applied to any jobs yet.{" "}
                <Link href="/jobs" className="text-brandGreen font-semibold hover:underline">
                  Find jobs
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {applications.map((app) => (
                  <li key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <Link href={`/jobs/${app.job.id}`} className="text-sm font-semibold text-ink hover:text-brandGreen">
                        {app.job.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        {app.job.company?.name ?? "Company"} · {app.job.location}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted bg-pageBg border border-border px-2.5 py-1 rounded-full shrink-0 capitalize">
                      {app.status.toLowerCase().replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-ink">Saved Jobs</h2>
            </div>
            {savedJobs.length === 0 ? (
              <p className="p-8 text-sm text-muted text-center">
                No saved jobs yet.{" "}
                <Link href="/jobs" className="text-brandGreen font-semibold hover:underline">
                  Browse jobs
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {savedJobs.map((job) => {
                  const card = toJobCard(job);
                  return (
                    <li key={job.id} className="px-6 py-4">
                      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-ink hover:text-brandGreen">
                        {card.title}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        {card.company} · {card.location}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
