import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, BookOpen, Clock, FileText, Sparkles, Video } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks, useCourses, useStats } from "@/hooks/queries";
import { CourseGrid } from "@/components/course";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { storage } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useCourses();
  const { data: stats } = useStats();
  const { data: bookmarks = [] } = useBookmarks(user?.id);
  const recentSlugs = storage.get<string[]>("srd_recent", []);
  const recent = recentSlugs.map((s) => courses.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  const saved = bookmarks.map((b) => courses.find((c) => c.id === b.course_id)).filter((c): c is NonNullable<typeof c> => !!c).slice(0, 3);
  const suggestions = courses.filter((c) => !recentSlugs.includes(c.slug) && !saved.some((s) => s.id === c.id)).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title="Dashboard" noIndex />
      <PageHeader
        eyebrow="Student"
        title={`${greeting}, ${user?.full_name.split(" ")[0] ?? "learner"} 👋`}
        description="Pick up where you left off, or discover something new."
        actions={
          <>
            <LinkButton to="/courses" variant="outline">
              Browse courses
            </LinkButton>
            <LinkButton to="/profile">Edit profile</LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Courses available", value: stats?.published ?? courses.length, color: "text-primary bg-primary/10" },
          { icon: Video, label: "Video lessons", value: stats?.videos ?? 0, color: "text-red-500 bg-red-500/10" },
          { icon: FileText, label: "PDF notes", value: stats?.pdfs ?? 0, color: "text-emerald-600 bg-emerald-500/10" },
          { icon: Clock, label: "Recently viewed", value: recent.length, color: "text-amber-600 bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Clock className="h-5 w-5 text-primary" /> Continue learning
          </h2>
        </div>
        {recent.length > 0 ? (
          <CourseGrid courses={recent} />
        ) : (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <Sparkles className="h-8 w-8 text-primary" />
            <p className="font-semibold">You haven't opened any course yet</p>
            <p className="max-w-sm text-sm text-zinc-500">Courses you view will appear here so you can quickly jump back in.</p>
            <LinkButton to="/courses" size="sm">
              Explore courses <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </Card>
        )}
      </section>

      {(suggestions.length > 0 || isLoading) && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recommended for you</h2>
            <Link to="/courses" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <CourseGrid courses={suggestions} loading={isLoading} skeletons={3} />
        </section>
      )}

      {saved.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Bookmark className="h-5 w-5 text-primary" /> Saved courses
            </h2>
            <Link to="/bookmarks" className="text-sm font-medium text-primary hover:underline">
              See all →
            </Link>
          </div>
          <CourseGrid courses={saved} />
        </section>
      )}
    </div>
  );
}
