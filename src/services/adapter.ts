import { SEED_TABLES } from "@/data/seed";
import { supabase } from "@/lib/supabase";
import { uid } from "@/lib/utils";

export interface ListOptions {
  where?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  columns?: string;
}

type Row = Record<string, unknown>;

export interface DataAdapter {
  readonly mode: "supabase" | "local";
  list<T>(table: string, opts?: ListOptions): Promise<T[]>;
  getOne<T>(table: string, where: Record<string, unknown>): Promise<T | null>;
  upsert<T extends object>(table: string, row: Partial<T>, conflictKey?: string): Promise<T>;
  remove(table: string, id: string, key?: string): Promise<void>;
  replaceAll<T>(table: string, rows: T[]): Promise<void>;
  incrementViews(courseId: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Local adapter — used when Supabase is not configured                */
/* ------------------------------------------------------------------ */

export const PREFIX = "srd_db_";
export const DB_CHANGE_EVENT = "srd_db_change";
export const DB_SYNC_CHANNEL = "srd_sync_channel";

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    syncChannel = new BroadcastChannel(DB_SYNC_CHANNEL);
  } catch {
    syncChannel = null;
  }
}

/**
 * Notifies all tabs, windows, and in-memory listeners that a table has changed.
 */
export function notifyDbChange(table: string) {
  if (typeof window === "undefined") return;
  const timestamp = Date.now();
  try {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { table, timestamp } }));
  } catch {
    /* ignore */
  }
  try {
    syncChannel?.postMessage({ table, timestamp });
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem("srd_last_sync", `${table}:${timestamp}`);
  } catch {
    /* ignore */
  }
}

/**
 * Subscribes to real-time database modifications from any tab or window.
 */
