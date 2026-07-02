"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
};

function EditProfileContent() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    headline: "",
    bio: "",
    location: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    skills: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<UserProfile>("/users/profile", token || undefined);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          portfolioUrl: data.portfolioUrl || "",
          githubUrl: data.githubUrl || "",
          linkedinUrl: data.linkedinUrl || "",
          skills: data.skills?.join(", ") || "",
        });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      await api.patch("/users/profile", payload, token || undefined);
      await refreshUser();
      router.push("/dashboard/profile");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandGreen"></div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/profile" className="inline-flex items-center gap-2 text-sm text-muted hover:text-brandGreen mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <h1 className="text-3xl font-extrabold text-ink mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-border p-8 space-y-6">
          {error && (
            <div className="bg-redAccent/10 text-redAccent text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Headline</label>
            <input
              type="text"
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="e.g. Full-Stack Developer | React & Node.js"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about yourself..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+251 9XX XXX XXX"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Addis Ababa, Ethiopia"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Skills</label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="React, Node.js, TypeScript, PostgreSQL"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
            />
            <p className="text-xs text-muted mt-1">Separate skills with commas</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Portfolio URL</label>
              <input
                type="url"
                name="portfolioUrl"
                value={form.portfolioUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">GitHub</label>
              <input
                type="url"
                name="githubUrl"
                value={form.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">LinkedIn</label>
              <input
                type="url"
                name="linkedinUrl"
                value={form.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-brandGreen focus:ring-2 focus:ring-brandGreen/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/dashboard/profile" className="text-sm text-muted hover:text-ink">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute>
      <EditProfileContent />
    </ProtectedRoute>
  );
}
