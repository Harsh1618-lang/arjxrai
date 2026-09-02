export { cn } from "@/utils/cn";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function truncate(text: string, max = 120): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function pluralize(n: number, word: string, plural = `${word}s`): string {
  return `${n} ${n === 1 ? word : plural}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Only allow safe URL schemes to prevent javascript: XSS vectors. */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  return /^(https?:\/\/|mailto:|tel:|tg:\/\/|\/(?!\/)|#)/i.test(url.trim());
}

export function safeUrl(url: string): string {
  return isSafeUrl(url) ? url.trim() : "#";
}

export function isExternal(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || /^(mailto|tel|tg):/i.test(url);
}

export type ParsedVideo =
  | { type: "youtube"; id: string }
  | { type: "telegram"; channel: string; post: string }
  | { type: "unknown" };

export function parseVideo(url: string): ParsedVideo {
  if (!url) return { type: "unknown" };
  const trimmed = url.trim();
  const yt =
    trimmed.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/) ||
    (/^[A-Za-z0-9_-]{11}$/.test(trimmed) ? [trimmed, trimmed] : null);
  if (yt) return { type: "youtube", id: yt[1] };
  const tg = trimmed.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]+)\/(\d+)/);
  if (tg) return { type: "telegram", channel: tg[1], post: tg[2] };
  return { type: "unknown" };
}

export function getEmbedUrl(url: string): string | null {
  const parsed = parseVideo(url);
  if (parsed.type === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${parsed.id}?rel=0&modestbranding=1`;
  }
  if (parsed.type === "telegram") {
    return `https://t.me/${parsed.channel}/${parsed.post}?embed=1&mode=tme`;
  }
  return null;
}

export function youtubeThumb(url: string): string | null {
  const parsed = parseVideo(url);
  return parsed.type === "youtube" ? `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg` : null;
}

export function isTelegramLink(url: string): boolean {
  return /(^|\/\/)(www\.)?t\.me\//i.test(url) || /^tg:\/\//i.test(url);
}

export function contrastText(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length < 6) return "#111827";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or private mode */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return fallback;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "U";
}
