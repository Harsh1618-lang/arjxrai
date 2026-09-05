import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useCategories, useCourses } from "@/hooks/queries";
import { CourseGrid } from "@/components/course";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type Sort = "latest" | "popular" | "title";

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const { data: courses = [], isLoading } = useCourses();
  const { data: categories = [] } = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const tag = params.get("tag") ?? "";
  const sort = (params.get("sort") as Sort) || "latest";

  useEffect(() => {
    if (params.get("focus")) {
      inputRef.current?.focus();
      const next = new URLSearchParams(params);
      next.delete("focus");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = courses.filter((c) => {
      if (category && c.category?.slug !== category) return false;
      if (tag && !c.tags.includes(tag.toLowerCase())) return false;
      if (!term) return true;
      const haystack = [c.title, c.short_description, c.description, c.instructor, c.category?.name ?? "", ...c.tags].join(" ").toLowerCase();
      return term.split(/\s+/).every((w) => haystack.includes(w));
    });
    if (sort === "popular") list = [...list].sort((a, b) => b.views - a.views);
    else if (sort === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else list = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return list;
  }, [courses, q, category, tag, sort]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    courses.forEach((c) => c.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [courses]);

  const activeCategory = categories.find((c) => c.slug === category);
  const hasFilters = !!(q || category || tag);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title={activeCategory ? `${activeCategory.name} Courses` : "All Courses"} description="Browse every free course — filter by category, tag or keyword." />
      <PageHeader eyebrow="Library" title={activeCategory ? `${activeCategory.icon} ${activeCategory.name}` : "All courses"} description={activeCategory?.description || "Search across titles, descriptions, categories and tags."} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search courses…"
            className="h-11 w-full rounded-[var(--radius)] border border-white/80 bg-white/60 pl-10 pr-10 text-sm shadow-xs outline-none backdrop-blur-md transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label="Search courses"
          />
          {q && (
            <button onClick={() => update({ q: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-11 rounded-[var(--radius)] border border-white/80 bg-white/60 px-3 text-sm outline-none backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-white"
            aria-label="Sort courses"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most popular</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={!category} onClick={() => update({ category: "" })}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={category === c.slug} onClick={() => update({ category: category === c.slug ? "" : c.slug })}>
            <span className="mr-1">{c.icon}</span>
            {c.name}
          </Chip>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => update({ tag: tag === t ? "" : t })}
              className={cn("rounded-md px-2 py-0.5 text-xs transition", tag === t ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700")}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {isLoading ? "Loading…" : `${filtered.length} course${filtered.length === 1 ? "" : "s"}`}
          {hasFilters && !isLoading && " found"}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-4">
        {!isLoading && filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title="No courses found"
            description="Try a different keyword, or clear the filters to browse everything."
            action={
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <CourseGrid courses={filtered} loading={isLoading} />
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active ? "border-primary bg-primary text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}
