import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ThemeProvider } from "@/hooks/useTheme";
import { Analytics } from "@/lib/seo";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RequireAdmin, RequireAuth } from "@/components/common";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui";
import { subscribeToDbChanges } from "@/services/adapter";
import { qk } from "@/hooks/queries";

/* Route-level code splitting */
const Home = lazy(() => import("@/pages/Home"));
const Courses = lazy(() => import("@/pages/Courses"));
const Categories = lazy(() => import("@/pages/Categories"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Auth = lazy(() => import("@/pages/Auth"));
const StaticPage = lazy(() => import("@/pages/StaticPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Dashboard = lazy(() => import("@/pages/student/Dashboard"));
const Bookmarks = lazy(() => import("@/pages/student/Bookmarks"));
const Profile = lazy(() => import("@/pages/student/Profile"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const CoursesAdmin = lazy(() => import("@/pages/admin/CoursesAdmin"));
const CourseEditor = lazy(() => import("@/pages/admin/CourseEditor"));
const CategoriesAdmin = lazy(() => import("@/pages/admin/CategoriesAdmin"));
const PagesAdmin = lazy(() => import("@/pages/admin/PagesAdmin"));
const UsersAdmin = lazy(() => import("@/pages/admin/UsersAdmin"));
const MediaManager = lazy(() => import("@/pages/admin/MediaManager"));
const BackupAdmin = lazy(() => import("@/pages/admin/BackupAdmin"));
const HomeCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.HomeCms })));
const NavigationCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.NavigationCms })));
const FooterCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.FooterCms })));
const SeoCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.SeoCms })));
const ThemeCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.ThemeCms })));
const GeneralSettingsCms = lazy(() => import("@/pages/admin/SiteCms").then((m) => ({ default: m.GeneralSettingsCms })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

function LiveSyncManager() {
  const qc = useQueryClient();

  useEffect(() => {
    return subscribeToDbChanges((table) => {
      if (table === "settings") {
        qc.invalidateQueries({ queryKey: qk.settings });
      } else if (table === "courses") {
        qc.invalidateQueries({ queryKey: ["courses"] });
        qc.invalidateQueries({ queryKey: ["course"] });
        qc.invalidateQueries({ queryKey: ["course-id"] });
        qc.invalidateQueries({ queryKey: qk.stats });
      } else if (table === "categories") {
        qc.invalidateQueries({ queryKey: qk.categories });
        qc.invalidateQueries({ queryKey: ["courses"] });
      } else if (table === "lessons" || table === "pdfs" || table === "resources") {
        qc.invalidateQueries({ queryKey: ["course-content"] });
        qc.invalidateQueries({ queryKey: ["courses"] });
        qc.invalidateQueries({ queryKey: ["course"] });
      } else if (table === "pages") {
        qc.invalidateQueries({ queryKey: qk.pages });
        qc.invalidateQueries({ queryKey: ["page"] });
      } else if (table === "media") {
        qc.invalidateQueries({ queryKey: qk.media });
      } else if (table === "profiles" || table === "users") {
        qc.invalidateQueries({ queryKey: qk.users });
      } else if (table === "activity_logs") {
        qc.invalidateQueries({ queryKey: qk.logs });
      }
    });
  }, [qc]);

  return null;
}

const KNOWN_ROUTES = ["courses", "categories", "login", "register", "about", "contact", "faq", "privacy", "terms", "disclaimer", "p", "dashboard", "profile", "admin"];

/**
 * Detects a base path when the app is hosted in a sub-directory
 * (e.g. static previews) so deep links keep working. On Vercel/root this is "/".
 */
function detectBasename(): string {
  const raw = window.location.pathname;
  const explicitFile = /\/index\.html$/.test(raw);
  const path = raw.replace(/\/index\.html$/, "");
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  const idx = segments.findIndex((s) => KNOWN_ROUTES.includes(s));
  if (idx === 0) return "/";
  if (idx > 0) return `/${segments.slice(0, idx).join("/")}`;
  // No known route in the path: treat it as a hosting prefix only when it clearly
  // looks like a directory (served index.html, trailing slash or nested path).
  // A single unknown segment (e.g. /typo) falls through to the 404 page.
  if (explicitFile || path.endsWith("/") || segments.length > 1) return `/${segments.join("/")}`;
  return "/";
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveSyncManager />
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter basename={detectBasename()}>
              <Analytics />
              <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="courses/:slug" element={<CourseDetail />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="login" element={<Auth mode="login" />} />
                    <Route path="register" element={<Auth mode="register" />} />
                    <Route path="about" element={<StaticPage slug="about" />} />
                    <Route path="contact" element={<StaticPage slug="contact" />} />
                    <Route path="faq" element={<StaticPage slug="faq" />} />
                    <Route path="privacy" element={<StaticPage slug="privacy" />} />
                    <Route path="terms" element={<StaticPage slug="terms" />} />
                    <Route path="disclaimer" element={<StaticPage slug="disclaimer" />} />
                    <Route path="p/:slug" element={<StaticPage />} />
                    <Route
                      path="dashboard"
                      element={
                        <RequireAuth>
                          <Dashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="profile"
                      element={
                        <RequireAuth>
                          <Profile />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="bookmarks"
                      element={
                        <RequireAuth>
                          <Bookmarks />
                        </RequireAuth>
                      }
                    />
                    <Route path="index.html" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  <Route
                    path="admin"
                    element={
                      <RequireAdmin>
                        <AdminLayout />
                      </RequireAdmin>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="courses" element={<CoursesAdmin />} />
                    <Route path="courses/:id" element={<CourseEditor />} />
                    <Route path="categories" element={<CategoriesAdmin />} />
                    <Route path="pages" element={<PagesAdmin />} />
                    <Route path="users" element={<UsersAdmin />} />
                    <Route path="media" element={<MediaManager />} />
                    <Route path="backup" element={<BackupAdmin />} />
                    <Route path="home" element={<HomeCms />} />
                    <Route path="navigation" element={<NavigationCms />} />
                    <Route path="footer" element={<FooterCms />} />
                    <Route path="seo" element={<SeoCms />} />
                    <Route path="theme" element={<ThemeCms />} />
                    <Route path="settings" element={<GeneralSettingsCms />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Route>
                </Routes>
              </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
