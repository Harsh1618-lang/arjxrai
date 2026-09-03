import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, Moon, Search, Settings, Sun, User, UserPlus, X } from "lucide-react";
import { useSettings } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { Avatar, Toggle } from "@/components/ui";
import { cn, isExternal, safeUrl } from "@/lib/utils";

/* Hidden staff entrance: tap the logo 3 times quickly (works from any logo instance). */
let logoTaps = 0;
let lastTap = 0;
const TAP_WINDOW_MS = 1400;

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const toast = useToast();
  const logo = settings?.theme.logo || settings?.navigation.logo;
  const name = settings?.general.site_name ?? "SRD Learn";

  const handleTap = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    logoTaps = now - lastTap < TAP_WINDOW_MS ? logoTaps + 1 : 1;
    lastTap = now;
    if (logoTaps >= 3) {
      logoTaps = 0;
      e.preventDefault();
      navigate("/admin/login");
      toast.info("Administrator sign-in");
    }
  };

  return (
    <Link to="/" onClick={handleTap} className={cn("flex items-center gap-2.5 font-bold tracking-tight text-zinc-900 dark:text-white", className)} aria-label={name}>
      {logo ? (
        <img src={logo} alt={name} className="h-8 w-8 rounded-[10px] object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-white">
          <GraduationCap className="h-4 w-4" />
        </span>
      )}
      {!compact && <span className="text-[16px]">{name}</span>}
    </Link>
  );
}

const linkBase = "relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150";
const linkIdle = "text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white";
const linkActive = "text-primary after:absolute after:inset-x-3 after:bottom-1 after:h-[2px] after:rounded-full after:bg-primary";

