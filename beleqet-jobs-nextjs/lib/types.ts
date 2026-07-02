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
    name: string;
  };
  employer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type JobCategory = {
  id: string;
  name: string;
  _count?: {
    jobs: number;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
