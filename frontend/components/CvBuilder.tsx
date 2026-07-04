"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api } from "@/lib/api";
import {
  emptyCv,
  loadCvDraft,
  saveCvDraft,
  skillsToArray,
  type CvData,
  type CvEducation,
  type CvExperience,
} from "@/lib/cv";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function CvPreview({ data }: { data: CvData }) {
  const skills = skillsToArray(data.skills);

  return (
    <div className="cv-preview bg-white text-ink p-8 rounded-xl border border-border text-sm leading-relaxed">
      <div className="border-b border-border pb-4 mb-4">
        <h2 className="text-2xl font-extrabold text-primary">{data.fullName || "Your Name"}</h2>
        {data.headline && <p className="text-brandGreen font-semibold mt-1">{data.headline}</p>}
        <p className="text-muted text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
        </p>
        {(data.linkedin || data.github || data.portfolio) && (
          <p className="text-xs text-muted mt-1 flex flex-wrap gap-x-3">
            {data.linkedin && <span>{data.linkedin}</span>}
            {data.github && <span>{data.github}</span>}
            {data.portfolio && <span>{data.portfolio}</span>}
          </p>
        )}
      </div>

      {data.summary && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brandGreen mb-2">Summary</h3>
          <p className="text-muted whitespace-pre-line">{data.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brandGreen mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="text-xs bg-pageBg border border-border rounded-full px-2.5 py-1">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.experience.some((e) => e.role || e.company) && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brandGreen mb-2">Experience</h3>
          <div className="space-y-3">
            {data.experience
              .filter((e) => e.role || e.company)
              .map((e) => (
                <div key={e.id}>
                  <p className="font-semibold text-ink">{e.role}{e.company ? ` · ${e.company}` : ""}</p>
                  {e.period && <p className="text-xs text-muted">{e.period}</p>}
                  {e.description && <p className="text-muted mt-1 whitespace-pre-line">{e.description}</p>}
                </div>
              ))}
          </div>
        </section>
      )}

      {data.education.some((e) => e.school || e.degree) && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-brandGreen mb-2">Education</h3>
          <div className="space-y-2">
            {data.education
              .filter((e) => e.school || e.degree)
              .map((e) => (
                <div key={e.id}>
                  <p className="font-semibold text-ink">{e.degree}{e.school ? ` · ${e.school}` : ""}</p>
                  {e.period && <p className="text-xs text-muted">{e.period}</p>}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function CvBuilder() {
  const { user, token } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const [cv, setCv] = useState<CvData>(emptyCv);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setCv(loadCvDraft());
      setLoading(false);
      return;
    }

    api
      .getCv(token)
      .then((profile) => {
        const stored = (profile.cvData as Partial<CvData> | null) ?? {};
        const draft = loadCvDraft();
        const name = `${profile.firstName} ${profile.lastName}`.trim();
        setCv({
          ...emptyCv(),
          ...draft,
          ...stored,
          fullName: stored.fullName || draft.fullName || name,
          email: stored.email || draft.email || profile.email,
          phone: stored.phone || draft.phone || profile.phone || "",
          location: stored.location || draft.location || profile.location || "",
          headline: stored.headline || draft.headline || profile.headline || "",
          summary: stored.summary || draft.summary || profile.bio || "",
          skills: stored.skills || draft.skills || (profile.skills?.join(", ") ?? ""),
          linkedin: stored.linkedin || draft.linkedin || profile.linkedinUrl || "",
          github: stored.github || draft.github || profile.githubUrl || "",
          portfolio: stored.portfolio || draft.portfolio || profile.portfolioUrl || "",
          experience: stored.experience?.length ? stored.experience : draft.experience,
          education: stored.education?.length ? stored.education : draft.education,
        });
      })
      .catch(() => setCv(loadCvDraft()))
      .finally(() => setLoading(false));
  }, [token]);

  function update(field: keyof CvData, value: string) {
    setCv((prev) => {
      const next = { ...prev, [field]: value };
      saveCvDraft(next);
      return next;
    });
  }

  function updateList(
    key: "experience",
    id: string,
    field: keyof CvExperience,
    value: string
  ): void;
  function updateList(
    key: "education",
    id: string,
    field: keyof CvEducation,
    value: string
  ): void;
  function updateList(
    key: "experience" | "education",
    id: string,
    field: keyof CvExperience | keyof CvEducation,
    value: string
  ) {
    setCv((prev) => {
      const next = {
        ...prev,
        [key]: prev[key].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      };
      saveCvDraft(next);
      return next;
    });
  }

  function addItem(key: "experience" | "education") {
    setCv((prev) => {
      const item =
        key === "experience"
          ? { id: uid(), role: "", company: "", period: "", description: "" }
          : { id: uid(), school: "", degree: "", period: "" };
      const next = { ...prev, [key]: [...prev[key], item] };
      saveCvDraft(next);
      return next;
    });
  }

  function removeItem(key: "experience" | "education", id: string) {
    setCv((prev) => {
      const list = prev[key].filter((item) => item.id !== id);
      const next = { ...prev, [key]: list.length ? list : prev[key] };
      saveCvDraft(next);
      return next;
    });
  }

  async function handleSaveProfile() {
    if (!token || !user) {
      setError("Sign in to save your CV to your Beleqet profile.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.saveCv(token, cv as unknown as Record<string, unknown>);
      saveCvDraft(cv);
      setMessage("CV saved to your Beleqet profile and will be used when you apply for jobs.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const html = previewRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${cv.fullName || "CV"}</title>
      <style>
        body { font-family: Segoe UI, system-ui, sans-serif; padding: 40px; color: #1E293B; max-width: 800px; margin: 0 auto; }
        h2 { margin: 0 0 8px; font-size: 28px; }
        h3 { font-size: 11px; letter-spacing: 0.05em; color: #00653B; margin: 0 0 8px; }
        .text-muted { color: #64748B; }
        section { margin-bottom: 20px; }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brandGreen" />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-pageH1">CV Maker</h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            Build a professional CV, save it to your profile, and use it when applying for jobs on Beleqet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold hover:bg-pageBg"
          >
            <Download className="h-4 w-4" /> Download / Print
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brandGreen text-white px-4 py-2 text-sm font-semibold hover:bg-darkGreen disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save to Profile
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 text-sm text-brandGreen bg-brandGreen/10 border border-brandGreen/20 rounded-lg px-4 py-3">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-redAccent bg-redAccent/10 border border-redAccent/20 rounded-lg px-4 py-3">
          {error}{" "}
          {!user && (
            <Link href="/login?redirect=/cv-maker" className="font-semibold underline">
              Sign in
            </Link>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink">Personal details</h2>
            <input
              placeholder="Full name"
              value={cv.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <input
              placeholder="Professional headline e.g. Full Stack Developer"
              value={cv.headline}
              onChange={(e) => update("headline", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email"
                value={cv.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
              <input
                placeholder="Phone"
                value={cv.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <input
              placeholder="Location e.g. Addis Ababa"
              value={cv.location}
              onChange={(e) => update("location", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <textarea
              placeholder="Professional summary"
              rows={4}
              value={cv.summary}
              onChange={(e) => update("summary", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <input
              placeholder="Skills (comma-separated) e.g. React, Node.js, TypeScript"
              value={cv.skills}
              onChange={(e) => update("skills", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
            <div className="grid grid-cols-1 gap-3">
              <input
                placeholder="LinkedIn URL"
                value={cv.linkedin}
                onChange={(e) => update("linkedin", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
              <input
                placeholder="GitHub URL"
                value={cv.github}
                onChange={(e) => update("github", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
              <input
                placeholder="Portfolio URL"
                value={cv.portfolio}
                onChange={(e) => update("portfolio", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Experience</h2>
              <button type="button" onClick={() => addItem("experience")} className="text-xs text-brandGreen font-semibold flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {cv.experience.map((exp) => (
              <div key={exp.id} className="rounded-xl bg-pageBg border border-border p-4 space-y-2">
                <div className="flex justify-end">
                  <button type="button" onClick={() => removeItem("experience", exp.id)} className="text-muted hover:text-redAccent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  placeholder="Job title"
                  value={exp.role}
                  onChange={(e) => updateList("experience", exp.id, "role", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
                <input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateList("experience", exp.id, "company", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
                <input
                  placeholder="Period e.g. 2022 – Present"
                  value={exp.period}
                  onChange={(e) => updateList("experience", exp.id, "period", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
                <textarea
                  placeholder="Key responsibilities and achievements"
                  rows={3}
                  value={exp.description}
                  onChange={(e) => updateList("experience", exp.id, "description", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Education</h2>
              <button type="button" onClick={() => addItem("education")} className="text-xs text-brandGreen font-semibold flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {cv.education.map((edu) => (
              <div key={edu.id} className="rounded-xl bg-pageBg border border-border p-4 space-y-2">
                <div className="flex justify-end">
                  <button type="button" onClick={() => removeItem("education", edu.id)} className="text-muted hover:text-redAccent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  placeholder="Degree / qualification"
                  value={edu.degree}
                  onChange={(e) => updateList("education", edu.id, "degree", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
                <input
                  placeholder="School / university"
                  value={edu.school}
                  onChange={(e) => updateList("education", edu.id, "school", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
                <input
                  placeholder="Period e.g. 2018 – 2022"
                  value={edu.period}
                  onChange={(e) => updateList("education", edu.id, "period", e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brandGreen bg-white"
                />
              </div>
            ))}
          </section>
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Live preview</p>
          <div ref={previewRef}>
            <CvPreview data={cv} />
          </div>
        </div>
      </div>
    </div>
  );
}
