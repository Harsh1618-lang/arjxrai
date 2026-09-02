import { useEffect, useState, type ReactNode } from "react";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useCategories, useCourses, usePages, useSaveSettings, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Button, Card, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { downloadFile, getErrorMessage } from "@/lib/utils";
import type { MenuItem, SettingsSection, SiteSettings, Testimonial } from "@/types";

type FieldType = "text" | "textarea" | "url" | "number" | "toggle" | "select" | "color" | "image" | "links" | "testimonials" | "code";

interface Field {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface Group {
  title: string;
  description?: string;
  fields: Field[];
}

/* ------------------------------------------------------------------ */
/* Generic settings form                                               */
/* ------------------------------------------------------------------ */

function SettingsForm<K extends SettingsSection>({ section, groups, extra }: { section: K; groups: Group[]; extra?: (values: SiteSettings[K]) => ReactNode }) {
  const { data: settings } = useSettings();
  const save = useSaveSettings(section);
  const toast = useToast();
  const [values, setValues] = useState<SiteSettings[K] | null>(null);

  useEffect(() => {
    if (settings) setValues(settings[section]);
  }, [settings, section]);

  if (!values) return null;
  const v = values as unknown as Record<string, unknown>;
  const set = (key: string, value: unknown) => setValues({ ...(values as object), [key]: value } as unknown as SiteSettings[K]);

  const submit = async () => {
    try {
      await save.mutateAsync(values);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const renderField = (f: Field) => {
    const val = v[f.key];
    switch (f.type) {
      case "toggle":
        return <Toggle key={f.key} label={f.label} hint={f.hint} checked={!!val} onChange={(x) => set(f.key, x)} />;
      case "textarea":
        return <Textarea key={f.key} label={f.label} hint={f.hint} rows={3} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />;
      case "code":
        return <Textarea key={f.key} label={f.label} hint={f.hint} rows={6} className="font-mono text-xs" value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
      case "number":
        return <Input key={f.key} label={f.label} hint={f.hint} type="number" value={Number(val ?? 0)} onChange={(e) => set(f.key, Number(e.target.value))} />;
      case "select":
        return <Select key={f.key} label={f.label} hint={f.hint} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} options={f.options ?? []} />;
      case "color":
        return (
          <div key={f.key} className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.label}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={String(val ?? "#000000")} onChange={(e) => set(f.key, e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-transparent dark:border-zinc-700" />
              <Input value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} wrapperClassName="flex-1" />
            </div>
            {f.hint && <p className="text-xs text-zinc-500">{f.hint}</p>}
          </div>
        );
      case "image":
        return (
          <div key={f.key}>
            <Input label={f.label} hint={f.hint} type="url" value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? "https://…"} />
            {!!val && <img src={String(val)} alt="" className="mt-2 max-h-32 rounded-lg border border-zinc-200 object-contain dark:border-zinc-700" />}
          </div>
        );
      case "links":
        return <LinksEditor key={f.key} label={f.label} hint={f.hint} items={(val as MenuItem[]) ?? []} onChange={(items) => set(f.key, items)} />;
      case "testimonials":
        return <TestimonialsEditor key={f.key} items={(val as Testimonial[]) ?? []} onChange={(items) => set(f.key, items)} />;
      default:
        return <Input key={f.key} label={f.label} hint={f.hint} type={f.type === "url" ? "url" : "text"} value={String(val ?? "")} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />;
    }
  };

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <Card key={g.title} className="p-5">
          <h3 className="font-semibold">{g.title}</h3>
          {g.description && <p className="mt-0.5 text-xs text-zinc-500">{g.description}</p>}
          <div className="mt-4 space-y-4">{g.fields.map(renderField)}</div>
        </Card>
      ))}
      {extra?.(values)}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={submit} loading={save.isPending} size="lg" className="shadow-lg">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}

