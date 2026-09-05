import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Retrieves environment variables safely, trimming whitespace and quotes,
 * and falling back to custom admin-configured credentials if present.
 */
function getCleanCredential(key: string): string | undefined {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(`srd_${key.toLowerCase()}`);
    if (custom && custom.trim()) return custom.trim();
  }
  const raw = import.meta.env[key] as string | undefined;
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, "");
}

export const configuredSupabaseUrl = getCleanCredential("VITE_SUPABASE_URL");
export const configuredSupabaseAnonKey = getCleanCredential("VITE_SUPABASE_ANON_KEY");

/**
 * Checks if the configured Supabase credentials are genuine values
 * and not template/placeholder values.
 */
export function isValidSupabaseConfig(u?: string, k?: string): boolean {
  if (!u || !k) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  const placeholderPatterns = [
    /YOUR[-_]PROJECT[-_]REF/i,
    /YOUR[-_]SUPABASE[-_]ANON[-_]KEY/i,
    /<.*>/,
    /example\.supabase\.co/i,
    /your-domain\.com/i,
    /^YOUR_/i,
    /placeholder/i,
  ];
  return !placeholderPatterns.some((p) => p.test(u) || p.test(k));
}

/**
 * Supabase client (production). Configured with real-time websocket support.
 */
export const supabase: SupabaseClient | null =
  isValidSupabaseConfig(configuredSupabaseUrl, configuredSupabaseAnonKey)
    ? createClient(configuredSupabaseUrl!, configuredSupabaseAnonKey!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: {
          params: {
            eventsPerSecond: 20,
          },
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

export function saveCustomCredentials(url: string, anonKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("srd_vite_supabase_url", url.trim());
  localStorage.setItem("srd_vite_supabase_anon_key", anonKey.trim());
  window.location.reload();
}

export function resetCustomCredentials() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("srd_vite_supabase_url");
  localStorage.removeItem("srd_vite_supabase_anon_key");
  window.location.reload();
}

/**
 * Invoke a Supabase Edge Function by name.
 * Used for server-side tasks (contact/notifications, newsletter, rate-limiting).
 * Throws on failure so callers can fall back to direct DB inserts.
 */
export async function callFunction<T = unknown>(name: string, body: unknown): Promise<T> {
  if (!supabase || !configuredSupabaseUrl || !isValidSupabaseConfig(configuredSupabaseUrl, configuredSupabaseAnonKey)) {
    throw new Error("Supabase is not configured");
  }
  const res = await fetch(`${configuredSupabaseUrl.replace(/\/$/, "")}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${configuredSupabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text.slice(0, 200) || `Edge function "${name}" failed (${res.status})`);
  }
  return (await res.json()) as T;
}
