import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Eye, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useCourses } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Badge, Button, ConfirmDialog, EmptyState, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";
import type { CourseWithMeta } from "@/types";

export default function CoursesAdmin() {
  const { data: courses = [], isLoading } = useCourses(true);
  const save = mutations.useSaveCourse();
  const remove = mutations.useDeleteCourse();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [pendingDelete, setPendingDelete] = useState<CourseWithMeta | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return courses.filter((c) => (status === "all" || c.status === status) && (!term || c.title.toLowerCase().includes(term) || c.tags.some((t) => t.includes(term))));
  }, [courses, q, status]);

  const toggle = async (c: CourseWithMeta, patch: Partial<CourseWithMeta>) => {
    try {
      await save.mutateAsync({ id: c.id, ...patch });
      toast.success("Course updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Course deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div>
      <Seo title="Courses · Admin" noIndex />
      <PageHeader
        title="Courses"
        description={`${courses.length} total · ${courses.filter((c) => c.status === "published").length} published`}
        actions={
          <LinkButton to="/admin/courses/new">
            <Plus className="h-4 w-4" /> New course
          </LinkButton>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="h-10 w-full rounded-[var(--radius)] border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900" />
        </div>
        <div className="flex gap-1 rounded-[var(--radius)] bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["all", "published", "draft"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium capitalize", status === s ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No courses found" description="Create your first course to get started." action={<LinkButton to="/admin/courses/new">New course</LinkButton>} />
      ) : (
        <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="hidden bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((c) => (
                <tr key={c.id} className="flex flex-col gap-2 p-4 md:table-row md:p-0">
                  <td className="md:px-4 md:py-3">
                    <div className="flex items-center gap-3">
                      <img src={c.thumbnail} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover" />
                      <div className="min-w-0">
                        <Link to={`/admin/courses/${c.id}`} className="block truncate font-medium hover:text-primary">
                          {c.title}
                        </Link>
                        <p className="text-xs text-zinc-500">Updated {formatDate(c.updated_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="md:px-4 md:py-3">{c.category ? <Badge color={c.category.color}>{c.category.icon} {c.category.name}</Badge> : <span className="text-zinc-400">—</span>}</td>
                  <td className="text-xs text-zinc-500 md:px-4 md:py-3">
                    {c.lesson_count} lessons · {c.pdf_count} PDFs · {c.resource_count} res.
                  </td>
                  <td className="md:px-4 md:py-3">
                    <button onClick={() => toggle(c, { status: c.status === "published" ? "draft" : "published" })} title="Toggle status">
                      <Badge className={c.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"}>{c.status}</Badge>
                    </button>
                  </td>
                  <td className="text-zinc-500 md:px-4 md:py-3">{c.views.toLocaleString()}</td>
                  <td className="md:px-4 md:py-3">
                    <div className="flex items-center gap-1 md:justify-end">
                      <Button size="icon" variant="ghost" title={c.is_featured ? "Unfeature" : "Feature"} onClick={() => toggle(c, { is_featured: !c.is_featured })}>
                        <Star className={cn("h-4 w-4", c.is_featured ? "fill-amber-400 text-amber-400" : "text-zinc-400")} />
                      </Button>
                      <Link to={`/courses/${c.slug}`} target="_blank" className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link to={`/admin/courses/${c.id}`} className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title="Delete" onClick={() => setPendingDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete “${pendingDelete?.title}”?`}
        description="All lessons, PDFs and resources of this course will be permanently removed."
        confirmLabel="Delete course"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
