import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, FileText, Quote, Search, Users, Video } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useCategories, useCourses, useSettings, useStats } from "@/hooks/queries";
import { CourseGrid } from "@/components/course";
import { LinkButton, SectionTitle } from "@/components/ui";

export default function Home() {
  const { data: settings } = useSettings();
  const { data: courses = [], isLoading } = useCourses();
  const { data: categories = [] } = useCategories();
  const { data: stats } = useStats();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  if (!settings) return null;
  const { hero, home, general } = settings;

  const featured = courses.filter((c) => c.is_featured).slice(0, home.featured_limit);
  const latest = [...courses].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, home.latest_limit);
  const popular = [...courses].sort((a, b) => b.views - a.views).slice(0, home.popular_limit);
  const countByCat = courses.reduce<Record<string, number>>((acc, c) => {
    if (c.category_id) acc[c.category_id] = (acc[c.category_id] ?? 0) + 1;
    return acc;
  }, {});

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses");
  };

  return (
    <>
      <Seo />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* AMOLED hero glow — one single accent moment */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 animate-glow-pulse rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="animate-fade-in-up">
            <p className="text-xs font-semibold tracking-widest text-primary/70 uppercase">{general.tagline}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-zinc-900 dark:text-white sm:text-5xl lg:text-[52px]">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-500">
              {hero.subtitle}
            </p>

            {/* Search */}
            <form onSubmit={onSearch} className="liquid-glass-bar mt-8 flex max-w-md items-center gap-0 overflow-hidden rounded-xl" role="search">
              <Search className="ml-4 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses, topics, tags…"
                className="h-11 w-full bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500"
                aria-label="Search courses"
              />
              <button type="submit" className="mr-1.5 h-8 shrink-0 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {hero.cta_text && (
                <LinkButton to={hero.cta_link || "/courses"} size="md">
                  {hero.cta_text} <ArrowRight className="h-4 w-4" />
                </LinkButton>
              )}
              {hero.secondary_cta_text && (
                <LinkButton to={hero.secondary_cta_link || "/about"} size="md" variant="outline">
                  {hero.secondary_cta_text}
                </LinkButton>
              )}
            </div>

            {/* Stats */}
            <dl className="mt-10 flex gap-8 border-t border-black/5 pt-8 dark:border-white/10">
              {[
                { icon: BookOpen, label: "Courses", value: stats?.published ?? courses.length },
                { icon: Video, label: "Lessons", value: stats?.videos ?? 0 },
                { icon: FileText, label: "PDF notes", value: stats?.pdfs ?? 0 },
              ].map((s) => (
                <div key={s.label}>
                  <dd className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{s.value}+</dd>
                  <dt className="mt-0.5 flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                    <s.icon className="h-3 w-3" /> {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          {hero.image && (
            <div className="relative order-first animate-fade-in lg:order-none">
              <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-primary/8 blur-3xl" />
              <img
                src={hero.image}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
                loading="eager"
                fetchPriority="high"
              />
              {/* Free badge */}
              <div className="liquid-course-card absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">100% Free</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">No paywalls, ever</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ── */}
      {home.show_categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionTitle
            title="Browse by category"
            subtitle="Pick a track and start learning."
            action={
              <Link to="/categories" className="text-[13px] font-medium text-primary hover:underline">
                All categories →
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/courses?category=${cat.slug}`}
                className="liquid-course-card group flex flex-col items-start gap-3 rounded-2xl p-4"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                  style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                >
                  {cat.icon}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-zinc-800 group-hover:text-primary dark:text-zinc-200">{cat.name}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{countByCat[cat.id] ?? 0} courses</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {home.show_featured && (featured.length > 0 || isLoading) && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionTitle
            title="Featured courses"
            subtitle="Hand-picked by our team."
            action={<Link to="/courses" className="text-[13px] font-medium text-primary hover:underline">View all →</Link>}
          />
          <CourseGrid courses={featured} loading={isLoading} />
        </section>
      )}

      {/* ── Latest — full-width transparent band ── */}
      {home.show_latest && (latest.length > 0 || isLoading) && (
        <section className="border-y border-black/5 bg-white/20 py-14 backdrop-blur-xs dark:border-white/5 dark:bg-black/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              title="Latest courses"
              subtitle="Fresh uploads straight from the channel."
              action={<Link to="/courses?sort=latest" className="text-[13px] font-medium text-primary hover:underline">See more →</Link>}
            />
            <CourseGrid courses={latest} loading={isLoading} />
          </div>
        </section>
      )}

      {/* ── Popular — ranked list ── */}
      {home.show_popular && popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionTitle
            title="Most popular"
            subtitle="What learners are watching right now."
            action={<Link to="/courses?sort=popular" className="text-[13px] font-medium text-primary hover:underline">Explore →</Link>}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {popular.map((c, i) => (
              <Link
                key={c.id}
                to={`/courses/${c.slug}`}
                className="liquid-course-card group flex items-center gap-4 rounded-2xl p-3.5"
              >
                <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-400 dark:text-zinc-600">{i + 1}</span>
                {c.thumbnail && (
                  <img src={c.thumbnail} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-100">{c.title}</p>
                  <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                    {c.category?.name && `${c.category.name} · `}{c.lesson_count} lessons · {c.views.toLocaleString()} views
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary dark:text-zinc-500" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {home.show_testimonials && home.testimonials.length > 0 && (
        <section className="border-y border-black/5 bg-white/20 py-14 backdrop-blur-xs dark:border-white/5 dark:bg-black/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Loved by learners" subtitle="Real feedback from our community." />
            <div className="grid gap-4 md:grid-cols-3">
              {home.testimonials.map((t, i) => (
                <figure
                  key={i}
                  className="liquid-course-card rounded-2xl p-6"
                >
                  <Quote className="h-5 w-5 text-primary/30" />
                  <blockquote className="mt-3 text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">"{t.text}"</blockquote>
                  <figcaption className="mt-4 text-[13px]">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">{t.name}</span>
                    <span className="text-zinc-500 dark:text-zinc-400"> · {t.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="liquid-glass-bar relative overflow-hidden rounded-3xl border border-white/80 p-8 sm:p-12 md:py-16 text-center shadow-xl dark:border-white/10">
          {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE CTA */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
            {/* Ambient soft iridescent wash */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/35 via-purple-50/25 to-sky-100/30 opacity-100 dark:opacity-0" />

            {/* Liquid Blob 1: Left */}
            <div
              className="liquid-blob-anim-1 absolute -top-12 -left-12 h-64 w-64 rounded-full bg-gradient-to-r from-indigo-500/35 via-violet-500/25 to-purple-500/20 blur-[40px] dark:from-indigo-600/30 dark:via-violet-600/20 dark:to-purple-700/15"
            />
            {/* Liquid Blob 2: Right */}
            <div
              className="liquid-blob-anim-2 absolute -bottom-12 -right-12 h-72 w-72 rounded-full bg-gradient-to-r from-cyan-400/35 via-sky-500/25 to-blue-500/20 blur-[45px] dark:from-sky-500/30 dark:via-blue-600/20 dark:to-teal-500/15"
            />
            {/* Liquid Blob 3: Center */}
            <div
              className="liquid-blob-anim-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-64 rounded-full bg-gradient-to-r from-fuchsia-500/25 to-pink-500/20 blur-[36px] dark:from-fuchsia-600/20 dark:to-pink-600/15"
            />
          </div>

          {/* Top specular reflection line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent" />

          {/* Shimmer sweep effect */}
          <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-35 dark:opacity-15" />

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-4xl dark:text-white">
              Start learning today
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-[15px]">
              Free account. Every course, every PDF, every lesson — no paywall.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton
                to={general.registration_enabled ? "/register" : "/login"}
                size="md"
                variant="primary"
                className="shadow-lg shadow-indigo-500/25"
              >
                {general.registration_enabled ? "Create free account" : "Log in"}
              </LinkButton>
              <LinkButton
                to="/courses"
                size="md"
                variant="outline"
                className="border-white/80 bg-white/70 shadow-xs backdrop-blur-md hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Browse courses
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
