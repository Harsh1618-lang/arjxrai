import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Download, ShieldAlert, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button, LinkButton, PageLoader } from "@/components/ui";
import { storage } from "@/lib/utils";

/* ------------------------------ Route guards ------------------------------ */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-zinc-500">You need administrator permissions to view this page.</p>
        <LinkButton to="/dashboard" className="mt-6">
          Go to dashboard
        </LinkButton>
      </div>
    );
  }
  return <>{children}</>;
}

/* ------------------------------ Scroll restore ---------------------------- */

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

/* ------------------------------ PWA install ------------------------------- */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "srd_install_dismissed";

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = storage.get<number>(INSTALL_DISMISS_KEY, 0);
    if (Date.now() - dismissedAt < 7 * 24 * 3600 * 1000) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !event) return null;

  const install = async () => {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome !== "accepted") storage.set(INSTALL_DISMISS_KEY, Date.now());
    setVisible(false);
  };

  const dismiss = () => {
    storage.set(INSTALL_DISMISS_KEY, Date.now());
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md animate-slide-up rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 sm:inset-x-auto sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Install the app</p>
          <p className="text-xs text-zinc-500">Add to your home screen for quick, offline-ready access.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-zinc-400 hover:text-zinc-600" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Offline banner ---------------------------- */

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">You are offline. Some content may be unavailable.</div>;
}
