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
      className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      <div className="relative mx-auto flex h-14 max-w-md animate-slide-up items-stretch rounded-full border border-zinc-200/70 bg-white/80 px-2 shadow-[0_6px_24px_-10px_rgba(15,23,42,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.7)]">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"} className="relative flex flex-1 flex-col items-center justify-center transition-transform duration-150 active:scale-90">
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
