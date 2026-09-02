import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, BookOpen, Calendar, CheckCircle2, ChevronRight, Circle, Clock, Download, ExternalLink, Eye, FileArchive, FileText, FolderOpen, Image as ImageIcon, Link2, Lock, NotebookPen, PlayCircle, User } from "lucide-react";
import { Seo } from "@/lib/seo";
import { Markdown } from "@/lib/markdown";
import { useBookmarks, useCourse, useCourseContent, useCourses, useLessonProgress, useSettings, useToggleBookmark, useToggleLesson } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { coursesApi } from "@/services/api";
import { CourseGrid, LessonTypeBadge, VideoPlayer } from "@/components/course";
import { TelegramIcon } from "@/components/icons";
import { Badge, Skeleton, Tabs } from "@/components/ui";
import NotFound from "@/pages/NotFound";
import { cn, formatDate, isTelegramLink, pluralize, storage } from "@/lib/utils";
import type { Resource } from "@/types";

type Tab = "lessons" | "pdfs" | "resources";

const RESOURCE_ICON: Record<Resource["type"], typeof FileArchive> = {
  zip: FileArchive,
  notes: NotebookPen,
  image: ImageIcon,
  document: FileText,
  link: Link2,
  telegram: TelegramIcon as unknown as typeof FileArchive,
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading } = useCourse(slug);
  const { data: content } = useCourseContent(course?.id);
  const { data: allCourses = [] } = useCourses();
  const { data: settings } = useSettings();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>("lessons");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const lessons = content?.lessons ?? [];
  const pdfs = content?.pdfs ?? [];
  const resources = content?.resources ?? [];
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null;

  const { data: bookmarks = [] } = useBookmarks(user?.id);
  const toggleBookmark = useToggleBookmark(user?.id);
  const { data: progress = [] } = useLessonProgress(user?.id, course?.id);
  const toggleLesson = useToggleLesson(user?.id);
  const bookmarked = !!course && bookmarks.some((b) => b.course_id === course.id);
  const completedSet = new Set(progress.map((p) => p.lesson_id));
  const progressPct = lessons.length ? Math.round((completedSet.size / lessons.length) * 100) : 0;

  useEffect(() => {
    if (!course) return;
    const key = `srd_viewed_${course.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      coursesApi.incrementViews(course.id).catch(() => undefined);
    }
    const recent = storage.get<string[]>("srd_recent", []).filter((s) => s !== course.slug);
    storage.set("srd_recent", [course.slug, ...recent].slice(0, 8));
  }, [course]);

  const related = useMemo(() => allCourses.filter((c) => c.id !== course?.id && c.category_id && c.category_id === course?.category_id).slice(0, 3), [allCourses, course]);

  if (isLoading) return <DetailSkeleton />;
  if (!course || (course.status === "draft" && !isAdmin)) return <NotFound />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.short_description,
    image: course.thumbnail,
    provider: { "@type": "Organization", name: settings?.general.site_name, url: settings?.general.domain },
    isAccessibleForFree: true,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${lessons.length}H` },
  };

  return (
    <>
      <Seo title={course.title} description={course.short_description} image={course.thumbnail} type="article" keywords={course.tags.join(", ")} jsonLd={jsonLd} />

      {/* Banner */}
      <section className="relative isolate overflow-hidden bg-zinc-900 text-white">
        {course.banner && <img src={course.banner} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-900/40" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-zinc-300" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/courses" className="hover:text-white">Courses</Link>
            {course.category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <Link to={`/courses?category=${course.category.slug}`} className="hover:text-white">{course.category.name}</Link>
              </>
            )}
          </nav>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && <Badge color={course.category.color} className="bg-white/10">{course.category.icon} {course.category.name}</Badge>}
                {course.status === "draft" && <Badge className="border-amber-400/50 bg-amber-500/20 text-amber-200">Draft preview</Badge>}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">{course.short_description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-300">
                <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {course.instructor || "SRD Team"}</span>
                <span className="inline-flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> {pluralize(lessons.length, "lesson")}</span>
                <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4" /> {pluralize(pdfs.length, "PDF")}</span>
                <span className="inline-flex items-center gap-1.5"><FolderOpen className="h-4 w-4" /> {pluralize(resources.length, "resource")}</span>
                <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {course.views.toLocaleString()} views</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Updated {formatDate(course.updated_at)}</span>
                {user && (
                  <button
                    onClick={() => toggleBookmark.mutate(course.id)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition", bookmarked ? "border-primary/50 bg-primary/25 text-white" : "border-white/25 text-zinc-200 hover:bg-white/10")}
                    aria-pressed={bookmarked}
                  >
                    {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {bookmarked ? "Saved" : "Save"}
                  </button>
                )}
              </div>
              {course.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {course.tags.map((t) => (
                    <Link key={t} to={`/courses?tag=${encodeURIComponent(t)}`} className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-zinc-200 hover:bg-white/20">
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {course.thumbnail && <img src={course.thumbnail} alt="" className="hidden w-72 shrink-0 rounded-2xl border border-white/10 object-cover shadow-2xl lg:block" />}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            <VideoPlayer lesson={activeLesson} locked={!isAuthenticated && lessons.length > 0} />
            {activeLesson && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <LessonTypeBadge type={activeLesson.video_type} />
                  {activeLesson.duration && <span className="inline-flex items-center gap-1 text-xs text-zinc-500"><Clock className="h-3.5 w-3.5" /> {activeLesson.duration}</span>}
                </div>
                <h2 className="mt-2 text-xl font-bold">{activeLesson.title}</h2>
                {activeLesson.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{activeLesson.description}</p>}
                {user && (
                  <button
                    onClick={() => toggleLesson.mutate({ lessonId: activeLesson.id, courseId: course.id })}
                    disabled={toggleLesson.isPending}
                    className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius)] border border-zinc-200 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {completedSet.has(activeLesson.id) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-zinc-400" />}
                    {completedSet.has(activeLesson.id) ? "Completed" : "Mark as complete"}
                  </button>
                )}
              </div>
            )}

            <div>
              <h2 className="mb-3 text-lg font-bold">About this course</h2>
              <Markdown content={course.description} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[calc(var(--radius)+6px)] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {user && lessons.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">Your progress</span>
                    <span className="text-zinc-500">
                      {completedSet.size}/{lessons.length} · {progressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
              <Tabs<Tab>
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "lessons", label: "Lessons", count: lessons.length },
                  { value: "pdfs", label: "PDFs", count: pdfs.length },
                  { value: "resources", label: "Resources", count: resources.length },
                ]}
              />
              {!isAuthenticated && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link> to watch videos and download files. It's free.
                  </span>
                </div>
              )}

              <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                {tab === "lessons" &&
                  (lessons.length === 0 ? (
                    <Empty text="No lessons yet." />
                  ) : (
                    lessons.map((l, i) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setActiveLessonId(l.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition",
                          activeLesson?.id === l.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        )}
                      >
                        <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold", activeLesson?.id === l.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{l.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                            {l.video_type === "telegram" ? "Telegram" : "YouTube"}
                            {l.duration && <>· {l.duration}</>}
                          </span>
                        </span>
                        {completedSet.has(l.id) && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                        {activeLesson?.id === l.id && <PlayCircle className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    ))
                  ))}

                {tab === "pdfs" &&
                  (pdfs.length === 0 ? (
                    <Empty text="No PDF notes yet." />
                  ) : (
                    pdfs.map((p) => (
                      <FileRow key={p.id} icon={FileText} title={p.title} subtitle={[p.description, p.file_size].filter(Boolean).join(" · ")} url={p.file_url} locked={!isAuthenticated} telegram={isTelegramLink(p.file_url)} />
                    ))
                  ))}

                {tab === "resources" &&
                  (resources.length === 0 ? (
                    <Empty text="No resources yet." />
                  ) : (
                    resources.map((r) => <FileRow key={r.id} icon={RESOURCE_ICON[r.type] ?? Link2} title={r.title} subtitle={[r.type.toUpperCase(), r.description].filter(Boolean).join(" · ")} url={r.url} locked={!isAuthenticated} telegram={isTelegramLink(r.url)} />)
                  ))}
              </div>
            </div>

            {settings?.general.telegram_channel && (
              <a href={settings.general.telegram_channel} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-3 rounded-[calc(var(--radius)+6px)] border border-sky-200 bg-sky-50 p-4 text-sm transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:hover:bg-sky-950/60">
                <TelegramIcon className="h-6 w-6 text-sky-500" />
                <span>
                  <span className="block font-semibold text-sky-900 dark:text-sky-100">Join our Telegram</span>
                  <span className="text-xs text-sky-700 dark:text-sky-300">Get notified about new notes & lectures</span>
                </span>
              </a>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Related courses</h2>
            </div>
            <CourseGrid courses={related} />
          </div>
        )}
      </section>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{text}</p>;
}

function FileRow({ icon: Icon, title, subtitle, url, locked, telegram }: { icon: typeof FileText; title: string; subtitle: string; url: string; locked: boolean; telegram: boolean }) {
  const inner = (
    <>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", telegram ? "bg-sky-100 text-sky-600 dark:bg-sky-900/40" : "bg-primary/10 text-primary")}>
        {telegram ? <TelegramIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && <span className="block truncate text-[11px] text-zinc-500">{subtitle}</span>}
      </span>
      {locked ? <Lock className="h-4 w-4 shrink-0 text-zinc-400" /> : telegram ? <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" /> : <Download className="h-4 w-4 shrink-0 text-zinc-400" />}
    </>
  );
  if (locked) {
    return (
      <Link to="/login" className="flex w-full items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left opacity-80 transition hover:bg-zinc-50 dark:hover:bg-zinc-800" title="Log in to access">
        {inner}
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800">
      {inner}
    </a>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <div className="bg-zinc-900 py-16">
        <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-40 bg-zinc-800" />
          <Skeleton className="h-10 w-2/3 bg-zinc-800" />
          <Skeleton className="h-5 w-1/2 bg-zinc-800" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