export function Navbar() {
  const { data: settings } = useSettings();
  const { user, isAdmin, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const menu = settings?.navigation.menu ?? [];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses");
    setSearchOpen(false);
    setQ("");
    setDrawer(false);
  };

  const renderLink = (item: { label: string; href: string }) => {
    const cls = ({ isActive }: { isActive: boolean }) => cn(linkBase, isActive ? linkActive : linkIdle);
    if (isExternal(item.href)) {
      return (
        <a key={item.label} href={safeUrl(item.href)} target="_blank" rel="noopener noreferrer" className={cls({ isActive: false })}>
          {item.label}
        </a>
      );
    }
    return (
      <NavLink key={item.label} to={item.href} end={item.href === "/"} className={cls}>
        {item.label}
      </NavLink>
    );
  };

  const searchControl = (expandable: boolean) => (
    <div className={cn("items-center", expandable ? "hidden lg:flex" : "flex lg:hidden")}>
      {expandable && (
        <div className={cn("overflow-hidden transition-all duration-300 ease-out", searchOpen ? "w-40 opacity-100 xl:w-52" : "w-0 opacity-0")}>
          <form onSubmit={onSearch} role="search" className="pr-2">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
              onBlur={() => !q.trim() && setSearchOpen(false)}
              placeholder="Search courses…"
              aria-label="Search courses"
              tabIndex={searchOpen ? 0 : -1}
              className="h-9 w-full rounded-full border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
            />
          </form>
        </div>
      )}
      <button
        onClick={() => {
          if (expandable) {
            setSearchOpen((v) => !v);
            window.setTimeout(() => searchRef.current?.focus(), 180);
          } else {
            navigate("/courses?focus=1");
          }
        }}
        className={cn("rounded-lg p-2 text-zinc-500 transition-colors duration-150 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white", searchOpen && expandable && "text-primary")}
        aria-label="Search courses"
        aria-expanded={expandable ? searchOpen : undefined}
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <>
    <div className="sticky top-0 z-40">
      <header className="relative border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-6 px-4 sm:px-6 lg:gap-8 lg:px-8">
          {/* Group 1 — logo */}
          <Logo className="shrink-0" />

          {/* Group 2 — primary navigation */}
          <nav className="hidden min-w-0 items-center gap-0.5 lg:flex" aria-label="Main">
            {menu.map((m) => renderLink(m))}
          </nav>

          {/* Group 3 — actions */}
          <div className="flex shrink-0 items-center gap-1">
            {searchControl(true)}

            <button
              onClick={toggle}
              className="hidden rounded-lg p-2 text-zinc-500 transition-colors duration-150 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white lg:inline-flex"
              aria-label="Toggle theme"
            >
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} className="ml-1 flex items-center rounded-full ring-2 ring-transparent transition hover:ring-primary/30" aria-label="Account menu">
                  <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right animate-fade-in rounded-xl border border-zinc-200/80 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{user.full_name}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <MenuLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </MenuLink>
                      <MenuLink to="/profile" icon={<User className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                        Profile
                      </MenuLink>
                      {isAdmin && (
                        <MenuLink to="/admin" icon={<Settings className="h-4 w-4" />} onClick={() => setMenuOpen(false)}>
                          Admin panel
                        </MenuLink>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut().then(() => navigate("/"));
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 lg:flex">
                <Link to="/login" className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.06]">
                  Log in
                </Link>
                {settings?.general.registration_enabled && (
                  <Link to="/register" className="rounded-[10px] bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover">
                    Get Started
                  </Link>
                )}
              </div>
            )}

            {/* Mobile — search + hamburger */}
            {searchControl(false)}
            <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-zinc-600 transition-colors duration-150 hover:bg-zinc-900/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.06] lg:hidden" aria-label="Open menu" aria-expanded={drawer}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile slide-in drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-zinc-950/40" onClick={() => setDrawer(false)} />
          <aside
            className="absolute right-0 top-0 flex w-[300px] max-w-[85vw] animate-slide-in-right flex-col rounded-l-2xl border-l border-zinc-200/80 bg-white shadow-[-12px_0_32px_-20px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[-12px_0_32px_-20px_rgba(0,0,0,0.7)]"
            style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800">
              <Logo />
              <button onClick={() => setDrawer(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSearch} role="search" className="relative px-4 pt-4">
              <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-10 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </form>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
              {menu.map((item) =>
                isExternal(item.href) ? (
                  <a key={item.label} href={safeUrl(item.href)} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setDrawer(false)}
                    className={({ isActive }) =>
                      cn("block rounded-lg px-3 py-2.5 text-[15px] font-medium", isActive ? "bg-primary/[0.08] text-primary" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800")
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}

              <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />

              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="flex items-center gap-2.5 text-[15px] font-medium text-zinc-700 dark:text-zinc-200">
                  {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Dark mode
                </span>
                <Toggle checked={mode === "dark"} onChange={toggle} />
              </div>

              <div className="my-3 h-px bg-zinc-100 dark:bg-zinc-800" />

              {user ? (
                <div className="space-y-1">
                  <MenuRow to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setDrawer(false)}>
                    Dashboard
                  </MenuRow>
                  <MenuRow to="/profile" icon={<User className="h-4 w-4" />} onClick={() => setDrawer(false)}>
                    Profile
                  </MenuRow>
                  {isAdmin && (
                    <MenuRow to="/admin" icon={<Settings className="h-4 w-4" />} onClick={() => setDrawer(false)}>
                      Admin panel
                    </MenuRow>
                  )}
                  <button
                    onClick={() => {
                      setDrawer(false);
                      signOut().then(() => navigate("/"));
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <MenuRow to="/login" icon={<LogIn className="h-4 w-4" />} onClick={() => setDrawer(false)}>
                    Log in
                  </MenuRow>
                  {settings?.general.registration_enabled && (
                    <Link
                      to="/register"
                      onClick={() => setDrawer(false)}
                      className="flex items-center gap-2.5 rounded-[10px] bg-primary px-3 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                      <UserPlus className="h-4 w-4" /> Get started
                    </Link>
                  )}
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
      {icon}
      {children}
    </Link>
  );
}

function MenuRow({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
      {icon}
      {children}
    </Link>
  );
}
