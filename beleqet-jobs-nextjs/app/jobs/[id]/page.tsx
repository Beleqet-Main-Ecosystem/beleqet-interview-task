import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Building2, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  categoryId: string;
  company?: {
    name: string;
    logoUrl?: string;
  };
  createdAt?: string;
}

// Fetch the main job details from NestJS
async function getJob(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/jobs/${id}`, {
      next: { revalidate: 60 }, // Cache and revalidate data every 60 seconds (ISR)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching job data:", error);
    return null;
  }
}

// Fetch similar jobs based on the category
async function getRelatedJobs(categoryId: string, currentJobId: string): Promise<Job[]> {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/jobs?category=${categoryId}&limit=4`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const fetchedJobs = Array.isArray(data) ? data : data.data || [];
    
    return fetchedJobs.filter((j: Job) => j.id !== currentJobId).slice(0, 3);
  } catch (error) {
    console.error("Error fetching related jobs:", error);
    return [];
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) notFound();

  // Dynamically fetch similar jobs based on the current job's categoryId
  const related = await getRelatedJobs(job.categoryId, job.id);

  // Formatting helper for enum types
  const displayType = job.jobType ? job.jobType.replace("_", " ") : "Full Time";
  const displayCompany = typeof job.company === "object" ? job.company?.name : "Verified Employer";

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
                    <Clock className="h-3.5 w-3.5" /> Just now
                  </span>
                  <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-2.5 py-1 capitalize">
                    {displayType.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-ink mb-3">Requirements</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req) => (
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
            <button className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors">
              Apply Now
            </button>
            <button className="w-full rounded-full border border-border text-ink text-sm font-semibold py-3 mt-2 hover:bg-pageBg transition-colors">
              Save Job
            </button>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-border bg-white p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {related.map((r) => {
                  const rCompany = typeof r.company === "object" ? r.company?.name : "Verified Employer";
                  return (
                    <Link
                      key={r.id}
                      href={`/jobs/${r.id}`}
                      className="block rounded-lg hover:bg-pageBg p-2 -mx-2 transition-colors"
                    >
                      <p className="text-sm font-semibold text-ink line-clamp-1">{r.title}</p>
                      <p className="text-xs text-muted mt-0.5">{rCompany} · {r.location}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}