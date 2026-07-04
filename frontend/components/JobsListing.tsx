"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import JobCard from "@/components/JobCard";
import { api, toJobCard, type ApiCategory, type JobType } from "@/lib/api";

const jobTypes: JobType[] = ["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "CONTRACT"];

export default function JobsListing() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("loc") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [type, setType] = useState<JobType | "">("");

  const [jobs, setJobs] = useState<ReturnType<typeof toJobCard>[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getJobs({
        q: query || undefined,
        category: category || undefined,
        location: location || undefined,
        type: type || undefined,
      })
      .then((data) => {
        setJobs(data.items.map(toJobCard));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs:", err);
        setError("Could not connect to the API. Is the backend running on port 4000?");
        setJobs([]);
        setLoading(false);
      });
  }, [query, location, category, type]);

  const sidebarCategories = categories
    .sort((a, b) => (b._count?.jobs ?? 0) - (a._count?.jobs ?? 0))
    .slice(0, 12);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">Search verified jobs from trusted employers.</h1>
        <p className="text-muted text-sm mt-2">
          {loading ? "Updating results..." : `${jobs.length} jobs found`}
        </p>
        {error && (
          <p className="text-sm text-redAccent mt-2">{error}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border p-2 flex flex-col sm:flex-row gap-2 mb-8">
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keyword or company"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
        </div>
        <div className="hidden sm:block w-px bg-border my-1" />
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <MapPin className="h-4 w-4 text-muted shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => setCategory("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Categories
              </button>
              {sidebarCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.slug ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  <span className="line-clamp-1">{cat.label}</span>
                  {cat._count?.jobs !== undefined && (
                    <span className="text-xs ml-2 shrink-0">{cat._count.jobs}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Type</h3>
            <div className="space-y-2">
              <button
                onClick={() => setType("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  type === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Types
              </button>
              {jobTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    type === t ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
              <p className="text-sm text-muted mt-2">Loading jobs from API…</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
              <p className="text-ink font-semibold">No jobs match your filters</p>
              <p className="text-sm text-muted mt-1">Try adjusting your search filters or clearing values.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
