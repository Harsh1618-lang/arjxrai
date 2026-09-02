import { useMemo, useState } from "react";
import { Copy, ExternalLink, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useMedia } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { TelegramIcon } from "@/components/icons";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select } from "@/components/ui";
import { cn, copyToClipboard, formatDate, getErrorMessage, isSafeUrl, isTelegramLink } from "@/lib/utils";
import type { MediaItem, MediaType } from "@/types";

const TYPES: { value: MediaType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "logo", label: "Logos" },
  { value: "banner", label: "Banners" },
  { value: "thumbnail", label: "Thumbnails" },
  { value: "telegram", label: "Telegram links" },
];

export default function MediaManager() {
  const { data: media = [], isLoading } = useMedia();
  const add = mutations.useAddMedia();
  const remove = mutations.useDeleteMedia();
  const toast = useToast();
  const [filter, setFilter] = useState<MediaType | "all">("all");
  const [adding, setAdding] = useState<Partial<MediaItem> | null>(null);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);

  const filtered = useMemo(() => media.filter((m) => filter === "all" || m.type === filter), [media, filter]);

  const submit = async () => {
    if (!adding?.name?.trim()) return toast.error("Name is required.");
    if (!isSafeUrl(adding.url ?? "")) return toast.error("Enter a valid URL.");
    try {
      await add.mutateAsync(adding);
      toast.success("Media added");
      setAdding(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const copy = async (url: string) => {
    (await copyToClipboard(url)) ? toast.success("URL copied") : toast.error("Could not copy");
  };

  return (
    <div>
      <Seo title="Media · Admin" noIndex />
      <PageHeader
        title="Media manager"
        description="Images, logos, banners, thumbnails and Telegram file links used across the site."
        actions={
          <Button onClick={() => setAdding({ name: "", url: "", type: "image" })}>
            <Plus className="h-4 w-4" /> Add media
          </Button>
        }
      />

      <Card className="mb-5 flex items-start gap-3 border-sky-200 bg-sky-50/60 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/30">
        <TelegramIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
        <div>
          <p className="font-medium">How storage works</p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            Upload PDFs, ZIPs and images to your <b>private Telegram channel</b>, copy the post link (e.g. <code>https://t.me/c/123456/78</code> or <code>https://t.me/channel/78</code>) and save it here. The database only stores links — zero hosting cost.
          </p>
        </div>
      </Card>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-[var(--radius)] bg-zinc-100 p-1 dark:bg-zinc-800 sm:inline-flex">
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)} className={cn("whitespace-nowrap rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium", filter === t.value ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500")}>
            {t.label}
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState icon={<ImageIcon className="h-10 w-10" />} title="No media yet" description="Add image URLs or Telegram links to reuse them across courses." />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => {
            const tg = m.type === "telegram" || isTelegramLink(m.url);
            return (
              <div key={m.id} className="group overflow-hidden rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  {tg ? <TelegramIcon className="h-10 w-10 text-sky-500" /> : <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={m.name}>
                    {m.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge className="capitalize">{m.type}</Badge>
                    <span className="text-[11px] text-zinc-400">{formatDate(m.created_at)}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => copy(m.url)}>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700" title="Open">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setDeleting(m)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add media"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdding(null)}>Cancel</Button>
            <Button onClick={submit} loading={add.isPending}>Add</Button>
          </>
        }
      >
        {adding && (
          <div className="space-y-4">
            <Input label="Name" value={adding.name ?? ""} onChange={(e) => setAdding({ ...adding, name: e.target.value })} required />
            <Select label="Type" value={adding.type ?? "image"} onChange={(e) => setAdding({ ...adding, type: e.target.value as MediaType })} options={TYPES.filter((t) => t.value !== "all") as { value: string; label: string }[]} />
            <Input label="URL" value={adding.url ?? ""} onChange={(e) => setAdding({ ...adding, url: e.target.value })} placeholder="https://… or https://t.me/channel/123" />
            {adding.url && adding.type !== "telegram" && isSafeUrl(adding.url) && <img src={adding.url} alt="" className="max-h-40 rounded-lg border border-zinc-200 object-contain dark:border-zinc-700" />}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title={`Remove “${deleting?.name}”?`} description="This only removes the saved link, not the file on Telegram." confirmLabel="Remove" loading={remove.isPending} onConfirm={async () => {
        if (!deleting) return;
        await remove.mutateAsync(deleting.id).catch((e) => toast.error(getErrorMessage(e)));
        setDeleting(null);
      }} onClose={() => setDeleting(null)} />
    </div>
  );
}
