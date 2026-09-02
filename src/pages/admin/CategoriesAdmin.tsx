import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useCategories, useCourses } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Button, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Textarea } from "@/components/ui";
import { contrastText, getErrorMessage, slugify } from "@/lib/utils";
import type { Category } from "@/types";

const EMOJI = ["💻", "⌨️", "📊", "🎨", "🛠️", "📐", "🧠", "📱", "☁️", "🔐", "🤖", "📚", "🎓", "🧪", "💼", "🌐"];

export default function CategoriesAdmin() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: courses = [] } = useCourses(true);
  const save = mutations.useSaveCategory();
  const remove = mutations.useDeleteCategory();
  const toast = useToast();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const counts = courses.reduce<Record<string, number>>((acc, c) => {
    if (c.category_id) acc[c.category_id] = (acc[c.category_id] ?? 0) + 1;
    return acc;
  }, {});

  const submit = async () => {
    if (!editing?.name?.trim()) return toast.error("Name is required.");
    try {
      await save.mutateAsync(editing);
      toast.success("Category saved");
      setEditing(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Category deleted");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Seo title="Categories · Admin" noIndex />
      <PageHeader
        title="Categories"
        description="Organise courses into learning tracks."
        actions={
          <Button onClick={() => setEditing({ name: "", slug: "", description: "", icon: "📚", color: "#4f46e5", sort_order: categories.length + 1 })}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {!isLoading && categories.length === 0 ? (
        <EmptyState icon={<FolderTree className="h-10 w-10" />} title="No categories yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: c.color, color: contrastText(c.color) }}>
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-zinc-500">
                  /{c.slug} · {counts[c.id] ?? 0} courses · order {c.sort_order}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.description}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(c)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleting(c)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit category" : "New category"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} loading={save.isPending}>Save</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Input label="Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} required />
            <Input label="Slug" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
            <Textarea label="Description" rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI.map((em) => (
                  <button key={em} type="button" onClick={() => setEditing({ ...editing, icon: em })} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg ${editing.icon === em ? "border-primary bg-primary/10" : "border-zinc-200 dark:border-zinc-700"}`}>
                    {em}
                  </button>
                ))}
              </div>
              <Input wrapperClassName="mt-2" value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Or type any emoji" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editing.color ?? "#4f46e5"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-700" />
                  <Input value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} wrapperClassName="flex-1" />
                </div>
              </div>
              <Input label="Order" type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title={`Delete “${deleting?.name}”?`} description="Courses in this category will become uncategorised." confirmLabel="Delete" loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </div>
  );
}
