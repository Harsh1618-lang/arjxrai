-- =====================================================================
-- SRD Learn — Supabase schema (PostgreSQL) with Row Level Security
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent-ish).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles (1:1 with auth.users)  ── roles: admin | student
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  avatar_url  text,
  role        text not null default 'student' check (role in ('admin','student')),
  is_blocked  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Optional granular permissions (future-ready; admins have everything).
create table if not exists public.roles (
  name        text primary key,
  description text
);
insert into public.roles(name, description) values ('admin','Full access'), ('student','Learner') on conflict do nothing;

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  role        text references public.roles(name) on delete cascade,
  permission  text not null,
  unique(role, permission)
);

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_blocked = false);
$$;

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Prevent non-admins from escalating role / unblocking themselves.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute procedure public.protect_profile_columns();

-- ---------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  icon        text not null default '📚',
  color       text not null default '#4f46e5',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  short_description text not null default '',
  description       text not null default '',
  thumbnail         text not null default '',
  banner            text not null default '',
  category_id       uuid references public.categories(id) on delete set null,
  tags              text[] not null default '{}',
  instructor        text not null default '',
  status            text not null default 'draft' check (status in ('draft','published')),
  is_featured       boolean not null default false,
  sort_order        int not null default 0,
  views             int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists courses_status_idx on public.courses(status);
create index if not exists courses_category_idx on public.courses(category_id);

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text not null default '',
  video_type  text not null default 'youtube' check (video_type in ('youtube','telegram')),
  video_url   text not null,
  duration    text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id);

create table if not exists public.pdfs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text not null default '',
  file_url    text not null,           -- Telegram post / file link
  file_size   text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pdfs_course_idx on public.pdfs(course_id);

create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text not null default '',
  type        text not null default 'link' check (type in ('zip','notes','image','document','link','telegram')),
  url         text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists resources_course_idx on public.resources(course_id);

