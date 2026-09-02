import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client (production). It is created only when the required env vars
 * are present; otherwise the app shows a setup screen instead of loading.
 */
export const supabase: SupabaseClient | null =
  url && anonKey && /^https?:\/\//.test(url)
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

/**
 * Invoke a Supabase Edge Function by name.
 * Used for server-side tasks (contact/notifications, newsletter, rate-limiting).
 * Throws on failure so callers can fall back to direct DB inserts.
 */
export async function callFunction<T = unknown>(name: string, body: unknown): Promise<T> {
  if (!supabase || !url) throw new Error("Supabase is not configured");
  const res = await fetch(`${url.replace(/\/$/, "")}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 200) || `Edge function "${name}" failed (${res.status})`);
  }
  return (await res.json()) as T;
}
