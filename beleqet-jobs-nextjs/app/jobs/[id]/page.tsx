"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Building2, ArrowLeft, Loader2, Briefcase, DollarSign } from "lucide-react";
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  CONTRACT: "Contract",
};

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchJob() {
      try {
        const data = await api.get<Job>(`/jobs/${params.id}`);
        setJob(data);
      } catch (err: any) {
        setError(err.message || "Job not found");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container-page py-10">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to all jobs
        </Link>
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <p className="text-ink font-semibold">Job not found</p>
          <p className="text-sm text-muted mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brandGreen mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to all jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-pageBg text-muted shrink-0">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug">{job.title}</h1>
                <p className="text-muted mt-1">{job.company?.name || "Company"}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {typeLabels[job.type] || job.type}
                  </span>
                  {job.salaryMin && job.salaryMax && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()} {job.currency || "ETB"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <button className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors">
              Apply Now
            </button>
            <button className="w-full rounded-full border border-border text-ink text-sm font-semibold py-3 mt-2 hover:bg-pageBg transition-colors">
              Save Job
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Category</span>
                <span className="text-ink font-medium">{job.category?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Type</span>
                <span className="text-ink font-medium">{typeLabels[job.type] || job.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Location</span>
                <span className="text-ink font-medium">{job.location}</span>
              </div>
              {job.salaryMin && job.salaryMax && (
                <div className="flex justify-between">
                  <span className="text-muted">Salary</span>
                  <span className="text-ink font-medium">{job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()} {job.currency || "ETB"}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
