"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import JobCard from "@/components/JobCard";

const jobTypes = ["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "ON_SITE", "CONTRACT"];

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  company?: { name: string; logoUrl?: string } | string; 
}

interface Category {
  id: string;
  name: string;
  _count?: { jobs: number };
}

export default function JobsListing() {
  const searchParams = useSearchParams();

  // Search filter states
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("loc") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [type, setType] = useState<string>("");

  // Data fetching states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch categories on initial load for the sidebar
  useEffect(() => {
    fetch("http://localhost:4000/api/v1/jobs") 
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((err) => console.error("Error loading taxonomy metadata:", err));
  }, []);

  // 2. Fetch jobs dynamically from backend when search filters change
  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (category) params.append("category", category);
    if (location) params.append("location", location);
    if (type) params.append("type", type);

    fetch(`http://localhost:4000/api/v1/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching records from NestJS context:", err);
        setLoading(false);
      });
  }, [query, location, category, type]);

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-pageH1">Search verified jobs from trusted employers.</h1>
        <p className="text-muted text-sm mt-2">
          {loading ? "Updating results..." : `${jobs.length} jobs found`}
        </p>
      </div>

      {/* Search Bar Panel */}
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
        {/* Sidebar Controls */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setCategory("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === "" ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.id ? "bg-brandGreen/10 text-brandGreen font-semibold" : "text-muted hover:bg-pageBg"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count?.jobs !== undefined && (
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

        {/* Results Container Grid */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
              <p className="text-sm text-muted mt-2">Querying system database...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
              <p className="text-ink font-semibold">No jobs match your filters</p>
              <p className="text-sm text-muted mt-1">Try adjusting your search filters or clearing values.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={{ 
                    ...job, 
                    type: job.jobType as any, 
                    company: (typeof job.company === 'object' ? job.company?.name : job.company) || "Verified Employer",
                    category: "Technology", // Safe fallback match required by layout components
                    postedAgo: "Recent"       // Safe fallback match required by layout components
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}