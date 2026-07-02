export type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  tags?: string[];
  featured?: boolean;
  status: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  category?: {
    id: string;
    slug: string;
    label: string;
    icon?: string;
  };
  employer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type JobCategory = {
  id: string;
  slug: string;
  label: string;
  icon?: string;
};

export type CreateJobInput = {
  title: string;
  description: string;
  location: string;
  type: "FULL_TIME" | "PART_TIME" | "REMOTE" | "HYBRID" | "CONTRACT";
  categoryId: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
