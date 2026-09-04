import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, FileText, FolderOpen, Pencil, Plus, Save, Trash2, Video } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useCategories, useCourseById, useCourseContent } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { LessonTypeBadge } from "@/components/course";
import { Badge, Button, Card, ConfirmDialog, Input, Modal, PageHeader, PageLoader, Select, Tabs, Textarea, Toggle } from "@/components/ui";
import { getErrorMessage, isSafeUrl, parseVideo, slugify } from "@/lib/utils";
import type { Course, Lesson, Pdf, Resource, ResourceType } from "@/types";

type Tab = "lessons" | "pdfs" | "resources";

const emptyCourse: Partial<Course> = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  thumbnail: "",
  banner: "",
  category_id: null,
  tags: [],
  instructor: "",
  status: "draft",
  is_featured: false,
  sort_order: 0,
  views: 0,
};

export default function CourseEditor() {
  const { id = "new" } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const { data: course, isLoading } = useCourseById(id);
  const { data: categories = [] } = useCategories();
  const save = mutations.useSaveCourse();
  const [form, setForm] = useState<Partial<Course>>(emptyCourse);
  const [tagsInput, setTagsInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState<Tab>("lessons");

  useEffect(() => {
    if (course) {
      setForm(course);
      setTagsInput((course.tags ?? []).join(", "));
      setSlugTouched(true);
    }
  }, [course]);

  const set = <K extends keyof Course>(key: K, value: Course[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return toast.error("Title is required.");
    if (form.thumbnail && !isSafeUrl(form.thumbnail)) return toast.error("Thumbnail must be a valid URL.");
    try {
      const saved = await save.mutateAsync({ ...form, tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean) });
      toast.success(isNew ? "Course created — now add lessons!" : "Course saved");
      if (isNew) navigate(`/admin/courses/${saved.id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!isNew && isLoading) return <PageLoader />;
  if (!isNew && !course) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-500">Course not found.</p>
        <Link to="/admin/courses" className="mt-3 inline-block text-sm text-primary hover:underline">← Back to courses</Link>
      </div>
    );
  }

  return (
    <div>
      <Seo title={isNew ? "New course" : `Edit · ${course?.title}`} noIndex />
      <Link to="/admin/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>
      <PageHeader
        title={isNew ? "Create course" : "Edit course"}
        description={isNew ? "Fill in the details, save, then add lessons, PDFs and resources." : course?.title}
        actions={
          !isNew &&
          course && (
            <Link to={`/courses/${course.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Preview <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )
        }
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="space-y-4 p-5">
            <Input
              label="Title"
              value={form.title ?? ""}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              required
            />
            <Input
              label="Slug"
              value={form.slug ?? ""}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              hint={`URL: /courses/${form.slug || "…"}`}
            />
            <Input label="Short description" value={form.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} hint="Shown on cards and in search results (max ~160 chars)." maxLength={200} />
            <Textarea label="Description (Markdown)" rows={10} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} hint="Supports # headings, **bold**, - lists, > quotes and [links](url)." />
          </Card>

          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Media</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input label="Thumbnail URL" type="url" value={form.thumbnail ?? ""} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://…" />
                {form.thumbnail && <img src={form.thumbnail} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />}
              </div>
              <div>
                <Input label="Banner URL" type="url" value={form.banner ?? ""} onChange={(e) => set("banner", e.target.value)} placeholder="https://…" hint="Optional. Falls back to the thumbnail." />
                {form.banner && <img src={form.banner} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />}
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Tip: upload images to your Telegram channel or any image host and paste the direct link. Manage saved links in <Link to="/admin/media" className="text-primary underline">Media</Link>.
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Publishing</h3>
            <Select label="Status" value={form.status ?? "draft"} onChange={(e) => set("status", e.target.value as Course["status"])} options={[{ value: "draft", label: "Draft (hidden)" }, { value: "published", label: "Published" }]} />
            <Toggle label="Featured" hint="Show in the featured section on the home page." checked={!!form.is_featured} onChange={(v) => set("is_featured", v)} />
            <Input label="Sort order" type="number" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
          </Card>
          <Card className="space-y-4 p-5">
            <h3 className="font-semibold">Organisation</h3>
            <Select label="Category" value={form.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)} options={[{ value: "", label: "— None —" }, ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))]} />
            <Input label="Tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="javascript, beginner, frontend" hint="Comma separated." />
            <Input label="Instructor" value={form.instructor ?? ""} onChange={(e) => set("instructor", e.target.value)} placeholder="SRD Team" />
          </Card>
          <Button type="submit" className="w-full" size="lg" loading={save.isPending}>
            <Save className="h-4 w-4" /> {isNew ? "Create course" : "Save changes"}
          </Button>
        </div>
      </form>

      {!isNew && course && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Course content</h2>
          <ContentManager courseId={course.id} tab={tab} setTab={setTab} />
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Content manager ---------------------------- */

function ContentManager({ courseId, tab, setTab }: { courseId: string; tab: Tab; setTab: (t: Tab) => void }) {
  const { data, isLoading } = useCourseContent(courseId);
  const lessons = data?.lessons ?? [];
  const pdfs = data?.pdfs ?? [];
  const resources = data?.resources ?? [];

  return (
    <Card className="p-5">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "lessons", label: "Video lessons", count: lessons.length },
          { value: "pdfs", label: "PDF notes", count: pdfs.length },
          { value: "resources", label: "Resources", count: resources.length },
        ]}
      />
      <div className="mt-5">
        {isLoading ? (
          <PageLoader />
        ) : tab === "lessons" ? (
          <LessonsPanel courseId={courseId} items={lessons} />
        ) : tab === "pdfs" ? (
          <PdfsPanel courseId={courseId} items={pdfs} />
        ) : (
          <ResourcesPanel courseId={courseId} items={resources} />
        )}
      </div>
    </Card>
  );
}

