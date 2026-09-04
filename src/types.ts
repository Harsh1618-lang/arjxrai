export type Role = "admin" | "student";
export type CourseStatus = "published" | "draft";
export type VideoType = "youtube" | "telegram" | "gdrive" | "direct" | "bunny";
export type ResourceType = "zip" | "notes" | "image" | "document" | "link" | "telegram";
export type MediaType = "image" | "logo" | "banner" | "thumbnail" | "telegram";
export type ThemeMode = "light" | "dark" | "system";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  is_blocked: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  thumbnail: string;
  banner: string;
  category_id: string | null;
  tags: string[];
  instructor: string;
  status: CourseStatus;
  is_featured: boolean;
  sort_order: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface CourseWithMeta extends Course {
  category: Category | null;
  lesson_count: number;
  pdf_count: number;
  resource_count: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_type: VideoType;
  video_url: string;
  duration: string;
  sort_order: number;
  created_at: string;
}

export interface Pdf {
  id: string;
  course_id: string;
  title: string;
  description: string;
  file_url: string;
  file_size: string;
  sort_order: number;
  created_at: string;
}

export interface Resource {
  id: string;
  course_id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  details: string;
  user_email: string;
  created_at: string;
}

export interface MenuItem {
  label: string;
  href: string;
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
}

export interface GeneralSettings {
  site_name: string;
  tagline: string;
  domain: string;
  contact_email: string;
  telegram_channel: string;
  youtube_channel: string;
  analytics_id: string;
  search_console: string;
  registration_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export interface HeroSettings {
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
}

export interface HomeSettings {
  show_featured: boolean;
  show_latest: boolean;
  show_popular: boolean;
  show_categories: boolean;
  show_testimonials: boolean;
  featured_limit: number;
  latest_limit: number;
  popular_limit: number;
  testimonials: Testimonial[];
}

export interface NavigationSettings {
  logo: string;
  menu: MenuItem[];
  social_telegram: string;
  social_youtube: string;
  social_github: string;
  social_twitter: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link: string;
  announcement_link_text: string;
}

export interface FooterSettings {
  about: string;
  contact: string;
  email: string;
  telegram: string;
  youtube: string;
  github: string;
  copyright: string;
  links: MenuItem[];
  show_privacy: boolean;
  show_terms: boolean;
}

export interface SeoSettings {
  site_title: string;
  title_template: string;
  meta_description: string;
  keywords: string;
  og_image: string;
  canonical_url: string;
  twitter_handle: string;
  robots_txt: string;
  sitemap_enabled: boolean;
}

export interface ThemeSettings {
  logo: string;
  favicon: string;
  primary_color: string;
  secondary_color: string;
  font: "Inter" | "Poppins" | "Roboto" | "Nunito" | "System";
  border_radius: "none" | "sm" | "md" | "lg" | "xl";
  default_mode: ThemeMode;
}

export interface SiteSettings {
  general: GeneralSettings;
  hero: HeroSettings;
  home: HomeSettings;
  navigation: NavigationSettings;
  footer: FooterSettings;
  seo: SeoSettings;
  theme: ThemeSettings;
}

export type SettingsSection = keyof SiteSettings;

export interface LatestUpload {
  id: string;
  type: "course" | "lesson" | "pdf" | "resource";
  title: string;
  course_title: string;
  created_at: string;
}

export interface Stats {
  users: number;
  courses: number;
  published: number;
  drafts: number;
  videos: number;
  pdfs: number;
  resources: number;
  categories: number;
  total_views: number;
  telegram_files: number;
  top_courses: { title: string; slug: string; views: number }[];
  latest_uploads: LatestUpload[];
}

export interface BackupPayload {
  version: number;
  exported_at: string;
  tables: Record<string, unknown[]>;
}

export interface Bookmark {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}
