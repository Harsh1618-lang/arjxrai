import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSettings } from "@/hooks/queries";
import { storage } from "@/lib/utils";
import type { ThemeSettings } from "@/types";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = "srd_theme_mode";

const RADIUS: Record<ThemeSettings["border_radius"], string> = {
  none: "0px",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
};

const FONTS: Record<ThemeSettings["font"], { family: string; google?: string }> = {
  Inter: { family: "'Inter', ui-sans-serif, system-ui, sans-serif", google: "Inter:wght@400;500;600;700;800" },
  Poppins: { family: "'Poppins', ui-sans-serif, system-ui, sans-serif", google: "Poppins:wght@400;500;600;700;800" },
  Roboto: { family: "'Roboto', ui-sans-serif, system-ui, sans-serif", google: "Roboto:wght@400;500;700;900" },
  Nunito: { family: "'Nunito', ui-sans-serif, system-ui, sans-serif", google: "Nunito:wght@400;500;600;700;800" },
  System: { family: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
};

function systemMode(): Mode {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeSettings, mode: Mode) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary_color || "#4f46e5");
  root.style.setProperty("--secondary", theme.secondary_color || "#0ea5e9");
  root.style.setProperty("--radius", RADIUS[theme.border_radius] ?? RADIUS.lg);
  const font = FONTS[theme.font] ?? FONTS.Inter;
  root.style.setProperty("--font-family", font.family);
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = mode === "dark" ? "#000000" : theme.primary_color || "#4f46e5";

  if (font.google) {
    const id = "srd-font-link";
    const href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }

  if (theme.favicon) {
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    if (icon.href !== theme.favicon) icon.href = theme.favicon;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const [pref, setPref] = useState<Mode | null>(() => storage.get<Mode | null>(MODE_KEY, null));
  const [system, setSystem] = useState<Mode>(systemMode);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = () => setSystem(systemMode());
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const theme = settings?.theme;
  const mode: Mode = pref ?? (theme?.default_mode === "dark" ? "dark" : theme?.default_mode === "light" ? "light" : system);

  useEffect(() => {
    if (theme) applyTheme(theme, mode);
  }, [theme, mode]);

  const setMode = useCallback((m: Mode) => {
    setPref(m);
    storage.set(MODE_KEY, m);
  }, []);

  const toggle = useCallback(() => setMode(mode === "dark" ? "light" : "dark"), [mode, setMode]);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
