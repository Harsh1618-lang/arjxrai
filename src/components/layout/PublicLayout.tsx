import { Suspense, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Construction, Megaphone, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { InstallPrompt, OfflineBanner, ScrollToTop } from "@/components/common";
import { PageLoader } from "@/components/ui";
import { useSettings } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { isExternal, safeUrl, storage } from "@/lib/utils";

function AnnouncementBar() {
  const { data: settings } = useSettings();
  const ann = settings?.navigation;
  const key = `srd_ann_${ann?.announcement_text?.slice(0, 40)}`;
  const [hidden, setHidden] = useState(() => storage.get<boolean>(key, false));
  if (!ann?.announcement_enabled || !ann.announcement_text || hidden) return null;
  const link = ann.announcement_link;
  return (
    <div className="relative bg-gradient-to-r from-primary to-secondary py-1.5 text-center text-xs text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-x-3 px-4 sm:px-6 lg:px-8">
        <Megaphone className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{ann.announcement_text}</span>
        {link &&
          (isExternal(link) ? (
            <a href={safeUrl(link)} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold underline underline-offset-2">
              {ann.announcement_link_text || "Learn more"} →
            </a>
          ) : (
            <Link to={link} className="shrink-0 font-semibold underline underline-offset-2">
              {ann.announcement_link_text || "Learn more"} →
            </Link>
          ))}
      </div>
      <button
        onClick={() => {
          storage.set(key, true);
          setHidden(true);
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-white/80 transition hover:text-white sm:right-6 lg:right-8"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold sm:text-3xl">We'll be back soon</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-500">{message}</p>
      <Link to="/login" className="mt-6 text-sm font-medium text-primary hover:underline">
        Admin login
      </Link>
    </div>
  );
}

export function PublicLayout() {
  const { data: settings } = useSettings();
  const { isAdmin, loading } = useAuth();
  const maintenance = settings?.general.maintenance_mode ?? false;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <ScrollToTop />
      <OfflineBanner />
      <AnnouncementBar />
      <Navbar />
      <CookieConsent />
      {maintenance && isAdmin && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          <Construction className="h-3.5 w-3.5" /> Maintenance mode is ON — visitors see the maintenance screen.
          <Link to="/admin/backup" className="underline">
            Manage
          </Link>
        </div>
      )}
      <main className="flex-1 pb-20 md:pb-0">
        {maintenance && !isAdmin && !loading ? (
          <MaintenanceScreen message={settings?.general.maintenance_message ?? ""} />
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}