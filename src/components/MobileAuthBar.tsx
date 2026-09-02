import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function MobileAuthBar() {
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const registrationEnabled = settings?.general.registration_enabled ?? true;

  if (user || !registrationEnabled) return null;

  return (
    <div
      className="fixed left-0 right-0 z-30 mx-auto max-w-md px-4 md:hidden"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 8px))" }}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/90 p-2 shadow-lg backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/90">
        <Link
          to="/login"
          className={cn(
            "flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50",
            "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
          )}
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
