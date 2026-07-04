const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export const API_V1 = `${API_BASE}/api/v1`;

export type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "REMOTE"
  | "HYBRID"
  | "CONTRACT";

export interface ApiCompany {
  id: string;
  name: string;
  logoUrl?: string | null;
  verified?: boolean;
}

export interface ApiCategory {
  id: string;
  slug: string;
  label: string;
  icon?: string | null;
  _count?: { jobs: number };
}

export interface ApiJob {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  featured?: boolean;
  tags?: string[];
  createdAt: string;
  company?: ApiCompany;
  category?: ApiCategory;
}

export interface JobsListResponse {
  items: ApiJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformStats {
  jobs: number;
  companies: number;
  seekers: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ApiApplication {
  id: string;
  status: string;
  coverLetter?: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    location: string;
    company?: ApiCompany;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  cvData?: Record<string, unknown> | null;
}

export type SubscriptionPlan = "BASIC" | "FEATURED" | "ENTERPRISE";

export function mapPlanSlug(plan?: string | null): SubscriptionPlan | undefined {
  if (!plan) return undefined;
  const map: Record<string, SubscriptionPlan> = {
    basic: "BASIC",
    featured: "FEATURED",
    enterprise: "ENTERPRISE",
  };
  return map[plan.toLowerCase()];
}

export type JobQuery = {
  q?: string;
  category?: string;
  location?: string;
  type?: JobType;
  page?: number;
  limit?: number;
};

function buildQuery(params?: JobQuery): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(", ") : String(body.message);
      }
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function authHeaders(token?: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getJobs: (query?: JobQuery) =>
    apiFetch<JobsListResponse>(`/jobs${buildQuery(query)}`),

  getJob: (id: string) => apiFetch<ApiJob>(`/jobs/${id}`),

  getCategories: () => apiFetch<ApiCategory[]>("/jobs/categories"),

  getStats: () => apiFetch<PlatformStats>("/jobs/stats"),

  register: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "EMPLOYER" | "JOB_SEEKER";
  }) =>
    apiFetch<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: (token: string) =>
    apiFetch<AuthTokens["user"]>("/auth/me", {
      headers: authHeaders(token),
    }),

  createCompany: (
    token: string,
    body: {
      name: string;
      description?: string;
      location?: string;
      industry?: string;
      subscriptionPlan?: SubscriptionPlan;
    }
  ) =>
    apiFetch("/users/company", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  createJob: (
    token: string,
    body: {
      title: string;
      description: string;
      requirements?: string;
      location: string;
      type: JobType;
      categoryId: string;
      salaryMin?: number;
      salaryMax?: number;
      featured?: boolean;
      status?: "PUBLISHED";
    }
  ) =>
    apiFetch<ApiJob>("/jobs", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  applyToJob: (
    token: string,
    body: { jobId: string; coverLetter?: string; resumeUrl?: string }
  ) =>
    apiFetch("/applications", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  logout: (token: string) =>
    apiFetch<void>("/auth/logout", {
      method: "POST",
      headers: authHeaders(token),
    }),

  getMyJobs: (token: string) =>
    apiFetch<ApiJob[]>("/jobs/my", { headers: authHeaders(token) }),

  getMyApplications: (token: string) =>
    apiFetch<ApiApplication[]>("/applications/my", { headers: authHeaders(token) }),

  getCompany: (token: string) =>
    apiFetch<ApiCompany | null>("/users/company", { headers: authHeaders(token) }),

  getProfile: (token: string) =>
    apiFetch<UserProfile>("/users/profile", { headers: authHeaders(token) }),

  updateProfile: (
    token: string,
    body: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      headline: string;
      bio: string;
      location: string;
      skills: string[];
      linkedinUrl: string;
      githubUrl: string;
      portfolioUrl: string;
    }>
  ) =>
    apiFetch<UserProfile>("/users/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  getCv: (token: string) =>
    apiFetch<UserProfile>("/users/cv", { headers: authHeaders(token) }),

  saveCv: (token: string, cvData: Record<string, unknown>) =>
    apiFetch<UserProfile>("/users/cv", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ cvData }),
    }),

  submitContact: (body: {
    fullName: string;
    email: string;
    message: string;
    plan?: string;
  }) =>
    apiFetch<{ id: string; message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getSavedJobs: (token: string) =>
    apiFetch<ApiJob[]>("/jobs/saved", { headers: authHeaders(token) }),

  saveJob: (token: string, jobId: string) =>
    apiFetch<{ saved: boolean; jobId: string }>(`/jobs/${jobId}/save`, {
      method: "POST",
      headers: authHeaders(token),
    }),

  unsaveJob: (token: string, jobId: string) =>
    apiFetch<{ saved: boolean; jobId: string }>(`/jobs/${jobId}/save`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),

  isJobSaved: (token: string, jobId: string) =>
    apiFetch<{ saved: boolean }>(`/jobs/${jobId}/saved`, { headers: authHeaders(token) }),
};

/** Map backend job type to display label */
export function formatJobType(type: JobType): string {
  const map: Record<JobType, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    CONTRACT: "Contract",
  };
  return map[type] ?? type;
}

/** Human-readable "posted X ago" from ISO date */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Shape API job for JobCard component */
export function toJobCard(job: ApiJob) {
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name ?? "Verified Employer",
    location: job.location,
    type: formatJobType(job.type),
    category: job.category?.label ?? "",
    postedAgo: timeAgo(job.createdAt),
    featured: job.featured,
    description: job.description,
    tags: job.tags,
  };
}

export type JobCardData = ReturnType<typeof toJobCard>;

const EMPTY_JOBS_RESPONSE: JobsListResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

const EMPTY_STATS: PlatformStats = {
  jobs: 0,
  companies: 0,
  seekers: 0,
};

/** Skip build-time fetches to localhost — backend is usually not running during `next build` */
function isApiReachableForBuild(): boolean {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
  if (process.env.NEXT_PHASE === "phase-production-build" && isLocal) {
    return false;
  }
  return true;
}

/** Server-side fetch — never throws; safe when API is down during `next build` */
async function safeServerFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (!isApiReachableForBuild()) return null;

  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Server-side fetch with ISR caching */
export async function getJobsServer(query?: JobQuery): Promise<JobsListResponse> {
  const data = await safeServerFetch<JobsListResponse>(
    `${API_V1}/jobs${buildQuery(query)}`,
    { next: { revalidate: 60 } }
  );
  return data ?? { ...EMPTY_JOBS_RESPONSE, limit: query?.limit ?? EMPTY_JOBS_RESPONSE.limit };
}

export async function getJobServer(id: string): Promise<ApiJob | null> {
  return safeServerFetch<ApiJob>(`${API_V1}/jobs/${id}`, { next: { revalidate: 60 } });
}

export async function getCategoriesServer(): Promise<ApiCategory[]> {
  return (await safeServerFetch<ApiCategory[]>(`${API_V1}/jobs/categories`, {
    next: { revalidate: 300 },
  })) ?? [];
}

export async function getStatsServer(): Promise<PlatformStats> {
  const stats = await safeServerFetch<PlatformStats>(`${API_V1}/jobs/stats`, {
    next: { revalidate: 300 },
  });
  if (stats) return stats;

  const jobs = await getJobsServer({ limit: 1 });
  if (jobs.total > 0) {
    return { jobs: jobs.total, companies: 0, seekers: 0 };
  }

  return EMPTY_STATS;
}

export function parseRequirements(requirements?: string | null, tags?: string[]): string[] {
  if (requirements) {
    return requirements.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return tags ?? [];
}
