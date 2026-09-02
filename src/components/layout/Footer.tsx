import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { GithubIcon, TelegramIcon, YoutubeIcon } from "@/components/icons";
import { useNewsletter, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { Logo } from "@/components/layout/Navbar";
import { isDemoMode } from "@/services/adapter";
import { isExternal, isValidEmail, safeUrl } from "@/lib/utils";

export function Footer() {
  const { data: settings } = useSettings();
  const toast = useToast();
  const newsletter = useNewsletter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  if (!settings) return null;
  const { footer, general } = settings;
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
    <footer className="border-t border-zinc-200/60 bg-zinc-50/80 dark:border-[#141414] dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-zinc-500 dark:text-zinc-600">{footer.about}</p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={safeUrl(href)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary dark:border-[#1a1a1a] dark:bg-[#080808] dark:text-zinc-600 dark:hover:border-primary/30 dark:hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase dark:text-zinc-600">Pages</h4>
            <ul className="mt-4 space-y-2.5">
              {footer.links.map((l) => (
                <li key={l.label}>
                  {isExternal(l.href) ? (
                    <a href={safeUrl(l.href)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300">
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.href} className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase dark:text-zinc-600">Contact</h4>
            <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-600">{footer.contact}</p>
            {footer.email && (
              <a href={`mailto:${footer.email}`} className="mt-2 block text-[13px] font-medium text-primary hover:underline">
                {footer.email}
              </a>
            )}
            <ul className="mt-4 space-y-2">
              {footer.show_privacy && (
                <li><Link to="/privacy" className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300">Privacy Policy</Link></li>
              )}
              {footer.show_terms && (
                <li><Link to="/terms" className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300">Terms & Conditions</Link></li>
              )}
              <li><Link to="/disclaimer" className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-zinc-200/60 pt-10 dark:border-[#141414]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Stay updated</h4>
              <p className="mt-1 text-[13px] text-zinc-400 dark:text-zinc-600">New courses and notes, no spam.</p>
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
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-primary dark:border-[#1f1f1f] dark:bg-[#080808] dark:text-zinc-100 dark:placeholder:text-zinc-700 dark:focus:border-primary/60"
                  required
                />
                <button
                  type="submit"
                  disabled={newsletter.isPending}
                  className="h-9 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-200/60 pt-6 text-[12px] text-zinc-400 dark:border-[#141414] dark:text-zinc-700 sm:flex-row">
          <p>{(footer.copyright || `© {year} ${general.site_name}`).replace("{year}", String(year))}</p>
          <p className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? "bg-amber-500" : "bg-emerald-500"}`} />
            {isDemoMode ? "Demo mode" : "Production"}
          </p>
        </div>
      </div>
    </footer>
  );
}
