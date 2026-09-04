import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, Lock, PlayCircle, Video } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { Badge, LinkButton, Skeleton } from "@/components/ui";
import { cn, getEmbedUrl, parseVideo, pluralize, youtubeThumb } from "@/lib/utils";
import type { CourseWithMeta, Lesson, VideoType } from "@/types";

/* ──────────────────────── Lesson type badge ──────────────────────── */

export function LessonTypeBadge({ type }: { type: VideoType }) {
  const meta: Record<VideoType, { label: string; color: string }> = {
    telegram: { label: "Telegram", color: "#229ED9" },
    youtube: { label: "YouTube", color: "#FF0000" },
    gdrive: { label: "Google Drive", color: "#0F9D58" },
    direct: { label: "Video file", color: "#7C3AED" },
    bunny: { label: "Bunny", color: "#FF7B00" },
  };
  const { label, color } = meta[type] ?? meta.youtube;
  return (
    <Badge color={color}>
      {type === "telegram" ? <TelegramIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

/* ──────────────────────── Course card ──────────────────────── */

export function CourseCard({ course, className }: { course: CourseWithMeta; className?: string }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white transition-all duration-200",
        "hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/40",
        "dark:border-[#1a1a1a] dark:bg-[#0a0a0a]",
        "dark:hover:border-[#2a2a2a] dark:hover:shadow-none",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-[#111111]">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}
        {course.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Featured
          </span>
        )}
        {course.status === "draft" && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Draft
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {course.category && (
          <span className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: course.category.color }}>
            <span>{course.category.icon}</span> {course.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-600">
          {course.short_description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 text-[12px] text-zinc-400 dark:border-[#151515] dark:text-zinc-700" style={{ marginTop: "1rem" }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="h-3 w-3" /> {pluralize(course.lesson_count, "lesson")}
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" /> {pluralize(course.pdf_count, "PDF")}
            </span>
          </div>
          <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-[#1a1a1a]">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function CourseGrid({ courses, loading, skeletons = 6 }: { courses: CourseWithMeta[]; loading?: boolean; skeletons?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loading
        ? Array.from({ length: skeletons }).map((_, i) => <CourseCardSkeleton key={i} />)
        : courses.map((c) => <CourseCard key={c.id} course={c} />)}
    </div>
  );
}

/* ──────────────────────── Video player ──────────────────────── */

export function VideoPlayer({ lesson, locked }: { lesson: Lesson | null; locked?: boolean }) {
  const [started, setStarted] = useState(false);
  const parsed = lesson ? parseVideo(lesson.video_url) : { type: "unknown" as const };
  const embed = lesson ? getEmbedUrl(lesson.video_url) : null;
  const poster = lesson ? youtubeThumb(lesson.video_url) : null;

  if (locked) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-[#080808] border border-[#1a1a1a] px-6 text-center text-white">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/8 border border-white/10">
          <Lock className="h-4 w-4 text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-white">Log in to watch</p>
        <p className="mt-1 text-[12px] text-zinc-600">Free account · takes 30 seconds</p>
        <div className="mt-4 flex gap-2">
          <LinkButton to="/login" size="sm" variant="secondary" className="bg-white text-black hover:bg-zinc-100">Log in</LinkButton>
          <LinkButton to="/register" size="sm" variant="ghost" className="text-zinc-400 hover:bg-white/8 hover:text-white">Sign up</LinkButton>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#080808] border border-[#1a1a1a] text-zinc-700">
        <Video className="h-10 w-10" />
      </div>
    );
  }

  if (parsed.type === "youtube" && !started && poster) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-[#1a1a1a] bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Play video"
      >
        <img src={poster} alt={lesson.title} className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-50" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-2xl transition-transform group-hover:scale-105">
          <PlayCircle className="h-7 w-7 text-zinc-900" />
        </div>
      </button>
    );
  }

  if (embed) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#1a1a1a] bg-black aspect-video">
        <iframe
          src={embed + (parsed.type === "youtube" ? "&autoplay=1" : "")}
          title={lesson.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (parsed.type === "telegram") {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-[#1a1a1a] bg-[#080808] gap-3 px-6 text-center">
        <TelegramIcon className="h-8 w-8 text-sky-500" />
        <p className="text-sm font-medium text-zinc-300">Hosted on Telegram</p>
        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-400 transition hover:bg-sky-500/20">
          Watch on Telegram <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  if (parsed.type === "direct") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#1a1a1a] bg-black aspect-video">
        <video src={lesson.video_url} controls playsInline className="h-full w-full" title={lesson.title} />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-[#1a1a1a] bg-[#080808] text-zinc-700">
      <Video className="h-10 w-10" />
    </div>
  );
}

/* ──────────────────────── Lesson list ──────────────────────── */

export function LessonItem({
  lesson,
  index,
  isActive,
  isCompleted,
  locked,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  isActive?: boolean;
  isCompleted?: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary dark:bg-primary/8"
          : locked
            ? "cursor-default opacity-50"
            : "hover:bg-zinc-50 dark:hover:bg-[#111111]",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
          isCompleted
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-primary text-white"
              : "bg-zinc-100 text-zinc-500 dark:bg-[#1a1a1a] dark:text-zinc-500",
        )}
      >
        {isCompleted ? "✓" : index + 1}
      </span>
      <span className="flex-1 text-[13px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
        {lesson.title}
      </span>
      {lesson.duration && (
        <span className="shrink-0 text-[11px] text-zinc-400 dark:text-zinc-700">{lesson.duration}</span>
      )}
      {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-700" />}
    </button>
  );
}
