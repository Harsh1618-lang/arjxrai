import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useRef, Suspense, useState } from "react";
import {
  BookOpen,
  Database,
  ExternalLink,
  FileText,
  FolderTree,
  Home,
  Image,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Navigation,
  Palette,
  PanelBottom,
  Search,
  Settings,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Navbar";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { ScrollToTop } from "@/components/common";
import { Avatar, PageLoader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const NAV = [
  {
    group: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    group: "Content",
    items: [
      { to: "/admin/courses", label: "Courses", icon: BookOpen },
      { to: "/admin/categories", label: "Categories", icon: FolderTree },
      { to: "/admin/pages", label: "Pages", icon: FileText },
      { to: "/admin/media", label: "Media", icon: Image },
    ],
  },
  {
    group: "Website",
    items: [
      { to: "/admin/home", label: "Home page", icon: Home },
      { to: "/admin/navigation", label: "Navigation", icon: Navigation },
      { to: "/admin/footer", label: "Footer", icon: PanelBottom },
      { to: "/admin/seo", label: "SEO", icon: Search },
      { to: "/admin/theme", label: "Theme", icon: Palette },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/backup", label: "Backup & Logs", icon: Database },
    ],
  },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Admin">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{g.group}</p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <ExternalLink className="h-4 w-4" /> View website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="admin-root relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#0c0c0e] dark:text-zinc-100">
      <ScrollToTop />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 max-w-[85vw] border-l border-zinc-200 bg-white shadow-2xl animate-slide-in-right dark:border-zinc-800 dark:bg-zinc-900" style={{ right: 0 }}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-zinc-500">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Toggle theme">
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user && (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Account menu">
                  <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                  <span className="hidden text-sm font-medium sm:block">{user.full_name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 origin-top-right animate-fade-in rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{user.full_name}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { setMenuOpen(false); navigate("/profile"); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                        <User className="h-4 w-4" /> Profile
                      </button>
                      <button onClick={() => { setMenuOpen(false); setPasswordModalOpen(true); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                        <KeyRound className="h-4 w-4" /> Change Password
                      </button>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); signOut().then(() => navigate("/")); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}
