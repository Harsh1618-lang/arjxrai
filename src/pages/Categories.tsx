import { Link } from "react-router-dom";
import { ArrowRight, FolderTree } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useCategories, useCourses } from "@/hooks/queries";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { contrastText } from "@/lib/utils";

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: courses = [] } = useCourses();

  const counts = courses.reduce<Record<string, number>>((acc, c) => {
    if (c.category_id) acc[c.category_id] = (acc[c.category_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title="Categories" description="Explore courses by category — web development, programming, data science, design and more." />
      <PageHeader eyebrow="Explore" title="Categories" description="Every course is organised into a focused learning track." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon={<FolderTree className="h-10 w-10" />} title="No categories yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/courses?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-[calc(var(--radius)+6px)] border border-zinc-200/80 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition group-hover:opacity-25" style={{ backgroundColor: cat.color }} />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm" style={{ backgroundColor: cat.color, color: contrastText(cat.color) }}>
                {cat.icon}
              </span>
              <h2 className="mt-4 text-lg font-bold group-hover:text-primary">{cat.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{cat.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{counts[cat.id] ?? 0} courses</span>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
