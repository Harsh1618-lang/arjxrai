import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, FileText, GraduationCap, HelpCircle, Home, Info, LayoutDashboard, LayoutGrid, LogIn, LogOut, Menu, Moon, Phone, Search, Settings, Sun, User, UserPlus, X } from "lucide-react";
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

export function Logo({ className, compact = false, dense = false }: { className?: string; compact?: boolean; dense?: boolean }) {
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
    <Link
      to="/"
      onClick={handleTap}
      className={cn("flex items-center font-bold tracking-tight text-zinc-900 transition-all duration-[350ms] ease-out dark:text-white", dense ? "gap-1.5" : "gap-2.5", className)}
      aria-label={name}
    >
      {logo ? (
        <img src={logo} alt={name} className={cn("rounded-[10px] object-cover transition-all duration-[350ms] ease-out", dense ? "h-6 w-6 rounded-lg" : "h-8 w-8")} />
      ) : (
        <span className={cn("flex items-center justify-center bg-primary text-white transition-all duration-[350ms] ease-out", dense ? "h-6 w-6 rounded-lg" : "h-8 w-8 rounded-[10px]")}>
          <GraduationCap className={cn("transition-all duration-[350ms] ease-out", dense ? "h-3 w-3" : "h-4 w-4")} />
        </span>
      )}
      {!compact && <span className={cn("transition-all duration-[350ms] ease-out", dense ? "text-[14px]" : "text-[16px]")}>{name}</span>}
    </Link>
  );
}

/** CMS-driven menu labels get recognisable icons (recognition over recall). */
function menuIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("course")) return BookOpen;
  if (l.includes("categor")) return LayoutGrid;
  if (l.includes("about")) return Info;
  if (l.includes("contact")) return Phone;
  if (l.includes("faq")) return HelpCircle;
  return FileText;
}

const drawerRowBase = "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-all duration-200";
const drawerRowIdle = "text-zinc-700 hover:bg-zinc-900/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.06]";
const drawerRowActive =
  "bg-primary/10 text-primary ring-1 ring-primary/40 shadow-[0_0_24px_-8px_color-mix(in_srgb,var(--primary)_70%,transparent)] dark:bg-primary/15";

const linkBase = (dense: boolean) =>
  cn("relative rounded-full px-4 font-medium transition-all duration-[350ms] ease-out", dense ? "py-1 text-[13px]" : "py-2 text-sm");
const linkIdle = "text-zinc-600 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-white";
const linkActive = "bg-primary/10 text-primary dark:bg-primary/15";