function LinksEditor({ label, hint, items, onChange }: { label: string; hint?: string; items: MenuItem[]; onChange: (i: MenuItem[]) => void }) {
  const update = (i: number, patch: Partial<MenuItem>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      {hint && <p className="mb-2 text-xs text-zinc-500">{hint}</p>}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" wrapperClassName="flex-1" />
            <Input value={it.href} onChange={(e) => update(i, { href: e.target.value })} placeholder="/path or https://…" wrapperClassName="flex-[1.5]" />
            <Button size="icon" variant="ghost" className="shrink-0 text-red-500" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => onChange([...items, { label: "", href: "/" }])}>
        <Plus className="h-4 w-4" /> Add link
      </Button>
    </div>
  );
}

function TestimonialsEditor({ items, onChange }: { items: Testimonial[]; onChange: (i: Testimonial[]) => void }) {
  const update = (i: number, patch: Partial<Testimonial>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Testimonials</p>
      <div className="space-y-3">
        {items.map((t, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <div className="flex gap-2">
              <Input value={t.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name" wrapperClassName="flex-1" />
              <Input value={t.role} onChange={(e) => update(i, { role: e.target.value })} placeholder="Role" wrapperClassName="flex-1" />
              <Button size="icon" variant="ghost" className="shrink-0 text-red-500" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea rows={2} value={t.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="What did they say?" />
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => onChange([...items, { name: "", role: "", text: "" }])}>
        <Plus className="h-4 w-4" /> Add testimonial
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page configs                                                        */
/* ------------------------------------------------------------------ */

export function HomeCms() {
  return (
    <div>
      <Seo title="Home page · Admin" noIndex />
      <PageHeader title="Home page" description="Control the hero banner, sections and testimonials." />
      <div className="space-y-8">
        <SettingsForm
          section="hero"
          groups={[
            {
              title: "Hero banner",
              fields: [
                { key: "title", label: "Hero title", type: "text" },
                { key: "subtitle", label: "Hero subtitle", type: "textarea" },
                { key: "image", label: "Hero image", type: "image" },
                { key: "cta_text", label: "Primary button text", type: "text" },
                { key: "cta_link", label: "Primary button link", type: "text", placeholder: "/courses" },
                { key: "secondary_cta_text", label: "Secondary button text", type: "text" },
                { key: "secondary_cta_link", label: "Secondary button link", type: "text" },
              ],
            },
          ]}
        />
        <SettingsForm
          section="home"
          groups={[
            {
              title: "Sections",
              description: "Toggle sections and how many courses each one shows.",
              fields: [
                { key: "show_categories", label: "Show categories", type: "toggle" },
                { key: "show_featured", label: "Show featured courses", type: "toggle" },
                { key: "featured_limit", label: "Featured limit", type: "number" },
                { key: "show_latest", label: "Show latest courses", type: "toggle" },
                { key: "latest_limit", label: "Latest limit", type: "number" },
                { key: "show_popular", label: "Show popular courses", type: "toggle" },
                { key: "popular_limit", label: "Popular limit", type: "number" },
                { key: "show_testimonials", label: "Show testimonials", type: "toggle" },
              ],
            },
            { title: "Testimonials", fields: [{ key: "testimonials", label: "Testimonials", type: "testimonials" }] },
          ]}
        />
      </div>
    </div>
  );
}

export function NavigationCms() {
  return (
    <div>
      <Seo title="Navigation · Admin" noIndex />
      <PageHeader title="Navigation" description="Logo, menu, social links and the announcement bar." />
      <SettingsForm
        section="navigation"
        groups={[
          { title: "Branding", fields: [{ key: "logo", label: "Logo image URL", type: "image", hint: "Leave empty to use the default icon. Website name is set in Settings." }] },
          { title: "Menu", fields: [{ key: "menu", label: "Menu items", type: "links", hint: "Internal paths (e.g. /courses) or external URLs." }] },
          {
            title: "Social links",
            fields: [
              { key: "social_telegram", label: "Telegram", type: "url" },
              { key: "social_youtube", label: "YouTube", type: "url" },
              { key: "social_github", label: "GitHub", type: "url" },
              { key: "social_twitter", label: "Twitter / X", type: "url" },
            ],
          },
          {
            title: "Announcement bar",
            fields: [
              { key: "announcement_enabled", label: "Enabled", type: "toggle" },
              { key: "announcement_text", label: "Text", type: "text" },
              { key: "announcement_link", label: "Link", type: "text" },
              { key: "announcement_link_text", label: "Link text", type: "text" },
            ],
          },
        ]}
      />
    </div>
  );
}

export function FooterCms() {
  return (
    <div>
      <Seo title="Footer · Admin" noIndex />
      <PageHeader title="Footer" description="About text, contact details, links and copyright." />
      <SettingsForm
        section="footer"
        groups={[
          {
            title: "Content",
            fields: [
              { key: "about", label: "About text", type: "textarea" },
              { key: "contact", label: "Contact text", type: "textarea" },
              { key: "copyright", label: "Copyright", type: "text", hint: "Use {year} for the current year." },
            ],
          },
          {
            title: "Contact & social",
            fields: [
              { key: "email", label: "Email", type: "text" },
              { key: "telegram", label: "Telegram", type: "url" },
              { key: "youtube", label: "YouTube", type: "url" },
              { key: "github", label: "GitHub", type: "url" },
            ],
          },
          {
            title: "Links",
            fields: [
              { key: "links", label: "Quick links", type: "links" },
              { key: "show_privacy", label: "Show Privacy Policy link", type: "toggle" },
              { key: "show_terms", label: "Show Terms link", type: "toggle" },
            ],
          },
        ]}
      />
    </div>
  );
}

export function SeoCms() {
  const { data: courses = [] } = useCourses();
  const { data: categories = [] } = useCategories();
  const { data: pages = [] } = usePages();
  const { data: settings } = useSettings();

  const buildSitemap = () => {
    const base = (settings?.seo.canonical_url || settings?.general.domain || window.location.origin).replace(/\/$/, "");
    const urls = [
      { loc: "/", priority: "1.0" },
      { loc: "/courses", priority: "0.9" },
      { loc: "/categories", priority: "0.7" },
      ...courses.map((c) => ({ loc: `/courses/${c.slug}`, priority: "0.8", lastmod: c.updated_at })),
      ...categories.map((c) => ({ loc: `/courses?category=${c.slug}`, priority: "0.6" })),
      ...pages.filter((p) => p.is_published).map((p) => ({ loc: `/${p.slug}`, priority: "0.5", lastmod: p.updated_at })),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${base}${u.loc.replace(/&/g, "&amp;")}</loc>${"lastmod" in u && u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ""}<priority>${u.priority}</priority></url>`)
      .join("\n")}\n</urlset>`;
  };

  return (
    <div>
      <Seo title="SEO · Admin" noIndex />
      <PageHeader title="SEO" description="Meta tags, Open Graph, canonical URL, robots.txt and sitemap." />
      <SettingsForm
        section="seo"
        groups={[
          {
            title: "Meta tags",
            fields: [
              { key: "site_title", label: "Site title (home page)", type: "text" },
              { key: "title_template", label: "Title template", type: "text", hint: "%s is replaced by the page title." },
              { key: "meta_description", label: "Meta description", type: "textarea" },
              { key: "keywords", label: "Keywords", type: "text", hint: "Comma separated." },
            ],
          },
          {
            title: "Social sharing",
            fields: [
              { key: "og_image", label: "Default OG image", type: "image", hint: "1200×630 recommended." },
              { key: "twitter_handle", label: "Twitter handle", type: "text", placeholder: "@yourhandle" },
            ],
          },
          {
            title: "Crawling",
            fields: [
              { key: "canonical_url", label: "Canonical base URL", type: "url", placeholder: "https://yourdomain.com" },
              { key: "sitemap_enabled", label: "Sitemap enabled", type: "toggle" },
              { key: "robots_txt", label: "robots.txt", type: "code" },
            ],
          },
        ]}
        extra={(v) => (
          <Card className="p-5">
            <h3 className="font-semibold">Generate files</h3>
            <p className="mt-0.5 text-xs text-zinc-500">Download and place these in your project's /public folder (or serve them from your host).</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadFile("robots.txt", v.robots_txt, "text/plain")}>
                <Download className="h-4 w-4" /> robots.txt
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadFile("sitemap.xml", buildSitemap(), "application/xml")}>
                <Download className="h-4 w-4" /> sitemap.xml ({courses.length + pages.length + 3} URLs)
              </Button>
            </div>
          </Card>
        )}
      />
    </div>
  );
}

export function ThemeCms() {
  return (
    <div>
      <Seo title="Theme · Admin" noIndex />
      <PageHeader title="Theme" description="Colors, typography, radius and default color mode. Changes apply instantly after saving." />
      <SettingsForm
        section="theme"
        groups={[
          {
            title: "Branding",
            fields: [
              { key: "logo", label: "Logo URL", type: "image", hint: "Overrides the navigation logo." },
              { key: "favicon", label: "Favicon URL", type: "image", hint: "PNG/SVG/ICO. Leave empty for the default." },
            ],
          },
          {
            title: "Colors",
            fields: [
              { key: "primary_color", label: "Primary color", type: "color" },
              { key: "secondary_color", label: "Secondary color", type: "color" },
            ],
          },
          {
            title: "Typography & shape",
            fields: [
              {
                key: "font",
                label: "Font",
                type: "select",
                options: ["Inter", "Poppins", "Roboto", "Nunito", "System"].map((f) => ({ value: f, label: f })),
              },
              {
                key: "border_radius",
                label: "Border radius",
                type: "select",
                options: [
                  { value: "none", label: "None" },
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                  { value: "xl", label: "Extra large" },
                ],
              },
              {
                key: "default_mode",
                label: "Default color mode",
                type: "select",
                options: [
                  { value: "system", label: "Follow system" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ],
              },
            ],
          },
        ]}
        extra={(v) => (
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Preview</h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 items-center rounded-[var(--radius)] px-4 text-sm font-medium text-white" style={{ backgroundColor: v.primary_color }}>
                Primary button
              </span>
              <span className="inline-flex h-10 items-center rounded-[var(--radius)] px-4 text-sm font-medium text-white" style={{ backgroundColor: v.secondary_color }}>
                Secondary
              </span>
              <span className="inline-flex h-10 items-center rounded-[var(--radius)] border px-4 text-sm" style={{ borderColor: v.primary_color, color: v.primary_color }}>
                Outline
              </span>
            </div>
          </Card>
        )}
      />
    </div>
  );
}

export function GeneralSettingsCms() {
  return (
    <div>
      <Seo title="Settings · Admin" noIndex />
      <PageHeader title="Settings" description="Website identity, contact channels, integrations and access control." />
      <SettingsForm
        section="general"
        groups={[
          {
            title: "Website",
            fields: [
              { key: "site_name", label: "Website name", type: "text" },
              { key: "tagline", label: "Tagline", type: "text" },
              { key: "domain", label: "Domain", type: "url", placeholder: "https://yourdomain.com" },
              { key: "contact_email", label: "Contact email", type: "text" },
            ],
          },
          {
            title: "Channels",
            fields: [
              { key: "telegram_channel", label: "Telegram channel", type: "url", hint: "Public channel link shown to students. Files are stored in your private channel." },
              { key: "youtube_channel", label: "YouTube channel", type: "url" },
            ],
          },
          {
            title: "Integrations",
            fields: [
              { key: "analytics_id", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXXXXX" },
              { key: "search_console", label: "Search Console verification token", type: "text" },
            ],
          },
          {
            title: "Access",
            fields: [
              { key: "registration_enabled", label: "Allow new registrations", type: "toggle" },
              { key: "maintenance_mode", label: "Maintenance mode", type: "toggle", hint: "Visitors see a maintenance screen; admins can still browse." },
              { key: "maintenance_message", label: "Maintenance message", type: "textarea" },
            ],
          },
        ]}
      />
    </div>
  );
}
