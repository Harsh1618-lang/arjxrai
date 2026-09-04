import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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
      {!compact && <span className="text-[14px] font-semibold">{name}</span>}
    </Link>
  );
}

export function Navbar() {
  const { data: settings } = useSettings();
  const { user, isAdmin, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
          {item.label}
        </a>
      );
    }
    return (
      <NavLink key={item.label} to={item.href} end={item.href === "/"} className={cls} onClick={() => setOpen(false)}>
        {(props: { isActive: boolean }) => (
          <>
            {item.label}
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
      <div className={cn("mx-auto max-w-[1280px] transition-all duration-300 ease-out", scrolled ? "px-3 pt-3 sm:px-4" : "px-0 pt-0")}>
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between gap-4 border transition-all duration-300 ease-out",
            scrolled
              ? "rounded-2xl border-zinc-200/70 bg-white/80 px-4 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-[#1f1f1f] dark:bg-black/70"
              : "rounded-none border-transparent bg-white px-4 sm:px-6 lg:px-8 dark:bg-black",
          )}
        >
          {/* Logo */}
          <Logo onSecretTap={() => navigate("/login?mode=admin")} />

          {/* Nav — desktop center */}
          <nav className="relative hidden items-center gap-0.5 md:flex" aria-label="Main">
            {menu.map((m) => renderLink(m))}
          </nav>

          {/* Actions — right */}
          <div className="flex items-center gap-1">
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
                <LinkButton to="/login" variant="ghost" size="sm" className="px-3 text-[13px]">Log in</LinkButton>
                {settings?.general.registration_enabled && (
                  <LinkButton to="/register" size="sm" className="px-3 text-[13px]">Get started</LinkButton>
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

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed right-0 top-0 z-[70] flex w-72 max-w-[85vw] flex-col overflow-hidden rounded-l-2xl border-l border-zinc-200 bg-white shadow-2xl animate-slide-in-right dark:border-[#1a1a1a] dark:bg-[#050505] md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 8px) + 88px)" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-[#1a1a1a]">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#151515]" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Mobile">
              {menu.map((m) => renderLink(m, true))}
            </nav>
            <div className="shrink-0 border-t border-zinc-100 px-4 py-3 dark:border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Dark mode</span>
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
            {!user && (
              <div className="flex shrink-0 gap-2 border-t border-zinc-100 p-3 dark:border-[#1a1a1a]">
                <LinkButton to="/login" variant="outline" size="md" className="flex-1">Log in</LinkButton>
                {settings?.general.registration_enabled && (
                  <LinkButton to="/register" size="md" className="flex-1">Get started</LinkButton>
                )}
              </div>
            )}
          </div>
        </>
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
      {children}
    </Link>
  );
}
