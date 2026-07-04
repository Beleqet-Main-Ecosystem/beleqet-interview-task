const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface ApiJob {
  id: string;
  title: string;
  location: string;
  type: string;
  featured: boolean;
  description: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    slug: string;
    label: string;
  } | null;
  tags?: string[];
}

export interface ApiCategory {
  id: string;
  slug: string;
  label: string;
  _count?: { jobs: number };
}

export interface JobsResponse {
  items: ApiJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobsQuery {
  q?: string;
  category?: string;
  location?: string;
  type?: string;
  page?: number;
  limit?: number;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export async function getJobs(query: JobsQuery = {}): Promise<JobsResponse> {
  const params = new URLSearchParams();
  if (query.q)        params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.location) params.set('location', query.location);
  if (query.type)     params.set('type', query.type);
  if (query.page)     params.set('page', String(query.page));
  if (query.limit)    params.set('limit', String(query.limit));

  const qs = params.toString();
  return apiFetch<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
}

export async function getJob(id: string): Promise<ApiJob> {
  return apiFetch<ApiJob>(`/jobs/${id}`);
}

export async function getCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/jobs/categories');
}
