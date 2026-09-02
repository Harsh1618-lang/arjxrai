import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Seo } from "@/lib/seo";
import { Markdown } from "@/lib/markdown";
import { mutations, usePages } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Badge, Button, ConfirmDialog, Input, Modal, PageHeader, Tabs, Textarea, Toggle } from "@/components/ui";
import { formatDate, getErrorMessage, slugify } from "@/lib/utils";
import type { Page } from "@/types";

const SYSTEM_SLUGS = ["about", "contact", "privacy", "terms", "disclaimer", "faq"];

export default function PagesAdmin() {
  const { data: pages = [] } = usePages();
  const save = mutations.useSavePage();
  const remove = mutations.useDeletePage();
  const toast = useToast();
  const [editing, setEditing] = useState<Partial<Page> | null>(null);
  const [deleting, setDeleting] = useState<Page | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");

  const submit = async () => {
    if (!editing?.title?.trim()) return toast.error("Title is required.");
    if (!editing.slug?.trim()) return toast.error("Slug is required.");
    try {
      await save.mutateAsync(editing);
      toast.success("Page saved");
      setEditing(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Page deleted");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Seo title="Pages · Admin" noIndex />
      <PageHeader
        title="Pages"
        description="About, Contact, FAQ, Privacy, Terms, Disclaimer and any custom page."
        actions={
          <Button
            onClick={() => {
              setView("edit");
              setEditing({ title: "", slug: "", content: "", meta_description: "", is_published: true });
            }}
          >
            <Plus className="h-4 w-4" /> New page
          </Button>
        }
      />

      <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {pages.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {p.title}
                  {!p.is_published && <Badge>Draft</Badge>}
                  {SYSTEM_SLUGS.includes(p.slug) && <Badge className="border-primary/20 bg-primary/5 text-primary">System</Badge>}
                </p>
                <p className="text-xs text-zinc-500">
                  /{p.slug} · Updated {formatDate(p.updated_at)}
                </p>
              </div>
              <Link to={SYSTEM_SLUGS.includes(p.slug) ? `/${p.slug}` : `/p/${p.slug}`} target="_blank" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="View">
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setView("edit");
                  setEditing(p);
                }}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => setDeleting(p)} disabled={SYSTEM_SLUGS.includes(p.slug)} title={SYSTEM_SLUGS.includes(p.slug) ? "System pages cannot be deleted" : "Delete"}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {pages.length === 0 && <li className="p-10 text-center text-sm text-zinc-500">No pages yet.</li>}
        </ul>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit “${editing.title}”` : "New page"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submit} loading={save.isPending}>Save page</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Title" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} required />
              <Input label="Slug" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} disabled={!!editing.id && SYSTEM_SLUGS.includes(editing.slug ?? "")} hint={SYSTEM_SLUGS.includes(editing.slug ?? "") ? "System slug" : `URL: /p/${editing.slug || "…"}`} />
            </div>
            <Input label="Meta description (SEO)" value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} maxLength={160} />
            <Tabs<"edit" | "preview"> value={view} onChange={setView} tabs={[{ value: "edit", label: "Markdown" }, { value: "preview", label: "Preview" }]} />
            {view === "edit" ? (
              <Textarea rows={14} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="font-mono text-xs" hint={editing.slug === "faq" ? "FAQ format: use '## Question' headings followed by the answer." : "Supports # headings, **bold**, - lists, > quotes, ``` code, [links](url)."} />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <Markdown content={editing.content ?? ""} />
              </div>
            )}
            <Toggle label="Published" hint="Unpublished pages return 404." checked={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title={`Delete “${deleting?.title}”?`} confirmLabel="Delete" loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </div>
  );
}
