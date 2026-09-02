import { db } from "@/services/adapter";
import { DEFAULT_SETTINGS } from "@/data/seed";
import { callFunction } from "@/lib/supabase";
import { isTelegramLink, slugify, uid } from "@/lib/utils";
import type {
  ActivityLog,
  BackupPayload,
  Bookmark,
  Category,
  ContactMessage,
  Course,
  CourseWithMeta,
  LatestUpload,
  Lesson,
  LessonProgress,
  MediaItem,
  NewsletterSubscriber,
  Page,
  Pdf,
  Profile,
  Resource,
  SettingsSection,
  SiteSettings,
  Stats,
} from "@/types";

let actorEmail = "system";
export function setActor(email: string | null | undefined) {
  actorEmail = email || "system";
}

async function log(action: string, entity: string, details: string) {
  try {
    await db.upsert<ActivityLog>("activity_logs", { action, entity, details, user_email: actorEmail });
  } catch {
    /* logging must never break the main flow */
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

interface SettingRow {
  key: string;
  value: unknown;
}

function mergeSettings(rows: SettingRow[]): SiteSettings {
  const merged = (typeof structuredClone === "function" ? structuredClone(DEFAULT_SETTINGS) : (JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SiteSettings)) as SiteSettings;
  for (const row of rows) {
    const key = row.key as SettingsSection;
    if (key in merged && row.value && typeof row.value === "object") {
      merged[key] = { ...merged[key], ...(row.value as object) } as never;
    }
  }
  return merged;
}

export const settingsApi = {
  async get(): Promise<SiteSettings> {
    const rows = await db.list<SettingRow>("settings");
    return mergeSettings(rows);
  },
  async save<K extends SettingsSection>(section: K, value: SiteSettings[K]): Promise<void> {
    await db.upsert<SettingRow & Record<string, unknown>>("settings", { key: section, value }, "key");
    await log("update", "settings", `Updated ${section} settings`);
  },
};

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const categoriesApi = {
  list: () => db.list<Category>("categories", { orderBy: "sort_order" }),
  async save(input: Partial<Category>): Promise<Category> {
    const row = { ...input, slug: input.slug?.trim() || slugify(input.name ?? "") };
    const saved = await db.upsert<Category>("categories", row);
    await log(input.id ? "update" : "create", "category", `${input.id ? "Updated" : "Created"} category “${saved.name}”`);
    return saved;
  },
  async remove(id: string) {
    await db.remove("categories", id);
    await log("delete", "category", `Deleted category ${id}`);
  },
};

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */

function countBy(rows: { course_id: string }[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.course_id, (map.get(r.course_id) ?? 0) + 1);
  return map;
}

export const coursesApi = {
  async list(opts: { includeDrafts?: boolean } = {}): Promise<CourseWithMeta[]> {
    const [courses, categories, lessons, pdfs, resources] = await Promise.all([
      db.list<Course>("courses", { orderBy: "created_at", ascending: false }),
      db.list<Category>("categories"),
      db.list<{ course_id: string }>("lessons", { columns: "course_id" }),
      db.list<{ course_id: string }>("pdfs", { columns: "course_id" }),
      db.list<{ course_id: string }>("resources", { columns: "course_id" }),
    ]);
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const lc = countBy(lessons);
    const pc = countBy(pdfs);
    const rc = countBy(resources);
    return courses
      .filter((c) => opts.includeDrafts || c.status === "published")
      .map((c) => ({
        ...c,
        tags: Array.isArray(c.tags) ? c.tags : [],
        views: Number(c.views) || 0,
        category: c.category_id ? catMap.get(c.category_id) ?? null : null,
        lesson_count: lc.get(c.id) ?? 0,
        pdf_count: pc.get(c.id) ?? 0,
        resource_count: rc.get(c.id) ?? 0,
      }));
  },
  async getBySlug(slug: string): Promise<CourseWithMeta | null> {
    const all = await coursesApi.list({ includeDrafts: true });
    return all.find((c) => c.slug === slug) ?? null;
  },
  async getById(id: string): Promise<Course | null> {
    return db.getOne<Course>("courses", { id });
  },
  async content(courseId: string): Promise<{ lessons: Lesson[]; pdfs: Pdf[]; resources: Resource[] }> {
    const [lessons, pdfs, resources] = await Promise.all([
      db.list<Lesson>("lessons", { where: { course_id: courseId }, orderBy: "sort_order" }),
      db.list<Pdf>("pdfs", { where: { course_id: courseId }, orderBy: "sort_order" }),
      db.list<Resource>("resources", { where: { course_id: courseId }, orderBy: "sort_order" }),
    ]);
    return { lessons, pdfs, resources };
  },
  async save(input: Partial<Course>): Promise<Course> {
    const row: Partial<Course> = {
      ...input,
      slug: input.slug?.trim() || slugify(input.title ?? ""),
      tags: (input.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    const saved = await db.upsert<Course>("courses", row);
    await log(input.id ? "update" : "create", "course", `${input.id ? "Updated" : "Created"} course “${saved.title}”`);
    return saved;
  },
  async remove(id: string) {
    const { lessons, pdfs, resources } = await coursesApi.content(id);
    await Promise.all([
      ...lessons.map((l) => db.remove("lessons", l.id)),
      ...pdfs.map((p) => db.remove("pdfs", p.id)),
      ...resources.map((r) => db.remove("resources", r.id)),
    ]);
    await db.remove("courses", id);
    await log("delete", "course", `Deleted course ${id}`);
  },
  incrementViews: (id: string) => db.incrementViews(id),
};

/* ------------------------------------------------------------------ */
/* Lessons / PDFs / Resources                                          */
/* ------------------------------------------------------------------ */

function contentApi<T extends { id: string; title: string; course_id: string }>(table: string, label: string) {
  return {
    list: (courseId: string) => db.list<T>(table, { where: { course_id: courseId }, orderBy: "sort_order" }),
    async save(input: Partial<T>): Promise<T> {
      const saved = await db.upsert<T>(table, input);
      await log(input.id ? "update" : "create", label, `${input.id ? "Updated" : "Added"} ${label} “${saved.title}”`);
      return saved;
    },
    async remove(id: string) {
      await db.remove(table, id);
      await log("delete", label, `Deleted ${label} ${id}`);
    },
    async reorder(items: T[]) {
      await Promise.all(items.map((it, i) => db.upsert<T>(table, { id: it.id, sort_order: i + 1 } as unknown as Partial<T>)));
    },
  };
}

export const lessonsApi = contentApi<Lesson>("lessons", "lesson");
export const pdfsApi = contentApi<Pdf>("pdfs", "pdf");
export const resourcesApi = contentApi<Resource>("resources", "resource");

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export const pagesApi = {
  list: () => db.list<Page>("pages", { orderBy: "title" }),
  get: (slug: string) => db.getOne<Page>("pages", { slug }),
  async save(input: Partial<Page>): Promise<Page> {
    const saved = await db.upsert<Page>("pages", { ...input, slug: input.slug?.trim() || slugify(input.title ?? ""), updated_at: new Date().toISOString() });
    await log(input.id ? "update" : "create", "page", `${input.id ? "Updated" : "Created"} page “${saved.title}”`);
    return saved;
  },
  async remove(id: string) {
    await db.remove("pages", id);
    await log("delete", "page", `Deleted page ${id}`);
  },
};

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const usersApi = {
  list: () => db.list<Profile>("profiles", { orderBy: "created_at", ascending: false }),
  async update(id: string, patch: Partial<Profile>): Promise<Profile> {
    const saved = await db.upsert<Profile>("profiles", { id, ...patch });
    await log("update", "user", `Updated user ${saved.email}`);
    return saved;
  },
  async remove(id: string) {
    await db.remove("profiles", id);
    await log("delete", "user", `Deleted user ${id}`);
  },
};

/* ------------------------------------------------------------------ */
/* Media & Logs                                                        */
/* ------------------------------------------------------------------ */

export const mediaApi = {
  list: () => db.list<MediaItem>("media", { orderBy: "created_at", ascending: false }),
  async add(input: Partial<MediaItem>): Promise<MediaItem> {
    const saved = await db.upsert<MediaItem>("media", input);
    await log("create", "media", `Added media “${saved.name}”`);
    return saved;
  },
  async remove(id: string) {
    await db.remove("media", id);
  },
};

export const logsApi = {
  list: (limit = 100) => db.list<ActivityLog>("activity_logs", { orderBy: "created_at", ascending: false, limit }),
  async clear() {
    await db.replaceAll("activity_logs", []);
  },
};

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export const statsApi = {
  async get(): Promise<Stats> {
    const [users, courses, lessons, pdfs, resources, categories] = await Promise.all([
      db.list<Profile>("profiles"),
      db.list<Course>("courses"),
      db.list<Lesson>("lessons"),
      db.list<Pdf>("pdfs"),
      db.list<Resource>("resources"),
      db.list<Category>("categories"),
    ]);
    const courseTitle = new Map(courses.map((c) => [c.id, c.title]));
    const uploads: LatestUpload[] = [
      ...courses.map((c) => ({ id: c.id, type: "course" as const, title: c.title, course_title: "", created_at: c.created_at })),
      ...lessons.map((l) => ({ id: l.id, type: "lesson" as const, title: l.title, course_title: courseTitle.get(l.course_id) ?? "", created_at: l.created_at })),
      ...pdfs.map((p) => ({ id: p.id, type: "pdf" as const, title: p.title, course_title: courseTitle.get(p.course_id) ?? "", created_at: p.created_at })),
      ...resources.map((r) => ({ id: r.id, type: "resource" as const, title: r.title, course_title: courseTitle.get(r.course_id) ?? "", created_at: r.created_at })),
    ]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 8);
    const telegramFiles = [...pdfs.map((p) => p.file_url), ...resources.map((r) => r.url), ...lessons.filter((l) => l.video_type === "telegram").map((l) => l.video_url)].filter(isTelegramLink).length;
    return {
      users: users.length,
      courses: courses.length,
      published: courses.filter((c) => c.status === "published").length,
      drafts: courses.filter((c) => c.status === "draft").length,
      videos: lessons.length,
      pdfs: pdfs.length,
      resources: resources.length,
      categories: categories.length,
      total_views: courses.reduce((s, c) => s + (Number(c.views) || 0), 0),
      telegram_files: telegramFiles,
      top_courses: [...courses].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((c) => ({ title: c.title, slug: c.slug, views: c.views || 0 })),
      latest_uploads: uploads,
    };
  },
};

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */

const BACKUP_TABLES = ["settings", "categories", "courses", "lessons", "pdfs", "resources", "pages", "media", "activity_logs", "bookmarks", "lesson_progress", "contact_messages", "newsletter_subscribers"];

export const backupApi = {
  async exportAll(): Promise<BackupPayload> {
    const tables: Record<string, unknown[]> = {};
    for (const t of BACKUP_TABLES) tables[t] = await db.list(t);
    tables.profiles = await db.list("profiles");
    return { version: 1, exported_at: new Date().toISOString(), tables };
  },
  async importAll(payload: BackupPayload): Promise<void> {
    if (!payload || payload.version !== 1 || typeof payload.tables !== "object") throw new Error("Invalid backup file");
    for (const t of BACKUP_TABLES) {
      const rows = payload.tables[t];
      if (Array.isArray(rows)) await db.replaceAll(t, rows);
    }
    await log("import", "backup", "Imported database backup");
  },
};

/* ------------------------------------------------------------------ */
/* Bookmarks (saved courses per user)                                  */
/* ------------------------------------------------------------------ */

export const bookmarksApi = {
  list: (userId: string) => db.list<Bookmark>("bookmarks", { where: { user_id: userId }, orderBy: "created_at", ascending: false }),
  /** Toggles a bookmark; returns the new bookmarked state. */
  async toggle(userId: string, courseId: string): Promise<boolean> {
    const existing = await db.getOne<Bookmark>("bookmarks", { user_id: userId, course_id: courseId });
    if (existing) {
      await db.remove("bookmarks", existing.id);
      return false;
    }
    await db.upsert<Bookmark>("bookmarks", { id: uid(), user_id: userId, course_id: courseId });
    return true;
  },
};

/* ------------------------------------------------------------------ */
/* Lesson progress (completed lessons per user)                        */
/* ------------------------------------------------------------------ */

export const progressApi = {
  list: (userId: string, courseId?: string) =>
    db.list<LessonProgress>("lesson_progress", { where: courseId ? { user_id: userId, course_id: courseId } : { user_id: userId } }),
  /** Toggles a lesson's completion; returns the new completed state. */
  async toggle(userId: string, lessonId: string, courseId: string): Promise<boolean> {
    const existing = await db.getOne<LessonProgress>("lesson_progress", { user_id: userId, lesson_id: lessonId });
    if (existing) {
      await db.remove("lesson_progress", existing.id);
      return false;
    }
    await db.upsert<LessonProgress>("lesson_progress", { id: uid(), user_id: userId, lesson_id: lessonId, course_id: courseId, completed_at: new Date().toISOString() });
    return true;
  },
};

/* ------------------------------------------------------------------ */
/* Contact & newsletter (server-side via Edge Functions when available) */
/* ------------------------------------------------------------------ */

export const contactApi = {
  async submit(input: { name: string; email: string; message: string }): Promise<void> {
    try {
      await callFunction("contact", { ...input, subject: `New message from ${input.name}` });
      return;
    } catch {
      /* Edge Function not deployed — fall back to a direct insert (still RLS-gated). */
    }
    await db.upsert<ContactMessage>("contact_messages", { id: uid(), name: input.name, email: input.email, message: input.message, subject: "", is_read: false });
  },
};

export const newsletterApi = {
  async subscribe(email: string): Promise<void> {
    try {
      await callFunction("newsletter", { email });
      return;
    } catch {
      /* fall back to direct insert */
    }
    await db.upsert<NewsletterSubscriber>("newsletter_subscribers", { id: uid(), email: email.toLowerCase() });
  },
};
