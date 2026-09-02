import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/queries";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: "name" | "property", key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][data-seo]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    el.dataset.seo = "1";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Dynamic SEO: title, meta description, keywords, canonical, Open Graph,
 * Twitter cards and Schema.org JSON-LD. Works without a server (SPA).
 */
export function Seo({ title, description, image, type = "website", keywords, noIndex, jsonLd }: SeoProps) {
  const { data: settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    if (!settings) return;
    const { seo, general } = settings;
    const fullTitle = title ? (seo.title_template || "%s").replace("%s", title) : seo.site_title || general.site_name;
    const desc = description || seo.meta_description;
    const base = (seo.canonical_url || general.domain || window.location.origin).replace(/\/$/, "");
    const canonical = `${base}${location.pathname}`;
    const img = image || seo.og_image;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "keywords", keywords || seo.keywords);
    upsertMeta("name", "robots", noIndex ? "noindex,nofollow" : "index,follow");
    upsertLink("canonical", canonical);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:site_name", general.site_name);

    upsertMeta("name", "twitter:card", img ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
    upsertMeta("name", "twitter:site", seo.twitter_handle);

    const defaultLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: general.site_name,
      url: base,
      potentialAction: {
        "@type": "SearchAction",
        target: `${base}/courses?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };
    let script = document.getElementById("seo-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "seo-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd ?? defaultLd);
  }, [settings, title, description, image, type, keywords, noIndex, jsonLd, location.pathname]);

  return null;
}

/** Google Analytics loader (gtag) — only when an ID is configured. */
export function Analytics() {
  const { data: settings } = useSettings();
  const location = useLocation();
  const id = settings?.general.analytics_id?.trim();

  useEffect(() => {
    if (!id || !/^(G|UA|AW)-[A-Z0-9-]+$/i.test(id)) return;
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    if (!document.getElementById("ga-script")) {
      const s = document.createElement("script");
      s.id = "ga-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
      w.dataLayer = w.dataLayer || [];
      w.gtag = function gtag(...args: unknown[]) {
        w.dataLayer!.push(args);
      };
      w.gtag("js", new Date());
      w.gtag("config", id, { send_page_view: false });
    }
    w.gtag?.("event", "page_view", { page_path: location.pathname + location.search });
  }, [id, location.pathname, location.search]);

  useEffect(() => {
    const token = settings?.general.search_console?.trim();
    upsertMeta("name", "google-site-verification", token || undefined);
  }, [settings?.general.search_console]);

  return null;
}
