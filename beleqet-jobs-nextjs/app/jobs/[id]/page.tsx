import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Building2, ArrowLeft } from "lucide-react";
import { getJob, getJobs } from "@/lib/api";
import { jobs as mockJobs } from "@/lib/mockData";

export async function generateStaticParams() {
  try {
    const res = await getJobs({ limit: 100 });
    return res.items.map((job) => ({ id: job.id }));
  } catch {
    return mockJobs.map((job) => ({ id: job.id }));
  }
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  let job;
  let related: typeof mockJobs = [];

  try {
    job = await getJob(params.id);
    const res = await getJobs({ category: job.category?.slug ?? "", limit: 4 });
    related = res.items
      .filter((j) => j.id !== job!.id)
      .slice(0, 3)
      .map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company?.name ?? "Unknown",
        location: j.location,
        type: j.type as typeof mockJobs[0]["type"],
        category: j.category?.slug ?? "",
        postedAgo: new Date(j.createdAt).toLocaleDateString(),
        featured: j.featured,
        description: j.description,
        tags: j.tags ?? [],
      }));
  } catch {
    // Fall back to mock data
    const mockJob = mockJobs.find((j) => j.id === params.id);
    if (!mockJob) notFound();
    job = {
      id: mockJob.id,
      title: mockJob.title,
      location: mockJob.location,
      type: mockJob.type,
      featured: mockJob.featured ?? false,
      description: mockJob.description ?? "",
      createdAt: new Date().toISOString(),
      company: { id: "", name: mockJob.company },
      category: { id: "", slug: mockJob.category, label: mockJob.category },
      tags: mockJob.tags ?? [],
    };
    related = mockJobs.filter((j) => j.category === mockJob.category && j.id !== mockJob.id).slice(0, 3);
  }

  if (!job) notFound();

  const companyName = "name" in job.company ? job.company.name : (job.company as { name: string }).name;
  const postedAgo = new Date(job.createdAt).toLocaleDateString();

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
                <p className="text-muted mt-1">{companyName}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {postedAgo}
                  </span>
                  <span className="rounded-full bg-brandGreen/10 text-brandGreen font-semibold px-2.5 py-1">
                    {job.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-7 border-t border-border">
              <h2 className="text-sm font-semibold text-ink mb-3">Job Description</h2>
              <p className="text-sm text-muted leading-relaxed">{job.description}</p>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag: string) => (
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
                    <p className="text-xs text-muted mt-0.5">{r.company} · {r.location}</p>
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
