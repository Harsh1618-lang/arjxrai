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
      <div className="mx-auto flex max-w-[360px] items-center justify-center px-4">
        <div className="flex h-14 w-full items-center justify-around overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 px-2 shadow-[0_-2px_12px_0_rgba(31,38,135,0.06)] backdrop-blur-xl backdrop-saturate-150 dark:border-[#1f1f1f] dark:bg-black/90">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-1 items-center justify-center rounded-xl px-3 py-2 transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                )
              }
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5">
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className={cn("text-[10px] font-medium leading-tight", isActive && "font-semibold")}>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
