"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api, mapPlanSlug, type ApiCategory, type JobType } from "@/lib/api";

const jobTypes: JobType[] = ["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "CONTRACT"];

function PostJobForm() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan");

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLocation, setCompanyLocation] = useState("Addis Ababa");
  const [companyDescription, setCompanyDescription] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("Addis Ababa");
  const [type, setType] = useState<JobType>("FULL_TIME");
  const [categoryId, setCategoryId] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace("/login?redirect=/post-job");
      return;
    }
    if (user.role !== "EMPLOYER" && user.role !== "ADMIN") {
      setError("Only employers can post jobs. Register or sign in with an employer account.");
      return;
    }

    api.getCategories().then(setCategories).catch(() => {});

    api
      .getCompany(token)
      .then((company) => setHasCompany(!!company))
      .catch(() => setHasCompany(false));
  }, [user, token, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      if (!hasCompany) {
        await api.createCompany(token, {
          name: companyName,
          description: companyDescription || undefined,
          location: companyLocation || undefined,
          subscriptionPlan: mapPlanSlug(selectedPlan),
        });
        setHasCompany(true);
      }

      const job = await api.createJob(token, {
        title,
        description,
        requirements: requirements || undefined,
        location,
        type,
        categoryId,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        featured: selectedPlan === "featured",
        status: "PUBLISHED",
      });

      setSuccess(true);
      setTimeout(() => router.push(`/jobs/${job.id}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post job");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container-page py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-page py-16 max-w-2xl">
      <h1 className="text-pageH1">Post a Job</h1>
      <p className="text-muted mt-4 leading-relaxed">
        Reach thousands of verified job seekers across Ethiopia.
      </p>
      {selectedPlan && (
        <p className="text-sm text-brandGreen font-medium mt-2 capitalize">
          Plan: {selectedPlan} {selectedPlan === "featured" && "— featured badge will be applied when available"}
        </p>
      )}

      {success && (
        <p className="mt-4 text-sm text-brandGreen font-semibold">Job published! Redirecting…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-redAccent bg-redAccent/10 border border-redAccent/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-4">
        {hasCompany === false && (
          <div className="rounded-xl bg-pageBg border border-border p-4 space-y-3">
            <p className="text-sm font-semibold text-ink">Company profile (required once)</p>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <input
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              placeholder="Company location"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Short company description"
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-ink">Job Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Location</label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Job Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as JobType)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white"
            >
              {jobTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Category</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen bg-white"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Job Description</label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Requirements (comma-separated)</label>
          <input
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="React, TypeScript, 3+ years"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-ink">Salary min (ETB)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink">Salary max (ETB)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || user.role !== "EMPLOYER" && user.role !== "ADMIN"}
          className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish Listing
        </button>

        <p className="text-center text-sm text-muted">
          Not an employer?{" "}
          <Link href="/register" className="text-brandGreen font-semibold hover:underline">
            Register as employer
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Loading…</div>}>
      <PostJobForm />
    </Suspense>
  );
}
