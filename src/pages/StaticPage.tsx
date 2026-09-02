import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, Mail, MessageCircle, Send } from "lucide-react";
import { Seo } from "@/lib/seo";
import { Markdown, parseFaq } from "@/lib/markdown";
import { useContact, usePage, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { TelegramIcon, YoutubeIcon } from "@/components/icons";
import { Button, Input, Skeleton, Textarea } from "@/components/ui";
import NotFound from "@/pages/NotFound";
import { cn, formatDate, isValidEmail } from "@/lib/utils";

export default function StaticPage({ slug: fixedSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = fixedSlug ?? params.slug;
  const { data: page, isLoading } = usePage(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-14 sm:px-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }
  if (!page || !page.is_published) return <NotFound />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      {slug !== "faq" && <Seo title={page.title} description={page.meta_description} type="article" />}
      {slug === "faq" ? <FaqView content={page.content} title={page.title} /> : <Markdown content={page.content} />}
      {slug === "contact" && <ContactExtras />}
      <p className="mt-12 border-t border-zinc-200 pt-4 text-xs text-zinc-400 dark:border-zinc-800">Last updated {formatDate(page.updated_at)}</p>
    </div>
  );
}

function FaqView({ content, title }: { content: string; title: string }) {
  const items = parseFaq(content);
  const [open, setOpen] = useState<number | null>(0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
  };
  return (
    <>
      <Seo title={title} jsonLd={jsonLd} />
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">Can't find an answer? Reach us on the Contact page.</p>
      <div className="mt-8 divide-y divide-zinc-200 rounded-[calc(var(--radius)+6px)] border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((item, i) => (
          <div key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
              <span className="font-medium">{item.question}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <div className="animate-fade-in px-5 pb-5">
                <Markdown content={item.answer} className="text-sm" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ContactExtras() {
  const { data: settings } = useSettings();
  const toast = useToast();
  const contact = useContact();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const email = settings?.general.contact_email || settings?.footer.email || "";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !isValidEmail(form.email) || form.message.trim().length < 10) {
      toast.error("Please fill in all fields (message at least 10 characters).");
      return;
    }
    try {
      await contact.mutateAsync({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() });
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      // Fall back to a mailto link if the backend is unreachable.
      const subject = encodeURIComponent(`[${settings?.general.site_name ?? "SRD Learn"}] Message from ${form.name}`);
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
      if (email) window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      toast.error("Could not send your message. Your email client was opened instead.");
    }
  };

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-5">
      <div className="space-y-3 md:col-span-2">
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-[var(--radius)] border border-zinc-200 p-4 transition hover:border-primary dark:border-zinc-800">
            <Mail className="h-5 w-5 text-primary" />
            <span className="min-w-0">
              <span className="block text-xs text-zinc-500">Email</span>
              <span className="block truncate text-sm font-medium">{email}</span>
            </span>
          </a>
        )}
        {settings?.general.telegram_channel && (
          <a href={settings.general.telegram_channel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[var(--radius)] border border-zinc-200 p-4 transition hover:border-primary dark:border-zinc-800">
            <TelegramIcon className="h-5 w-5 text-sky-500" />
            <span>
              <span className="block text-xs text-zinc-500">Telegram</span>
              <span className="block text-sm font-medium">Join the community</span>
            </span>
          </a>
        )}
        {settings?.general.youtube_channel && (
          <a href={settings.general.youtube_channel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[var(--radius)] border border-zinc-200 p-4 transition hover:border-primary dark:border-zinc-800">
            <YoutubeIcon className="h-5 w-5 text-red-500" />
            <span>
              <span className="block text-xs text-zinc-500">YouTube</span>
              <span className="block text-sm font-medium">Subscribe for lectures</span>
            </span>
          </a>
        )}
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-[calc(var(--radius)+6px)] border border-zinc-200 p-5 dark:border-zinc-800 md:col-span-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageCircle className="h-5 w-5 text-primary" /> Send a message
        </h2>
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} />
        <Button type="submit" className="w-full" loading={contact.isPending}>
          <Send className="h-4 w-4" /> {sent ? "Message sent ✓" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
