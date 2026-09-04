}
  if (parsed.type === "telegram") {
    return https://t.me/${parsed.channel}/${parsed.post}?embed=1&mode=tme;
  }
  if (parsed.type === "gdrive") {
    return https://drive.google.com/file/d/${parsed.id}/preview;
  }
  if (parsed.type === "bunny") {
    return https://iframe.mediadelivery.net/embed/${parsed.library}/${parsed.video};
  }
  return null;
}

export function youtubeThumb(url: string): string | null {
  const parsed = parseVideo(url);
  return parsed.type === "youtube" ? https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg : null;
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