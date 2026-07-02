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

export type ApplicationStatus =
  | "SUBMITTED"
  | "SCREENING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export type CandidateScore = {
  id: string;
  applicationId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  cultureFitScore?: number;
  reasoning?: string;
  scoredAt: string;
};

export type Application = {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  interviewSlot?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expectedSalary?: number;
  portfolioUrl?: string;
  screeningAnswers?: Record<string, unknown>;
  job?: {
    id: string;
    title: string;
    companyId: string;
    company?: { id: string; name: string; logoUrl?: string };
    location?: string;
    type?: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  score?: CandidateScore;
};

export type CreateApplicationInput = {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: number;
};

export type UpdateApplicationStatusInput = {
  status: ApplicationStatus;
};
