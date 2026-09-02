# SRD Learn — Minimal Course Sharing Platform (PWA)

A production-ready, mobile-first course sharing platform. Admins manage courses, video lessons (YouTube / Telegram embeds), PDF notes and resources (stored as Telegram links) through a complete CMS; students access everything for free.

## Stack

- **React 19 + Vite 7 + TypeScript + Tailwind CSS v4**
- **React Router** (lazy routes) · **TanStack React Query** (data & cache)
- **Supabase** (PostgreSQL + Auth: Email OTP, password, Google) with **Row Level Security**
- **Telegram** as zero-cost file storage (only links are stored in the DB)
- **PWA**: manifest, hand-rolled service worker (offline app shell, runtime caching), install prompt
- **SEO**: dynamic meta/OG/Twitter tags, canonical URLs, JSON-LD (WebSite, Course, FAQPage), robots.txt, sitemap generator
- Deploy target: **Vercel** (`vercel.json` includes SPA rewrites & secure headers)

## Quick start

Supabase is **optional** — without credentials the app runs in **demo mode** (local browser storage) and a clear banner at the top says "Demo mode". Add Supabase credentials to go production.

```bash
npm install
npm run dev
```

### Demo mode (no Supabase)

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set, the app runs with a **local browser-storage backend** seeded with sample content, so the whole UI (including the admin CMS) is usable immediately.

| Role    | Email             | Password     |
| ------- | ----------------- | ------------ |
| Admin   | `admin@srd.app`   | `admin123`   |
| Student | `student@srd.app` | `student123` |

Email-OTP demo code: `123456`.

### Production (Supabase)

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor (then `supabase/seed.sql` for starter content).
2. Enable **Email** (with OTP / magic link) and optionally **Google** under Authentication → Providers.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Sign up once, then promote yourself: `update public.profiles set role = 'admin' where email = 'you@example.com';`
5. `npm run build` → deploy `dist/` (or connect the repo to Vercel).

## Content & storage workflow

- **Videos**: paste a YouTube URL or a public Telegram post link (`https://t.me/channel/123`) in *Admin → Courses → Lessons*.
- **PDFs / ZIPs / notes**: upload the file to your Telegram channel, copy the post link and paste it into *PDF Notes* or *Resources*.
- **Images**: any direct image URL (Telegram, Imgur, Cloudinary…). Reusable links live in *Admin → Media*.

## Admin CMS

Dashboard · Courses (CRUD, publish/draft, featured, thumbnails, tags, categories, ordering) · Lessons / PDFs / Resources (ordering) · Categories · Pages (Markdown, FAQ format) · Users (roles, block, delete) · Home page (hero, sections, testimonials) · Navigation (logo, menu, socials, announcement bar) · Footer · SEO (meta, OG, canonical, robots.txt, sitemap download) · Theme (colors, font, radius, light/dark) · Settings (site identity, analytics, registration toggle, maintenance mode) · Media manager · Backup (export/import JSON, cache clear, activity logs).

## Project structure

```
src/
  components/   ui kit, layouts, course widgets, icons, guards
  data/         seed content & default CMS settings
  hooks/        auth, theme, toast, react-query hooks
  lib/          utils, markdown renderer (XSS-safe), SEO, supabase client
  pages/        public, student and admin pages (lazy loaded)
  services/     data adapter (local | supabase), domain API, auth service
supabase/schema.sql   tables, triggers, RPC, RLS policies
public/               manifest, service worker, icons, robots, sitemap
```

## User features

- **Bookmarks** — save any course for later (synced to your account; `public.bookmarks`).
- **Lesson progress** — mark lessons complete; a progress bar tracks each course (`public.lesson_progress`).
- **Contact form** — validated & stored server-side (`public.contact_messages`), with optional email notification via Resend.
- **Newsletter** — footer subscribe (`public.newsletter_subscribers`).
- **Error boundary**, offline fallback page, static OG tags for crawlers.

## Security notes

- All writes are protected by Supabase RLS (`is_admin()`), profile role/blocked columns are trigger-protected.
- No `dangerouslySetInnerHTML`; CMS Markdown renders to React elements and links are scheme-validated.
- Secure headers are set in `vercel.json`. Supabase handles JWT sessions, rate limiting and password hashing.
- Edge Functions validate input and rate-limit (5/min contact, 10/min newsletter).

## Production deployment (step-by-step)

### 1. Database + auth (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste & run `supabase/schema.sql` (creates tables, RLS, triggers, storage buckets).
3. Run `supabase/seed.sql` to pre-populate settings, categories and pages.
4. **Authentication → Providers**: enable **Email** (magic link/OTP), and optionally **Google** (add your OAuth client ID/secret).
5. (Optional) Enable **Email confirmation** and configure a custom SMTP for outgoing magic-link emails.

### 2. Edge Functions (contact + newsletter)

```bash
npm i -g supabase@latest
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy contact
supabase functions deploy newsletter
# optional email notifications:
supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_EMAIL=owner@yourdomain.com
```

> If you skip this step, the app falls back to direct DB inserts automatically.

### 3. Deploy the frontend (Vercel)

```bash
# option A — Git
#   connect the repo in Vercel; it auto-detects Vite and reads vercel.json (SPA rewrites + headers).

# option B — CLI
npm i -g vercel && vercel --prod
```

Add env vars in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.

### 4. Make yourself admin

Sign up on the live site, then run in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

### 5. CI/CD

`.github/workflows/ci.yml` type-checks and builds on every push/PR and uploads the `dist/` artifact.

### CLI reference

```bash
npm run dev        # local dev (requires .env with Supabase creds)
npm run build      # production build → dist/
npm run preview    # serve the build locally
supabase db reset  # reset local DB and re-run schema + seed
supabase functions deploy contact     # deploy the contact Edge Function
supabase functions deploy newsletter  # deploy the newsletter Edge Function
```
