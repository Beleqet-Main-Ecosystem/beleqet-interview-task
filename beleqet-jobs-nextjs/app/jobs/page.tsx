import { Suspense } from "react";
import JobsListing from "@/components/JobsListing";
import { getJobs, getCategories, ApiJob, ApiCategory } from "@/lib/api";
import { jobs as mockJobs, categories as mockCategories, type Job } from "@/lib/mockData";

export const metadata = {
  title: "Find Jobs | Beleqet Jobs",
};

function toDisplayJob(job: ApiJob): Job {
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name ?? "Unknown",
    location: job.location,
    type: job.type as Job["type"],
    category: job.category?.slug ?? "",
    postedAgo: new Date(job.createdAt).toLocaleDateString(),
    featured: job.featured,
    description: job.description,
    tags: job.tags ?? [],
  };
}

function toDisplayCategory(cat: ApiCategory) {
  return {
    id: cat.slug,
    label: cat.label,
    count: cat._count?.jobs?.toLocaleString() ?? "0",
    icon: "more-horizontal",
  };
}

export default async function JobsPage() {
  let initialJobs;
  let initialCategories;

  try {
    const [jobsRes, catsRes] = await Promise.all([getJobs({ limit: 50 }), getCategories()]);
    initialJobs = jobsRes.items.map(toDisplayJob);
    initialCategories = catsRes.map(toDisplayCategory);
  } catch {
    initialJobs = mockJobs;
    initialCategories = mockCategories;
  }

  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Loading jobs…</div>}>
      <JobsListing initialJobs={initialJobs} initialCategories={initialCategories} />
    </Suspense>
  );
}