export function subscribeToDbChanges(callback: (table: string) => void) {
  if (typeof window === "undefined") return () => {};

  const handleCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ table: string }>).detail;
    if (detail?.table) callback(detail.table);
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX) || e.key === "srd_last_sync") {
      const table = e.key.replace(PREFIX, "").split(":")[0];
      callback(table || "all");
    }
  };

  const handleBroadcast = (e: MessageEvent<{ table?: string }>) => {
    if (e.data?.table) callback(e.data.table);
  };

  window.addEventListener(DB_CHANGE_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  syncChannel?.addEventListener("message", handleBroadcast);

  return () => {
    window.removeEventListener(DB_CHANGE_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
    syncChannel?.removeEventListener("message", handleBroadcast);
  };
}

class LocalAdapter implements DataAdapter {
  readonly mode = "local" as const;

  private read<T>(table: string): T[] {
    try {
      const raw = localStorage.getItem(PREFIX + table);
      if (raw) return JSON.parse(raw) as T[];
    } catch {
      /* fallthrough to seed */
    }
    const seed = (SEED_TABLES[table] ?? []) as T[];
    this.write(table, seed, false);
    return seed;
  }

  private write<T>(table: string, rows: T[], notify = true) {
    try {
      localStorage.setItem(PREFIX + table, JSON.stringify(rows));
      if (notify) {
        notifyDbChange(table);
      }
    } catch {
      /* ignore quota errors */
    }
  }

  async list<T>(table: string, opts: ListOptions = {}): Promise<T[]> {
    let rows = this.read<Row>(table);
    if (opts.where) {
      const entries = Object.entries(opts.where);
      rows = rows.filter((r) => entries.every(([k, v]) => r[k] === v));
    }
    if (opts.orderBy) {
      const key = opts.orderBy;
      const dir = opts.ascending === false ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = a[key] as string | number | undefined;
        const bv = b[key] as string | number | undefined;
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        return (av < bv ? -1 : 1) * dir;
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows as T[];
  }

  async getOne<T>(table: string, where: Record<string, unknown>): Promise<T | null> {
    const rows = await this.list<T>(table, { where, limit: 1 });
    return rows[0] ?? null;
  }

  async upsert<T extends object>(table: string, row: Partial<T>, conflictKey = "id"): Promise<T> {
    const rows = this.read<Row>(table);
    const keyValue = (row as Row)[conflictKey];
    const idx = keyValue ? rows.findIndex((r) => r[conflictKey] === keyValue) : -1;
    const now = new Date().toISOString();
    if (idx >= 0) {
      const merged = { ...rows[idx], ...row, updated_at: now } as Row;
      rows[idx] = merged;
      this.write(table, rows);
      return merged as T;
    }
    const created = {
      created_at: now,
      updated_at: now,
      ...row,
      [conflictKey]: keyValue || uid(),
    } as Row;
    rows.push(created);
    this.write(table, rows);
    return created as T;
  }

  async remove(table: string, id: string, key = "id"): Promise<void> {
    const rows = this.read<Row>(table).filter((r) => r[key] !== id);
    this.write(table, rows);
  }

  async replaceAll<T>(table: string, rows: T[]): Promise<void> {
    this.write(table, rows);
  }

  async incrementViews(courseId: string): Promise<void> {
    const rows = this.read<Row>("courses");
    const idx = rows.findIndex((r) => r.id === courseId);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], views: Number(rows[idx].views ?? 0) + 1 };
      this.write("courses", rows);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Supabase adapter                                                    */
/* ------------------------------------------------------------------ */

class SupabaseAdapter implements DataAdapter {
  readonly mode = "supabase" as const;

  private get client() {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase;
  }

  async list<T>(table: string, opts: ListOptions = {}): Promise<T[]> {
    let query = this.client.from(table).select(opts.columns ?? "*");
    if (opts.where) query = query.match(opts.where);
    if (opts.orderBy) query = query.order(opts.orderBy, { ascending: opts.ascending !== false });
    if (opts.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as T[];
  }

  async getOne<T>(table: string, where: Record<string, unknown>): Promise<T | null> {
    const { data, error } = await this.client.from(table).select("*").match(where).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as T) ?? null;
  }

  async upsert<T extends object>(table: string, row: Partial<T>, conflictKey = "id"): Promise<T> {
    const payload: Row = { ...(row as Row) };
    const keyValue = payload[conflictKey];
    if (!keyValue) delete payload[conflictKey];

    if (keyValue) {
      const { data, error } = await this.client.from(table).update(payload).eq(conflictKey, keyValue as string).select().maybeSingle();
      if (error) throw new Error(error.message);
      if (data) {
        notifyDbChange(table);
        return data as T;
      }
    }
    const { data, error } = await this.client.from(table).insert(payload).select().single();
    if (error) throw new Error(error.message);
    notifyDbChange(table);
    return data as T;
  }

  async remove(table: string, id: string, key = "id"): Promise<void> {
    const { error } = await this.client.from(table).delete().eq(key, id);
    if (error) throw new Error(error.message);
    notifyDbChange(table);
  }

  async replaceAll<T>(table: string, rows: T[]): Promise<void> {
    const key = table === "settings" ? "key" : "id";
    const { error: delError } = await this.client.from(table).delete().not(key, "is", null);
    if (delError) throw new Error(delError.message);
    if (rows.length) {
      const { error } = await this.client.from(table).insert(rows as Row[]);
      if (error) throw new Error(error.message);
    }
    notifyDbChange(table);
  }

  async incrementViews(courseId: string): Promise<void> {
    const { error } = await this.client.rpc("increment_course_views", { p_course_id: courseId });
    if (error) console.warn("increment views failed", error.message);
  }
}

export const db: DataAdapter = supabase ? new SupabaseAdapter() : new LocalAdapter();
export const isDemoMode = db.mode === "local";

// Set up Supabase Realtime channel to receive updates from other users or admin actions in real-time
if (supabase) {
  try {
    const channel = supabase.channel("srd_realtime_sync");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public" },
      (payload) => {
        if (payload?.table) {
          notifyDbChange(payload.table);
        }
      }
    );

    const coreTables = ["settings", "courses", "categories", "lessons", "pdfs", "resources", "pages", "media", "activity_logs"];
    for (const tbl of coreTables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tbl },
        () => {
          notifyDbChange(tbl);
        }
      );
    }

    channel.subscribe((status, err) => {
      if (err) {
        console.warn("[Supabase Realtime] subscription issue:", err);
      } else if (status === "SUBSCRIBED") {
        console.log("[Supabase Realtime] Connected and listening for real-time updates!");
      }
    });
  } catch (err) {
    console.warn("[Supabase Realtime] failed to start listener:", err);
  }
}
