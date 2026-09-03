import { Suspense, useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Construction, Megaphone, Plug, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BottomTabs } from "@/components/layout/BottomTabs";
import { CookieConsent } from "@/components/CookieConsent";
import { InstallPrompt, OfflineBanner, ScrollToTop } from "@/components/common";
import { PageLoader } from "@/components/ui";
import { useSettings } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn, isExternal, safeUrl, storage } from "@/lib/utils";

/**
 * Exactly ONE slim top strip, never stacked:
 *  - while no backend is connected → setup notice
 *  - otherwise → the CMS announcement bar
 * Both are dismissible.
 */
function TopBanner() {
  const { data: settings } = useSettings();
  const ann = settings?.navigation;
  const annKey = `srd_ann_${ann?.announcement_text?.slice(0, 40)}`;
  const [annHidden, setAnnHidden] = useState(() => storage.get<boolean>(annKey, false));
  const [setupHidden, setSetupHidden] = useState(() => storage.get<boolean>("srd_setup_banner_hidden", false));

  if (!isSupabaseConfigured && !setupHidden) {
    return (
      <div className="relative flex h-8 items-center justify-center gap-2 border-b border-primary/20 bg-primary/5 px-10 text-center text-xs text-zinc-700 dark:bg-primary/10 dark:text-zinc-200">
        <Plug className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate">
          Read-only starter catalog.
          <Link to="/setup" className="ml-1 font-semibold text-primary underline underline-offset-2 hover:no-underline">
            Connect Supabase
          </Link>{" "}
          to publish your own courses.
        </span>
        <button
          onClick={() => {
            storage.set("srd_setup_banner_hidden", true);
            setSetupHidden(true);
          }}
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition hover:bg-primary/10"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (isSupabaseConfigured && ann?.announcement_enabled && ann.announcement_text && !annHidden) {
    const link = ann.announcement_link;
    return (
      <div className="relative flex h-8 items-center justify-center bg-primary px-10 text-center text-[13px] leading-snug text-white">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5">
          <Megaphone className="h-3.5 w-3.5 shrink-0" />
          <span>{ann.announcement_text}</span>
          {link &&
            (isExternal(link) ? (
              <a href={safeUrl(link)} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                {ann.announcement_link_text || "Learn more"} →
              </a>
            ) : (
              <Link to={link} className="font-semibold underline underline-offset-2">
                {ann.announcement_link_text || "Learn more"} →
              </Link>
            ))}
        </span>
        <button
          onClick={() => {
            storage.set(annKey, true);
            setAnnHidden(true);
          }}
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition hover:bg-white/20"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
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
  const [bannerCollapsed, setBannerCollapsed] = useState(false);

  /* Collapse the top strip as soon as scrolling starts so the sticky header
     locks to the viewport edge immediately instead of travelling with it. */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setBannerCollapsed(window.scrollY > 4);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AmbientBackground />
      <ScrollToTop />
      {/* Fixed header + banner sit above all content */}
      <div className="fixed inset-x-0 top-0 z-50">
        <div className={cn("overflow-hidden transition-all duration-300 ease-out", bannerCollapsed ? "max-h-0 opacity-0" : "max-h-24 opacity-100")}>
          <TopBanner />
          <OfflineBanner />
        </div>
        <div className="px-3 pt-2 md:px-5 md:pt-3">
          <Navbar />
        </div>
      </div>
      <BottomTabs />
      {/* Content starts below the fixed header + banner (banner ~32px + gap 8px + header 56-64px) */}
      <div className="flex flex-1 flex-col pt-[104px] md:pt-[104px]">
        {maintenance && isAdmin && (
          <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
            <Construction className="h-3.5 w-3.5" /> Maintenance mode is ON — visitors see the maintenance screen.
            <Link to="/admin/backup" className="underline">
              Manage
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-x-hidden">
        {maintenance && !isAdmin && !loading ? (
          <MaintenanceScreen message={settings?.general.maintenance_message ?? ""} />
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        )}
        </main>
        <Footer />
      </div>
      <InstallPrompt />
      <CookieConsent />
    </div>
  );
}