create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  content          text not null default '',
  meta_description text not null default '',
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Site-wide CMS settings stored as JSON sections:
-- general | hero | home | navigation | footer | seo | theme
-- (covers homepage_sections, navigation, footer, announcements, seo_settings)
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  url        text not null,
  type       text not null default 'image' check (type in ('image','logo','banner','thumbnail','telegram')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  entity     text not null,
  details    text not null default '',
  user_email text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- View counter (callable by anyone, increments atomically)
-- ---------------------------------------------------------------------
create or replace function public.increment_course_views(p_course_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.courses set views = views + 1 where id = p_course_id;
$$;
grant execute on function public.increment_course_views(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.courses       enable row level security;
alter table public.lessons       enable row level security;
alter table public.pdfs          enable row level security;
alter table public.resources     enable row level security;
alter table public.pages         enable row level security;
alter table public.settings      enable row level security;
alter table public.media         enable row level security;
alter table public.activity_logs enable row level security;
alter table public.roles         enable row level security;
alter table public.permissions   enable row level security;

-- Profiles
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles for insert
  with check (auth.uid() = id);
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update
  using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles: admin delete" on public.profiles;
create policy "profiles: admin delete" on public.profiles for delete
  using (public.is_admin());

-- Public read for published content, admin write
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories for select using (true);
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses: public read published" on public.courses;
create policy "courses: public read published" on public.courses for select
  using (status = 'published' or public.is_admin());
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write" on public.courses for all using (public.is_admin()) with check (public.is_admin());

-- Lessons / PDFs / resources: metadata is public (titles shown to guests),
-- the actual video/file access is gated in the UI for logged-in users.
-- Tighten to `auth.role() = 'authenticated'` if you prefer server-side gating.
drop policy if exists "lessons: public read" on public.lessons;
create policy "lessons: public read" on public.lessons for select using (true);
drop policy if exists "lessons: admin write" on public.lessons;
create policy "lessons: admin write" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pdfs: public read" on public.pdfs;
create policy "pdfs: public read" on public.pdfs for select using (true);
drop policy if exists "pdfs: admin write" on public.pdfs;
create policy "pdfs: admin write" on public.pdfs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "resources: public read" on public.resources;
create policy "resources: public read" on public.resources for select using (true);
drop policy if exists "resources: admin write" on public.resources;
create policy "resources: admin write" on public.resources for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pages: public read" on public.pages;
create policy "pages: public read" on public.pages for select using (is_published or public.is_admin());
drop policy if exists "pages: admin write" on public.pages;
create policy "pages: admin write" on public.pages for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings: public read" on public.settings;
create policy "settings: public read" on public.settings for select using (true);
drop policy if exists "settings: admin write" on public.settings;
create policy "settings: admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media: admin all" on public.media;
create policy "media: admin all" on public.media for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "logs: admin read" on public.activity_logs;
create policy "logs: admin read" on public.activity_logs for select using (public.is_admin());
drop policy if exists "logs: authenticated insert" on public.activity_logs;
create policy "logs: authenticated insert" on public.activity_logs for insert with check (auth.uid() is not null);
drop policy if exists "logs: admin delete" on public.activity_logs;
create policy "logs: admin delete" on public.activity_logs for delete using (public.is_admin());

drop policy if exists "roles: public read" on public.roles;
create policy "roles: public read" on public.roles for select using (true);
drop policy if exists "permissions: admin" on public.permissions;
create policy "permissions: admin" on public.permissions for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: default system pages (edit them later from Admin → Pages)
-- ---------------------------------------------------------------------
insert into public.pages (slug, title, content, meta_description) values
  ('about', 'About', '# About us\n\nWelcome to our free learning platform.', 'About our platform'),
  ('contact', 'Contact Us', '# Contact Us\n\nWe usually reply within 24 hours.', 'Get in touch'),
  ('faq', 'Frequently Asked Questions', '## Is it free?\nYes, everything is free.\n\n## How do I download PDFs?\nOpen a course and use the PDF Notes tab.', 'FAQ'),
  ('privacy', 'Privacy Policy', '# Privacy Policy\n\nWe only store your email and name.', 'Privacy policy'),
  ('terms', 'Terms & Conditions', '# Terms & Conditions\n\nContent is for personal educational use.', 'Terms'),
  ('disclaimer', 'Disclaimer', '# Disclaimer\n\nVideos are embedded from YouTube and Telegram; credit belongs to the original creators.', 'Disclaimer')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- User features: bookmarks & lesson progress
-- ---------------------------------------------------------------------
create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
create index if not exists progress_user_idx on public.lesson_progress(user_id);

-- ---------------------------------------------------------------------
-- Contact messages & newsletter subscribers
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null default '',
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security for the new tables
-- ---------------------------------------------------------------------
alter table public.bookmarks              enable row level security;
alter table public.lesson_progress        enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "bookmarks: own crud" on public.bookmarks;
create policy "bookmarks: own crud" on public.bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress: own crud" on public.lesson_progress;
create policy "progress: own crud" on public.lesson_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contact: anyone insert" on public.contact_messages;
create policy "contact: anyone insert" on public.contact_messages for insert
  with check (true);
drop policy if exists "contact: admin read" on public.contact_messages;
create policy "contact: admin read" on public.contact_messages for select
  using (public.is_admin());
drop policy if exists "contact: admin manage" on public.contact_messages;
create policy "contact: admin manage" on public.contact_messages for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "contact: admin delete" on public.contact_messages;
create policy "contact: admin delete" on public.contact_messages for delete using (public.is_admin());

drop policy if exists "newsletter: anyone insert" on public.newsletter_subscribers;
create policy "newsletter: anyone insert" on public.newsletter_subscribers for insert
  with check (true);
drop policy if exists "newsletter: admin read" on public.newsletter_subscribers;
create policy "newsletter: admin read" on public.newsletter_subscribers for select
  using (public.is_admin());
drop policy if exists "newsletter: admin delete" on public.newsletter_subscribers;
create policy "newsletter: admin delete" on public.newsletter_subscribers for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage buckets (avatars + public media, e.g. uploaded thumbnails)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 5242880),
       ('media', 'media', true, 20971520)
on conflict (id) do nothing;

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects for select
  using (bucket_id = 'avatars');
drop policy if exists "avatars: auth upload" on storage.objects;
create policy "avatars: auth upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);
drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner) with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read" on storage.objects for select
  using (bucket_id = 'media');
drop policy if exists "media: admin write" on storage.objects;
create policy "media: admin write" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- Generic updated_at trigger (keeps updated_at accurate on every write)
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['categories','courses','lessons','pdfs','resources','pages','media','settings','profiles','activity_logs']
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Make yourself admin (replace the email):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------
