"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { User, Mail, Phone, MapPin, Briefcase, Globe, Github, Linkedin, Edit, Camera } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  createdAt: string;
};

function ProfileContent() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<UserProfile>("/users/profile", token || undefined);
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandGreen"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-ink">My Profile</h1>
          <Link
            href="/dashboard/profile/edit"
            className="inline-flex items-center gap-2 rounded-xl bg-brandGreen px-4 py-2.5 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-brandGreen to-darkGreen"></div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6">
              <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-card flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.firstName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-brandGreen">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0">
                <button className="h-10 w-10 rounded-full bg-white border border-border shadow-card flex items-center justify-center text-muted hover:text-brandGreen transition-colors">
                  <Camera className="h-5 w-5" />
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-ink">{profile.firstName} {profile.lastName}</h2>
            {profile.headline && (
              <p className="text-muted mt-1">{profile.headline}</p>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {profile.email}
              </span>
              {profile.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> {profile.phone}
                </span>
              )}
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {profile.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> {profile.role.replace("_", " ")}
              </span>
            </div>

            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-ink mb-2">About</h3>
                <p className="text-muted text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-ink mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-full bg-brandGreen/10 text-brandGreen text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brandGreen hover:underline">
                  <Globe className="h-4 w-4" /> Portfolio
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brandGreen hover:underline">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brandGreen hover:underline">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border text-xs text-muted">
              Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
