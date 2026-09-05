import { NavLink } from "react-router-dom";
import { BookOpen, FolderTree, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/categories", label: "Categories", icon: FolderTree },
];

/**
 * App-style bottom navigation — mobile only (< md).
 * Labels + icons (recognition over recall), active pill + top indicator,
 * safe-area padding for notched phones, glass finish matching the navbar.
 */
export function BottomTabs() {
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 px-3 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      <div className="liquid-glass-bar relative mx-auto flex h-14 max-w-md animate-slide-up items-stretch overflow-hidden rounded-full px-2">
        {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE bottom nav */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
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

        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === "/"} className="relative z-10 flex flex-1 flex-col items-center justify-center transition-transform duration-150 active:scale-90">
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0 h-[3px] w-8 rounded-full bg-primary transition-all duration-300",
                      isActive ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "flex h-7 w-11 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-primary/30 dark:bg-primary/15"
                        : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    <t.icon className="h-5 w-5" />
                  </span>
                  <span className={cn("mt-0.5 text-[11px] font-medium leading-none transition-colors duration-200", isActive ? "text-primary" : "text-zinc-500 dark:text-zinc-400")}>
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
      </div>
    </nav>
  );
}
