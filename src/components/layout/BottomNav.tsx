import { NavLink } from "react-router-dom";
import { Bookmark, GraduationCap, Home, Library } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const BASE_TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/courses", label: "Courses", icon: Library, end: false },
  { to: "/categories", label: "Categories", icon: GraduationCap, end: false },
];

const AUTH_TABS = [
  { to: "/bookmarks", label: "Saved", icon: Bookmark, end: false },
];

export function BottomNav() {
  const { isAuthenticated } = useAuth();
  const tabs = [...BASE_TABS, ...(isAuthenticated ? AUTH_TABS : [])];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" aria-label="Mobile navigation" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      <div className="mx-auto flex max-w-[360px] items-center justify-center px-4 pb-2">
        <div className="liquid-glass-bar relative flex h-14 w-full items-center justify-around overflow-hidden rounded-2xl px-2">
          {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE bottom nav */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            {/* Ambient soft iridescent wash */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/35 via-purple-50/25 to-sky-100/30 opacity-100 dark:opacity-0" />

            {/* Liquid Blob 1: Left */}
            <div
              className="liquid-blob-anim-1 absolute -top-8 -left-8 h-28 w-28 rounded-full bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-purple-500/25 blur-[22px] dark:from-indigo-600/30 dark:via-violet-600/20 dark:to-purple-700/15"
            />
            {/* Liquid Blob 2: Right */}
            <div
              className="liquid-blob-anim-2 absolute -bottom-8 -right-8 h-28 w-32 rounded-full bg-gradient-to-r from-cyan-400/40 via-sky-500/30 to-blue-500/25 blur-[22px] dark:from-sky-500/30 dark:via-blue-600/20 dark:to-teal-500/15"
            />
            {/* Liquid Blob 3: Center */}
            <div
              className="liquid-blob-anim-3 absolute top-0 left-1/2 -translate-x-1/2 h-20 w-24 rounded-full bg-gradient-to-r from-fuchsia-500/30 to-pink-500/25 blur-[20px] dark:from-fuchsia-600/20 dark:to-pink-600/15"
            />
          </div>

          {/* Top specular reflection line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.2px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent" />

          {/* Shimmer sweep effect */}
          <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-35 dark:opacity-15" />

          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative z-10 flex flex-1 items-center justify-center rounded-xl px-3 py-2 transition-colors duration-150",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )
              }
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className={cn("text-[10px] leading-tight", isActive ? "font-semibold text-primary" : "font-medium")}>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
