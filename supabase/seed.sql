-- =====================================================================
-- SRD Learn — seed data (runs after schema.sql via `supabase db reset`)
-- Pre-populates settings, categories and system pages for production.
-- =====================================================================

-- Default CMS settings (merged with the frontend defaults at runtime)
insert into public.settings (key, value) values
  ('general', '{"site_name":"SRD Learn","tagline":"Free courses, notes & resources for everyone","domain":"https://srd-learn.vercel.app","contact_email":"hello@srdlearn.app","telegram_channel":"https://t.me/srd_learn","youtube_channel":"https://youtube.com/@srdlearn","analytics_id":"","search_console":"","registration_enabled":true,"maintenance_mode":false,"maintenance_message":"We are performing scheduled maintenance. Please check back soon."}'::jsonb),
  ('hero', '{"title":"Learn anything. Completely free.","subtitle":"Curated video lectures, downloadable PDF notes and project resources — organised into clean, minimal courses you can start right now.","image":"","cta_text":"Browse Courses","cta_link":"/courses","secondary_cta_text":"Join Telegram","secondary_cta_link":"https://t.me/srd_learn"}'::jsonb),
  ('home', '{"show_featured":true,"show_latest":true,"show_popular":true,"show_categories":true,"show_testimonials":true,"featured_limit":6,"latest_limit":6,"popular_limit":4,"testimonials":[]}'::jsonb),
  ('navigation', '{"logo":"","menu":[{"label":"Home","href":"/"},{"label":"Courses","href":"/courses"},{"label":"Categories","href":"/categories"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}],"social_telegram":"https://t.me/srd_learn","social_youtube":"","social_github":"","social_twitter":"","announcement_enabled":false,"announcement_text":"","announcement_link":"","announcement_link_text":""}'::jsonb),
  ('footer', '{"about":"A minimal, free learning platform. Every course, note and resource is free — forever.","contact":"Have a question or want to contribute a course? Reach out anytime.","email":"hello@srdlearn.app","telegram":"https://t.me/srd_learn","youtube":"","github":"","copyright":"© {year} SRD Learn. Built with ❤️ for learners.","links":[{"label":"Courses","href":"/courses"},{"label":"Categories","href":"/categories"},{"label":"FAQ","href":"/faq"},{"label":"Contact","href":"/contact"}],"show_privacy":true,"show_terms":true}'::jsonb),
  ('seo', '{"site_title":"SRD Learn — Free Courses, Notes & Resources","title_template":"%s | SRD Learn","meta_description":"SRD Learn is a free, minimal course sharing platform with video lectures, PDF notes and downloadable resources for students.","keywords":"free courses, pdf notes, video lectures, programming, web development, study material","og_image":"","canonical_url":"https://srd-learn.vercel.app","twitter_handle":"","robots_txt":"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /profile","sitemap_enabled":true}'::jsonb),
  ('theme', '{"logo":"","favicon":"","primary_color":"#4f46e5","secondary_color":"#0ea5e9","font":"Inter","border_radius":"lg","default_mode":"system"}'::jsonb)
on conflict (key) do nothing;

-- Starter categories
insert into public.categories (name, slug, description, icon, color, sort_order) values
  ('Web Development', 'web-development', 'HTML, CSS, JavaScript, React and everything frontend & backend.', '💻', '#4f46e5', 1),
  ('Programming', 'programming', 'Core programming languages, algorithms and problem solving.', '⌨️', '#7c3aed', 2),
  ('Data Science', 'data-science', 'SQL, data analysis, statistics and machine learning basics.', '📊', '#0891b2', 3),
  ('Design', 'design', 'UI/UX, Figma, design systems and visual fundamentals.', '🎨', '#db2777', 4),
  ('DevOps & Tools', 'devops-tools', 'Git, Linux, deployment and developer productivity.', '🛠️', '#ea580c', 5),
  ('Mathematics', 'mathematics', 'Discrete maths, statistics and maths for programmers.', '📐', '#16a34a', 6)
on conflict (slug) do nothing;

-- System pages (editable from Admin → Pages)
insert into public.pages (slug, title, content, meta_description) values
  ('about', 'About', '# About us\n\nWelcome to our free learning platform.', 'About our platform'),
  ('contact', 'Contact Us', '# Contact Us\n\nWe usually reply within 24 hours.', 'Get in touch'),
  ('faq', 'Frequently Asked Questions', '## Is it free?\nYes, everything is free.', 'FAQ'),
  ('privacy', 'Privacy Policy', '# Privacy Policy\n\nWe only store your email and name.', 'Privacy policy'),
  ('terms', 'Terms & Conditions', '# Terms & Conditions\n\nContent is for personal educational use.', 'Terms'),
  ('disclaimer', 'Disclaimer', '# Disclaimer\n\nVideos are embedded from YouTube and Telegram.', 'Disclaimer')
on conflict (slug) do nothing;
