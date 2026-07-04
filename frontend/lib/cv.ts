export interface CvExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface CvEducation {
  id: string;
  school: string;
  degree: string;
  period: string;
}

export interface CvData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string;
  linkedin: string;
  github: string;
  portfolio: string;
  experience: CvExperience[];
  education: CvEducation[];
}

const STORAGE_KEY = "beleqet_cv_draft";

export function emptyCv(): CvData {
  return {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
    skills: "",
    linkedin: "",
    github: "",
    portfolio: "",
    experience: [{ id: "1", role: "", company: "", period: "", description: "" }],
    education: [{ id: "1", school: "", degree: "", period: "" }],
  };
}

export function loadCvDraft(): CvData {
  if (typeof window === "undefined") return emptyCv();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCv();
    return { ...emptyCv(), ...JSON.parse(raw) };
  } catch {
    return emptyCv();
  }
}

export function saveCvDraft(data: CvData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function skillsToArray(skills: string): string[] {
  return skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