interface PanelProps<T> {
  items: T[];
  title: string;
  icon: typeof Video;
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onReorder: (items: T[]) => void;
  render: (item: T) => React.ReactNode;
}

function ListPanel<T extends { id: string }>({ items, title, icon: Icon, onAdd, onEdit, onDelete, onReorder, render }: PanelProps<T>) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onReorder(next);
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {items.length} {title.toLowerCase()}
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add {title.replace(/s$/, "").toLowerCase()}
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <Icon className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          No {title.toLowerCase()} yet.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <span className="w-6 text-center text-xs font-semibold text-zinc-400">{i + 1}</span>
              <div className="min-w-0 flex-1">{render(item)}</div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(item)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onDelete(item)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useCrud<T extends { id: string; title: string }>(saveM: { mutateAsync: (x: Partial<T>) => Promise<T> }, delM: { mutateAsync: (id: string) => Promise<void>; isPending: boolean }, reorderM: { mutateAsync: (items: T[]) => Promise<void> }) {
  const toast = useToast();
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (validate?: () => string | null) => {
    if (!editing) return;
    const err = validate?.();
    if (err) return toast.error(err);
    setBusy(true);
    try {
      await saveM.mutateAsync(editing);
      toast.success("Saved");
      setEditing(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await delM.mutateAsync(deleting.id);
      toast.success("Deleted");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(null);
    }
  };
  const reorder = (items: T[]) => reorderM.mutateAsync(items).catch((e) => toast.error(getErrorMessage(e)));
  return { editing, setEditing, deleting, setDeleting, busy, submit, confirmDelete, reorder };
}

function LessonsPanel({ courseId, items }: { courseId: string; items: Lesson[] }) {
  const crud = useCrud<Lesson>(mutations.useSaveLesson(courseId), mutations.useDeleteLesson(courseId), mutations.useReorderLessons(courseId));
  const e = crud.editing;
  const parsed = e?.video_url ? parseVideo(e.video_url) : null;
  return (
    <>
      <ListPanel<Lesson>
        items={items}
        title="Lessons"
        icon={Video}
        onAdd={() => crud.setEditing({ course_id: courseId, title: "", description: "", video_url: "", video_type: "youtube", duration: "", sort_order: items.length + 1 })}
        onEdit={crud.setEditing}
        onDelete={crud.setDeleting}
        onReorder={crud.reorder}
        render={(l) => (
          <>
            <p className="truncate text-sm font-medium">{l.title}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              <LessonTypeBadge type={l.video_type} /> {l.duration && <span>{l.duration}</span>}
            </div>
          </>
        )}
      />
      <Modal
        open={!!e}
        onClose={() => crud.setEditing(null)}
        title={e?.id ? "Edit lesson" : "Add lesson"}
        footer={
          <>
            <Button variant="outline" onClick={() => crud.setEditing(null)}>Cancel</Button>
            <Button loading={crud.busy} onClick={() => crud.submit(() => (!e?.title?.trim() ? "Title is required" : !e.video_url || parseVideo(e.video_url).type === "unknown" ? "Enter a valid YouTube, Telegram, Google Drive, or direct video file (.mp4) link" : null))}>
              Save lesson
            </Button>
          </>
        }
      >
        {e && (
          <div className="space-y-4">
            <Input label="Title" value={e.title ?? ""} onChange={(ev) => crud.setEditing({ ...e, title: ev.target.value })} required />
            <Input
              label="Video URL"
              value={e.video_url ?? ""}
              onChange={(ev) => {
                const url = ev.target.value;
                const p = parseVideo(url);
                const video_type = p.type === "unknown" ? "youtube" : p.type;
                crud.setEditing({ ...e, video_url: url, video_type });
              }}
              placeholder="YouTube, Telegram, Google Drive, Bunny.net embed link, or a direct .mp4 (Cloudinary/ImageKit) URL"
              hint={
                parsed?.type === "youtube" ? `✓ YouTube video ${parsed.id}` :
                parsed?.type === "telegram" ? `✓ Telegram post ${parsed.channel}/${parsed.post}` :
                parsed?.type === "gdrive" ? `✓ Google Drive file ${parsed.id}` :
                parsed?.type === "bunny" ? `✓ Bunny.net video ${parsed.video}` :
                parsed?.type === "direct" ? "✓ Direct video file (Cloudinary / ImageKit / other)" :
                "Paste a YouTube, Telegram, Google Drive, or direct video file link."
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Source" value={e.video_type ?? "youtube"} onChange={(ev) => crud.setEditing({ ...e, video_type: ev.target.value as Lesson["video_type"] })} options={[{ value: "youtube", label: "YouTube" }, { value: "telegram", label: "Telegram" }, { value: "gdrive", label: "Google Drive" }, { value: "bunny", label: "Bunny.net" }, { value: "direct", label: "Direct file (Cloudinary/ImageKit)" }]} />
              <Input label="Duration" value={e.duration ?? ""} onChange={(ev) => crud.setEditing({ ...e, duration: ev.target.value })} placeholder="1h 20m" />
            </div>
            <Textarea label="Description" rows={3} value={e.description ?? ""} onChange={(ev) => crud.setEditing({ ...e, description: ev.target.value })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!crud.deleting} title="Delete lesson?" onConfirm={crud.confirmDelete} onClose={() => crud.setDeleting(null)} confirmLabel="Delete" />
    </>
  );
}

function PdfsPanel({ courseId, items }: { courseId: string; items: Pdf[] }) {
  const crud = useCrud<Pdf>(mutations.useSavePdf(courseId), mutations.useDeletePdf(courseId), mutations.useReorderPdfs(courseId));
  const e = crud.editing;
  return (
    <>
      <ListPanel<Pdf>
        items={items}
        title="PDFs"
        icon={FileText}
        onAdd={() => crud.setEditing({ course_id: courseId, title: "", description: "", file_url: "", file_size: "", sort_order: items.length + 1 })}
        onEdit={crud.setEditing}
        onDelete={crud.setDeleting}
        onReorder={crud.reorder}
        render={(p) => (
          <>
            <p className="truncate text-sm font-medium">{p.title}</p>
            <p className="truncate text-xs text-zinc-500">
              {p.file_size && `${p.file_size} · `}
              {p.file_url}
            </p>
          </>
        )}
      />
      <Modal
        open={!!e}
        onClose={() => crud.setEditing(null)}
        title={e?.id ? "Edit PDF" : "Add PDF"}
        footer={
          <>
            <Button variant="outline" onClick={() => crud.setEditing(null)}>Cancel</Button>
            <Button loading={crud.busy} onClick={() => crud.submit(() => (!e?.title?.trim() ? "Title is required" : !isSafeUrl(e.file_url ?? "") ? "Enter a valid Telegram file link" : null))}>
              Save PDF
            </Button>
          </>
        }
      >
        {e && (
          <div className="space-y-4">
            <Input label="Title" value={e.title ?? ""} onChange={(ev) => crud.setEditing({ ...e, title: ev.target.value })} required />
            <Input label="Telegram file link" value={e.file_url ?? ""} onChange={(ev) => crud.setEditing({ ...e, file_url: ev.target.value })} placeholder="https://t.me/your_channel/123" hint="Upload the PDF to your Telegram channel, then paste the post link here." />
            <Input label="File size (optional)" value={e.file_size ?? ""} onChange={(ev) => crud.setEditing({ ...e, file_size: ev.target.value })} placeholder="2.4 MB" />
            <Textarea label="Description" rows={3} value={e.description ?? ""} onChange={(ev) => crud.setEditing({ ...e, description: ev.target.value })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!crud.deleting} title="Delete PDF?" onConfirm={crud.confirmDelete} onClose={() => crud.setDeleting(null)} confirmLabel="Delete" />
    </>
  );
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "zip", label: "ZIP archive" },
  { value: "notes", label: "Notes" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "link", label: "External link" },
  { value: "telegram", label: "Telegram link" },
];

function ResourcesPanel({ courseId, items }: { courseId: string; items: Resource[] }) {
  const crud = useCrud<Resource>(mutations.useSaveResource(courseId), mutations.useDeleteResource(courseId), mutations.useReorderResources(courseId));
  const e = crud.editing;
  return (
    <>
      <ListPanel<Resource>
        items={items}
        title="Resources"
        icon={FolderOpen}
        onAdd={() => crud.setEditing({ course_id: courseId, title: "", description: "", type: "zip", url: "", sort_order: items.length + 1 })}
        onEdit={crud.setEditing}
        onDelete={crud.setDeleting}
        onReorder={crud.reorder}
        render={(r) => (
          <>
            <p className="flex items-center gap-2 truncate text-sm font-medium">
              {r.title} <Badge className="uppercase">{r.type}</Badge>
            </p>
            <p className="truncate text-xs text-zinc-500">{r.url}</p>
          </>
        )}
      />
      <Modal
        open={!!e}
        onClose={() => crud.setEditing(null)}
        title={e?.id ? "Edit resource" : "Add resource"}
        footer={
          <>
            <Button variant="outline" onClick={() => crud.setEditing(null)}>Cancel</Button>
            <Button loading={crud.busy} onClick={() => crud.submit(() => (!e?.title?.trim() ? "Title is required" : !isSafeUrl(e.url ?? "") ? "Enter a valid URL" : null))}>
              Save resource
            </Button>
          </>
        }
      >
        {e && (
          <div className="space-y-4">
            <Input label="Title" value={e.title ?? ""} onChange={(ev) => crud.setEditing({ ...e, title: ev.target.value })} required />
            <Select label="Type" value={e.type ?? "zip"} onChange={(ev) => crud.setEditing({ ...e, type: ev.target.value as ResourceType })} options={RESOURCE_TYPES} />
            <Input label="URL" value={e.url ?? ""} onChange={(ev) => crud.setEditing({ ...e, url: ev.target.value })} placeholder="https://t.me/your_channel/123 or https://…" />
            <Textarea label="Description" rows={3} value={e.description ?? ""} onChange={(ev) => crud.setEditing({ ...e, description: ev.target.value })} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!crud.deleting} title="Delete resource?" onConfirm={crud.confirmDelete} onClose={() => crud.setDeleting(null)} confirmLabel="Delete" />
    </>
  );
}
