import Link from "next/link";
import { getJobs, ApiJob } from "@/lib/api";
import { jobs as mockJobs } from "@/lib/mockData";
import JobCard from "./JobCard";

function toDisplayJob(job: ApiJob) {
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name ?? "Unknown",
    location: job.location,
    type: job.type as ApiJob["type"],
    category: job.category?.slug ?? "",
    postedAgo: new Date(job.createdAt).toLocaleDateString(),
    featured: job.featured,
    description: job.description,
    tags: job.tags ?? [],
  };
}

export default async function FeaturedJobs() {
  let featured;
  try {
    const res = await getJobs({ limit: 5 });
    featured = res.items.filter((j) => j.featured).slice(0, 5).map(toDisplayJob);
    if (featured.length === 0) featured = res.items.slice(0, 5).map(toDisplayJob);
  } catch {
    // Fall back to mock data if API is not reachable
    featured = mockJobs.filter((j) => j.featured);
  }

  return (
    <section className="bg-white border-y border-border">
      <div className="container-page py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-sectionH2">Featured Jobs</h2>
            <p className="text-muted text-sm mt-1">Fresh opportunities from companies hiring right now.</p>
          </div>
          <Link href="/jobs" className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0">
            View all jobs →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {featured.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}
