import ApplyJobButton from "@/components/ApplyJobButton";
import SaveJobButton from "@/components/SaveJobButton";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Building2, ArrowLeft } from "lucide-react";
import {
  formatJobType,
  getJobServer,
  getJobsServer,
  parseRequirements,
  timeAgo,
  type ApiJob,
} from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getRelatedJobs(categorySlug: string, currentJobId: string): Promise<ApiJob[]> {
  if (!categorySlug) return [];
  try {
    const data = await getJobsServer({ category: categorySlug, limit: 4 });
    return data.items.filter((j) => j.id !== currentJobId).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobServer(id);

  if (!job) notFound();

  const related = await getRelatedJobs(job.category?.slug ?? "", job.id);
  const displayType = formatJobType(job.type);
  const displayCompany = job.company?.name ?? "Verified Employer";
  const requirements = parseRequirements(job.requirements, job.tags);

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
                <p className="text-muted mt-1">{displayCompany}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {timeAgo(job.createdAt)}
                  </span>
                  <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-2.5 py-1">
                    {displayType}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {requirements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-ink mb-3">Requirements</h2>
                <div className="flex flex-wrap gap-2">
                  {requirements.map((req) => (
                    <span key={req} className="text-xs font-medium text-muted bg-pageBg border border-border rounded-full px-3 py-1">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6">
            <ApplyJobButton jobId={job.id} jobTitle={job.title} />
            <SaveJobButton jobId={job.id} />
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/jobs/${r.id}`}
                    className="block rounded-lg hover:bg-pageBg p-2 -mx-2 transition-colors"
                  >
                    <p className="text-sm font-semibold text-ink line-clamp-1">{r.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {r.company?.name ?? "Verified Employer"} · {r.location}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
