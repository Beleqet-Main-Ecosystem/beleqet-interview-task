"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Job, JobCategory, PaginatedResponse } from "@/lib/types";
import JobCard from "@/components/JobCard";

const jobTypes = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CONTRACT", label: "Contract" },
];

export default function JobsListing() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("loc") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.get<JobCategory[]>("/jobs/categories");
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories");
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (location) params.set("location", location);
      if (category) params.set("category", category);
      if (type) params.set("type", type);
      params.set("page", page.toString());
      params.set("limit", "12");

      const data = await api.get<PaginatedResponse<Job>>(`/jobs?${params.toString()}`);
      setJobs(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [query, location, category, type, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  }

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">Search verified jobs from trusted employers.</h1>
        <p className="text-muted text-sm mt-2">{total} jobs found</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-border p-2 flex flex-col sm:flex-row gap-2 mb-8">
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
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-brandGreen px-6 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => { setCategory(""); setPage(1); }}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.id ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count && (
                    <span className="text-xs">{cat._count.jobs}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Job Type</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setType(""); setPage(1); }}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  type === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Types
              </button>
              {jobTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setPage(1); }}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    type === t.value ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-brandGreen animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
              <p className="text-ink font-semibold">No jobs match your filters</p>
              <p className="text-sm text-muted mt-1">Try adjusting your search or clearing filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-pageBg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-pageBg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
