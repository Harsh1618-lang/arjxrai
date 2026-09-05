import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { GithubIcon, TelegramIcon, YoutubeIcon } from "@/components/icons";
import { useNewsletter, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Logo } from "@/components/layout/Navbar";
import { isExternal, isValidEmail, safeUrl } from "@/lib/utils";

export function Footer() {
  const { data: settings } = useSettings();
  const toast = useToast();
  const newsletter = useNewsletter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const footer = settings?.footer ?? {
    about: "SRD Learn is an open, modern learning platform offering structured video courses, handwritten notes, PDFs, and roadmaps.",
    copyright: "© {year} SRD Learn. All rights reserved.",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Categories", href: "/categories" },
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
    telegram: "https://t.me",
    youtube: "https://youtube.com",
    github: "https://github.com",
    email: "contact@srdlearn.com",
    contact: "Have questions or need help? Reach out via our official community channels or email.",
    show_privacy: true,
    show_terms: true,
  };
  const general = settings?.general ?? { site_name: "SRD Learn" };
  const year = new Date().getFullYear();

  const subscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return toast.error("Enter a valid email address.");
    try {
      await newsletter.mutateAsync(email.trim());
      setSubscribed(true);
      setEmail("");
      toast.success("Subscribed!");
    } catch {
      toast.error("Could not subscribe. Please try again.");
    }
  };

  const socials = [
    { href: footer.telegram, icon: TelegramIcon, label: "Telegram" },
    { href: footer.youtube, icon: YoutubeIcon, label: "YouTube" },
    { href: footer.github, icon: GithubIcon, label: "GitHub" },
    { href: footer.email ? `mailto:${footer.email}` : "", icon: Mail, label: "Email" },
  ].filter((s) => s.href);

  return (
    <footer className="liquid-glass-bar relative overflow-hidden border-t border-white/80 bg-white/90 dark:border-white/10 dark:bg-black/90">
      {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE footer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Ambient soft iridescent wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/30 via-white/20 to-sky-100/30 opacity-100 dark:opacity-0" />

        {/* Liquid Blob 1: Left */}
        <div
          className="liquid-blob-anim-1 absolute -top-16 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-purple-600/15 blur-[45px] dark:from-indigo-600/25 dark:via-violet-600/18 dark:to-purple-700/12"
        />
        {/* Liquid Blob 2: Right */}
        <div
          className="liquid-blob-anim-2 absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-tl from-cyan-400/30 via-sky-500/22 to-blue-600/15 blur-[48px] dark:from-sky-500/25 dark:via-blue-600/18 dark:to-teal-500/12"
        />
        {/* Liquid Blob 3: Center */}
        <div
          className="liquid-blob-anim-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-72 rounded-full bg-gradient-to-r from-fuchsia-500/20 via-pink-500/18 to-rose-400/12 blur-[40px] dark:from-fuchsia-600/16 dark:to-rose-600/12"
        />
      </div>

      {/* Top specular reflection line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent" />

      {/* Shimmer sweep effect */}
      <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-30 dark:opacity-12" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-32 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{footer.about}</p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={safeUrl(href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/80 bg-white/60 text-zinc-600 shadow-xs backdrop-blur-md transition-all hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">Pages</h4>
            <ul className="mt-4 space-y-2.5">
              {footer.links.map((l) => (
                <li key={l.label}>
                  {isExternal(l.href) ? (
                    <a href={safeUrl(l.href)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.href} className="text-[13px] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">Contact</h4>
            <p className="mt-4 text-[13px] text-zinc-600 dark:text-zinc-400">{footer.contact}</p>
            {footer.email && (
              <a href={`mailto:${footer.email}`} className="mt-2 block text-[13px] font-medium text-primary hover:underline">
                {footer.email}
              </a>
            )}
            <ul className="mt-4 space-y-2">
              {footer.show_privacy && (
                <li><Link to="/privacy" className="text-[13px] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Privacy Policy</Link></li>
              )}
              {footer.show_terms && (
                <li><Link to="/terms" className="text-[13px] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Terms & Conditions</Link></li>
              )}
              <li><Link to="/disclaimer" className="text-[13px] text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-black/5 pt-10 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Stay updated</h4>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">New courses and notes, no spam.</p>
            </div>
            {subscribed ? (
              <p className="text-sm font-medium text-emerald-500">Subscribed ✓</p>
            ) : (
              <form onSubmit={subscribe} className="flex max-w-sm gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="h-9 w-full rounded-lg border border-white/80 bg-white/60 px-3 text-sm outline-none backdrop-blur-md transition focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary/60"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletter.isPending}
                  className="h-9 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50 shadow-xs"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-6 text-[12px] text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:flex-row">
          <p>{(footer.copyright || `© {year} ${general.site_name}`).replace("{year}", String(year))}</p>
        </div>
      </div>
    </footer>
  );
}