export function Navbar() {
  const { data: settings } = useSettings();
  const { user, isAdmin, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Smooth shrink-on-scroll: rAF-throttled so the resize stays buttery. */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 16);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

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
    const cls = ({ isActive }: { isActive: boolean }) => cn(linkBase(scrolled), isActive ? linkActive : linkIdle);
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
              className={cn(
                "w-full rounded-full border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-800 outline-none transition-all duration-300 ease-out placeholder:text-zinc-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900",
                scrolled ? "h-8" : "h-9",
              )}
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
        className={cn(
          "flex items-center justify-center rounded-full text-zinc-500 transition-all duration-[350ms] ease-out hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:hover:bg-white/[0.07] dark:hover:text-white",
          scrolled ? "h-8 w-8" : "h-9 w-9",
          searchOpen && expandable && "bg-primary/10 text-primary",
        )}
        aria-label="Search courses"
        aria-expanded={expandable ? searchOpen : undefined}
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <>
    <div className="fixed inset-x-0 top-0 z-50 w-full px-3 pt-3 [transform:translateZ(0)] md:px-5 md:pt-4">
      <header
        className={cn(
          "relative mx-auto max-w-[1360px] rounded-full border border-zinc-200/70 bg-white/70 backdrop-blur-2xl transition-all duration-[350ms] ease-out dark:border-white/10 dark:bg-zinc-900/60",
          scrolled
            ? "bg-white/85 shadow-[0_12px_32px_-14px_rgba(15,23,42,0.28)] dark:bg-zinc-900/80 dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.75)]"
            : "shadow-[0_2px_12px_-8px_rgba(15,23,42,0.16)] dark:shadow-[0_2px_12px_-8px_rgba(0,0,0,0.55)]",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-6 px-5 transition-all duration-[350ms] ease-out sm:px-7 lg:gap-8",
            scrolled ? "h-12" : "h-16",
          )}
        >
          {/* Group 1 — logo */}
          <Logo className="shrink-0" dense={scrolled} />

          {/* Group 2 — primary navigation */}
          <nav className="hidden min-w-0 items-center gap-0.5 lg:flex" aria-label="Main">
            {menu.map((m) => renderLink(m))}
          </nav>

          {/* Group 3 — actions */}
          <div className="flex shrink-0 items-center gap-1">
            {searchControl(true)}

            <button
              onClick={toggle}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                "inline-flex items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-all duration-[350ms] ease-out hover:border-zinc-300 hover:text-zinc-900 active:scale-90 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white",
                scrolled ? "h-8 w-8" : "h-9 w-9",
              )}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span key={mode} className="animate-icon-flip inline-flex">
                {mode === "dark" ? <Sun className={cn("transition-all duration-[350ms]", scrolled ? "h-4 w-4" : "h-[18px] w-[18px]")} /> : <Moon className={cn("transition-all duration-[350ms]", scrolled ? "h-4 w-4" : "h-[18px] w-[18px]")} />}
              </span>
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
                <Link
                  to="/login"
                  className={cn(
                    "rounded-full font-medium text-zinc-700 transition-all duration-[350ms] ease-out hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.07]",
                    scrolled ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm",
                  )}
                >
                  Log in
                </Link>
                {settings?.general.registration_enabled && (
                  <Link
                    to="/register"
                    className={cn(
                      "rounded-full bg-primary font-semibold text-white transition-all duration-[350ms] ease-out hover:bg-primary-hover active:scale-[0.97]",
                      scrolled ? "px-4 py-1.5 text-[13px]" : "px-5 py-2 text-sm",
                    )}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            )}

            {/* Mobile — search + hamburger */}
            {searchControl(false)}
            <button
              onClick={() => setDrawer(true)}
              className={cn(
                "flex items-center justify-center rounded-full text-zinc-600 transition-all duration-[350ms] ease-out hover:bg-zinc-900/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.07] lg:hidden",
                scrolled ? "h-8 w-8" : "h-9 w-9",
              )}
              aria-label="Open menu"
              aria-expanded={drawer}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      </div>

      {/* Mobile slide-in drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-zinc-950/50 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside
            className="absolute right-2 top-2 flex w-[320px] max-w-[calc(100vw-16px)] animate-slide-in-right flex-col overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/85 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
            style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 20px)" }}
          >
            <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-5">
              <Logo />
              <button
                onClick={() => setDrawer(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSearch} role="search" className="relative px-5 pt-4">
              <Search className="pointer-events-none absolute left-9 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-11 w-full rounded-full border border-zinc-200/80 bg-zinc-100/70 pl-10 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100"
              />
            </form>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5" aria-label="Mobile">
              {menu.map((item) => {
                const Icon = menuIcon(item.label);
                return isExternal(item.href) ? (
                  <a key={item.label} href={safeUrl(item.href)} target="_blank" rel="noopener noreferrer" className={cn(drawerRowBase, drawerRowIdle)}>
                    <Icon className="h-5 w-5" /> {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setDrawer(false)}
                    className={({ isActive }) => cn(drawerRowBase, isActive ? drawerRowActive : drawerRowIdle)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </>
                    )}
                  </NavLink>
                );
              })}

              <div className="!my-4 h-px bg-zinc-200/70 dark:bg-white/10" />

              <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5">
                <span className="flex items-center gap-3 text-[15px] font-medium text-zinc-700 dark:text-zinc-200">
                  {mode === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} Dark mode
                </span>
                <Toggle checked={mode === "dark"} onChange={toggle} />
              </div>

              <div className="!my-4 h-px bg-zinc-200/70 dark:bg-white/10" />

              {user ? (
                <div className="space-y-1.5">
                  <MenuRow to="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} onClick={() => setDrawer(false)}>
                    Dashboard
                  </MenuRow>
                  <MenuRow to="/profile" icon={<User className="h-5 w-5" />} onClick={() => setDrawer(false)}>
                    Profile
                  </MenuRow>
                  {isAdmin && (
                    <MenuRow to="/admin" icon={<Settings className="h-5 w-5" />} onClick={() => setDrawer(false)}>
                      Admin panel
                    </MenuRow>
                  )}
                  <button
                    onClick={() => {
                      setDrawer(false);
                      signOut().then(() => navigate("/"));
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-5 w-5" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <MenuRow to="/login" icon={<LogIn className="h-5 w-5" />} onClick={() => setDrawer(false)}>
                    Log in
                  </MenuRow>
                  {settings?.general.registration_enabled && (
                    <Link
                      to="/register"
                      onClick={() => setDrawer(false)}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_color-mix(in_srgb,var(--primary)_80%,transparent)] transition-all hover:bg-primary-hover active:scale-[0.98]"
                    >
                      <UserPlus className="h-5 w-5" /> Get started
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
    <Link to={to} onClick={onClick} className={cn(drawerRowBase, drawerRowIdle)}>
      {icon}
      {children}
    </Link>
  );
}
