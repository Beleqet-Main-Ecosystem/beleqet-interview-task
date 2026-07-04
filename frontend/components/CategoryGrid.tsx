import Link from "next/link";
import {
  Laptop,
  Megaphone,
  Landmark,
  HeartPulse,
  GraduationCap,
  Cog,
  MoreHorizontal,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { getCategoriesServer, getJobsServer } from "@/lib/api";

const iconMap: Record<string, LucideIcon> = {
  laptop: Laptop,
  megaphone: Megaphone,
  landmark: Landmark,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  cog: Cog,
  briefcase: Briefcase,
  "more-horizontal": MoreHorizontal,
};

export default async function CategoryGrid() {
  let categories: { slug: string; label: string; count: number; icon: string }[] = [];

  try {
    const data = await getCategoriesServer();
    const withCounts = data
      .filter((c) => (c._count?.jobs ?? 0) > 0)
      .sort((a, b) => (b._count?.jobs ?? 0) - (a._count?.jobs ?? 0))
      .slice(0, 7)
      .map((c) => ({
        slug: c.slug,
        label: c.label,
        count: c._count?.jobs ?? 0,
        icon: c.icon ?? "briefcase",
      }));

    if (withCounts.length > 0) {
      categories = withCounts;
    } else {
      const jobs = await getJobsServer({ limit: 20 });
      const seen = new Set<string>();
      categories = jobs.items
        .filter((j) => j.category && !seen.has(j.category.slug) && seen.add(j.category.slug))
        .slice(0, 7)
        .map((j) => ({
          slug: j.category!.slug,
          label: j.category!.label,
          count: 1,
          icon: j.category!.icon ?? "briefcase",
        }));
    }
  } catch {
    categories = [];
  }

  return (
    <section className="container-page py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-sectionH2">Browse Jobs by Category</h2>
          <p className="text-muted text-sm mt-1">Explore opportunities across growing industries and find jobs that match your skills.</p>
        </div>
        <Link href="/jobs" className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0">
          View all categories →
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted">Categories loading from API…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Briefcase;
            return (
              <Link
                key={cat.slug}
                href={`/jobs?category=${cat.slug}`}
                className="flex flex-col items-center text-center gap-2 rounded-xl border border-border bg-white px-3 py-5 hover:border-brandGreen hover:shadow-card transition-all"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brandGreen/10 text-brandGreen">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-xs font-semibold text-ink line-clamp-2">{cat.label}</span>
                <span className="text-[11px] text-muted">{cat.count} jobs</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
