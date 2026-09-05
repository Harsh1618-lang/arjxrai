import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Sun, User, X } from "lucide-react";
import { useSettings } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, LinkButton } from "@/components/ui";
import { cn, isExternal, safeUrl } from "@/lib/utils";

export function Logo({ className, compact = false, onSecretTap }: { className?: string; compact?: boolean; onSecretTap?: () => void }) {
  const { data: settings } = useSettings();
  const logo = settings?.theme.logo || settings?.navigation.logo;
  const name = settings?.general.site_name ?? "SRD Learn";
  const tapsRef = useRef<number[]>([]);

  const handleTap = (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    if (!onSecretTap) return;
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 1500), now];
    if (tapsRef.current.length >= 3) {
      tapsRef.current = [];
      onSecretTap();
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 dark:text-white", className)}
      aria-label={name}
      onClick={handleTap}
    >
      {logo ? (
        <img src={logo} alt={name} className="h-7 w-auto max-w-[120px] object-contain" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
          <GraduationCap className="h-3.5 w-3.5" />
        </span>
      )}
      {!compact && <span className="text-[14px] font-semibold header-zoom-text">{name}</span>}
    </Link>
  );
}

export function Navbar() {
  const { data: settings } = useSettings();
  const { user, isAdmin, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Automatically close mobile menu drawer and overlays on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const menu = settings?.navigation.menu ?? [];

  const renderLink = (item: { label: string; href: string }, mobile = false) => {
    const cls = ({ isActive }: { isActive: boolean }) =>
      cn(
        mobile
          ? "block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors"
          : "relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
        mobile
          ? isActive
            ? "text-zinc-900 bg-zinc-100 dark:text-white dark:bg-white/8"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5"
          : isActive
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200",
      );
    if (isExternal(item.href)) {
      return (
        <a key={item.label} href={safeUrl(item.href)} target="_blank" rel="noopener noreferrer" className={cls({ isActive: false })}>
          <span className="header-zoom-text">{item.label}</span>
        </a>
      );
    }
    return (
      <NavLink key={item.label} to={item.href} end={item.href === "/"} className={cls} onClick={() => setOpen(false)}>
        {(props: { isActive: boolean }) => (
          <>
            <span className="header-zoom-text">{item.label}</span>
            {props.isActive && !mobile && (
              <span className="absolute bottom-0 left-1/2 h-px w-4 -translate-x-1/2 bg-primary" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const iconBtn = "rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-[#151515] dark:hover:text-zinc-200";

  return (
    <header className="sticky top-0 z-40 transition-all duration-300">
      <div className={cn("mx-auto max-w-[1280px] transition-all duration-300 ease-out", scrolled ? "px-3 pt-3 sm:px-4" : "px-2 pt-2 sm:px-4 sm:pt-2.5")}>
        <div
          className="liquid-glass-bar relative mx-auto flex h-14 items-center justify-between gap-4 overflow-hidden rounded-2xl px-4 sm:px-6 transition-all duration-300 ease-out"
        >
          {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE the header */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            {/* Ambient soft iridescent wash */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/35 via-purple-50/25 to-sky-100/30 opacity-100 dark:opacity-0" />

            {/* Liquid Blob 1: Left */}
            <div
              className="liquid-blob-anim-1 absolute -top-8 left-6 h-28 w-48 rounded-full bg-gradient-to-r from-indigo-500/35 via-violet-500/25 to-purple-500/20 blur-[28px] dark:from-indigo-600/25 dark:via-violet-600/20 dark:to-purple-700/15"
            />
            {/* Liquid Blob 2: Right */}
            <div
              className="liquid-blob-anim-2 absolute -bottom-8 right-10 h-28 w-52 rounded-full bg-gradient-to-r from-cyan-400/35 via-sky-500/25 to-blue-500/20 blur-[28px] dark:from-sky-500/25 dark:via-blue-600/20 dark:to-teal-500/15"
            />
            {/* Liquid Blob 3: Center */}
            <div
              className="liquid-blob-anim-3 absolute top-0 left-1/2 -translate-x-1/2 h-24 w-36 rounded-full bg-gradient-to-r from-fuchsia-500/25 to-pink-500/20 blur-[25px] dark:from-fuchsia-600/20 dark:to-pink-600/15"
            />
          </div>

          {/* Top specular reflection line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.2px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent" />

          {/* Shimmer sweep effect */}
          <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-30 dark:opacity-15" />

          {/* Logo */}
          <div className="relative z-10">
            <Logo onSecretTap={() => navigate("/login?mode=admin")} />
          </div>

          {/* Nav — desktop center */}
          <nav className="relative z-10 hidden items-center gap-0.5 md:flex" aria-label="Main">
            {menu.map((m) => renderLink(m))}
          </nav>

          {/* Actions — right */}
          <div className="relative z-10 flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="hidden items-center sm:flex">
              {searchOpen ? (
                <div className="relative animate-fade-in">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
                  <input
                    ref={searchInputRef}
                    autoFocus
                    onBlur={() => !searchInputRef.current?.value && setSearchOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setSearchOpen(false);
                      if (e.key === "Enter" && searchInputRef.current?.value) {
                        navigate(`/courses?q=${encodeURIComponent(searchInputRef.current.value)}`);
                        setSearchOpen(false);
                      }
                    }}
                    placeholder="Search courses…"
                    className="h-8 w-48 rounded-lg border border-zinc-200 bg-zinc-50 px-3 pl-8 text-sm outline-none transition placeholder:text-zinc-400 focus:border-primary focus:bg-white dark:border-[#2a2a2a] dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-primary/60 dark:focus:bg-black"
                  />
                  <button onClick={() => setSearchOpen(false)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile search */}
            <button onClick={() => navigate("/courses?focus=1")} className={cn(iconBtn, "sm:hidden")} aria-label="Search">
              <Search className="h-4 w-4" />
            </button>

            {/* Theme toggle */}
            <button onClick={toggle} className={iconBtn} aria-label="Toggle theme">
              {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center rounded-full ring-2 ring-transparent transition-all hover:ring-primary/30 focus-visible:ring-primary/50"
                  aria-label="Account menu"
                >
                  <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right animate-fade-in rounded-xl border border-zinc-200/80 bg-white shadow-xl dark:border-[#1f1f1f] dark:bg-[#0d0d0d]">
                    <div className="border-b border-zinc-100 px-4 py-3 dark:border-[#1a1a1a]">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{user.full_name}</p>
                      <p className="truncate text-xs text-zinc-400 dark:text-zinc-600">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <MenuLink to="/dashboard" icon={<LayoutDashboard className="h-3.5 w-3.5" />} onClick={() => setMenuOpen(false)}>Dashboard</MenuLink>
                      <MenuLink to="/profile" icon={<User className="h-3.5 w-3.5" />} onClick={() => setMenuOpen(false)}>Profile</MenuLink>
                      {isAdmin && (
                        <MenuLink to="/admin" icon={<Settings className="h-3.5 w-3.5" />} onClick={() => setMenuOpen(false)}>Admin panel</MenuLink>
                      )}
                    </div>
                    <div className="border-t border-zinc-100 p-1.5 dark:border-[#1a1a1a]">
                      <button
                        onClick={() => { setMenuOpen(false); signOut().then(() => navigate("/")); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-1 hidden items-center gap-1 sm:flex">
                <LinkButton to="/login" variant="ghost" size="sm" className="px-3 text-[13px]">
                  <span className="header-zoom-text">Log in</span>
                </LinkButton>
                {settings?.general.registration_enabled && (
                  <LinkButton to="/register" size="sm" className="px-3 text-[13px]">
                    <span className="header-zoom-text">Get started</span>
                  </LinkButton>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setOpen((v) => !v)} className={cn(iconBtn, "md:hidden")} aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer with liquid glass styling */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="md:hidden">
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs animate-fade-in" onClick={() => setOpen(false)} />
          <div
            className="liquid-glass-bar fixed inset-y-0 right-0 z-[70] flex h-full w-72 max-w-[85vw] flex-col overflow-hidden rounded-l-3xl border-l border-white/80 shadow-2xl animate-slide-in-right"
          >
            {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE the hamburger menu */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-l-3xl" aria-hidden>
              {/* Ambient soft iridescent wash */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 via-purple-50/30 to-sky-100/35 opacity-100 dark:opacity-0" />

              {/* Liquid Blob 1: Top Right */}
              <div
                className="liquid-blob-anim-1 absolute -top-10 -right-10 h-44 w-44 rounded-full bg-gradient-to-tr from-indigo-500/40 via-violet-500/30 to-purple-600/20 blur-[32px] dark:from-indigo-600/30 dark:via-violet-600/20 dark:to-purple-700/15"
              />
              {/* Liquid Blob 2: Bottom Left */}
              <div
                className="liquid-blob-anim-2 absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-blue-600/20 blur-[32px] dark:from-sky-500/30 dark:via-blue-600/20 dark:to-teal-500/15"
              />
              {/* Liquid Blob 3: Middle Right */}
              <div
                className="liquid-blob-anim-3 absolute top-1/2 -right-8 -translate-y-1/2 h-40 w-40 rounded-full bg-gradient-to-r from-fuchsia-500/30 via-pink-500/25 to-rose-400/15 blur-[28px] dark:from-fuchsia-600/20 dark:to-rose-600/15"
              />
            </div>

            {/* Specular gloss top light reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent" />

            {/* Shimmer sweep effect */}
            <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-35 dark:opacity-15" />

            {/* Drawer header */}
            <div className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/60 px-4 dark:border-white/10">
              <div onClick={() => setOpen(false)}>
                <Logo />
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/60 dark:text-zinc-400 dark:hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="relative z-10 flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Mobile">
              {menu.map((m) => renderLink(m, true))}
            </nav>
            <div className="relative z-10 shrink-0 border-t border-white/60 px-4 py-3 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Dark mode</span>
                <button
                  onClick={toggle}
                  role="switch"
                  aria-checked={mode === "dark"}
                  aria-label="Toggle dark mode"
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    mode === "dark" ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      mode === "dark" ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>
            {user ? (
              <div className="relative z-10 shrink-0 border-t border-white/60 p-3 dark:border-white/10 space-y-1">
                <div className="flex items-center gap-2.5 px-2 py-1 mb-1">
                  <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">{user.full_name}</p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <User className="h-3.5 w-3.5" /> Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" /> Admin panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut().then(() => navigate("/"));
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50/80 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex shrink-0 gap-2 border-t border-white/60 p-3 dark:border-white/10">
                <Link
                  to="/login"
                  onClick={() => {
                    setOpen(false);
                    setMenuOpen(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-white/90 dark:border-white/15 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/20"
                >
                  <span className="header-zoom-text">Log in</span>
                </Link>
                {settings?.general.registration_enabled && (
                  <Link
                    to="/register"
                    onClick={() => {
                      setOpen(false);
                      setMenuOpen(false);
                    }}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                  >
                    <span className="header-zoom-text">Get started</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}

function MenuLink({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-[#151515] dark:hover:text-white"
    >
      {icon}
      <span className="header-zoom-text">{children}</span>
    </Link>
  );
}
