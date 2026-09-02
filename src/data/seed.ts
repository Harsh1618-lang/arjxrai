import type {
  ActivityLog,
  Category,
  Course,
  Lesson,
  MediaItem,
  Page,
  Pdf,
  Profile,
  Resource,
  SiteSettings,
} from "@/types";

const img = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

export const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: "SRD Learn",
    tagline: "Free courses, notes & resources for everyone",
    domain: "https://srd-learn.vercel.app",
    contact_email: "hello@srdlearn.app",
    telegram_channel: "https://t.me/srd_learn",
    youtube_channel: "https://youtube.com/@srdlearn",
    analytics_id: "",
    search_console: "",
    registration_enabled: true,
    maintenance_mode: false,
    maintenance_message: "We are performing scheduled maintenance. Please check back soon.",
  },
  hero: {
    title: "Learn anything. Completely free.",
    subtitle:
      "Curated video lectures, downloadable PDF notes and project resources — organised into clean, minimal courses you can start right now.",
    image: img(7776433),
    cta_text: "Browse Courses",
    cta_link: "/courses",
    secondary_cta_text: "Join Telegram",
    secondary_cta_link: "https://t.me/srd_learn",
  },
  home: {
    show_featured: true,
    show_latest: true,
    show_popular: true,
    show_categories: true,
    show_testimonials: true,
    featured_limit: 6,
    latest_limit: 6,
    popular_limit: 4,
    testimonials: [
      { name: "Aarav Sharma", role: "B.Tech Student", text: "The PDF notes and playlists are perfectly organised. I finished the JavaScript course in two weeks." },
      { name: "Priya Verma", role: "Self-taught Developer", text: "Minimal, fast and completely free. This is the cleanest learning platform I have used." },
      { name: "Rohan Gupta", role: "Data Analyst", text: "SQL course + resources helped me crack my first interview. Highly recommended!" },
    ],
  },
  navigation: {
    logo: "",
    menu: [
      { label: "Home", href: "/" },
      { label: "Courses", href: "/courses" },
      { label: "Categories", href: "/categories" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    social_telegram: "https://t.me/srd_learn",
    social_youtube: "https://youtube.com/@srdlearn",
    social_github: "https://github.com/srd-learn",
    social_twitter: "",
    announcement_enabled: true,
    announcement_text: "🎉 New: Data Structures & Algorithms course with 40+ practice PDFs is live!",
    announcement_link: "/courses/data-structures-and-algorithms",
    announcement_link_text: "Start learning",
  },
  footer: {
    about: "SRD Learn is a minimal, open learning platform. Every course, note and resource is free — forever.",
    contact: "Have a question or want to contribute a course? Reach out anytime.",
    email: "hello@srdlearn.app",
    telegram: "https://t.me/srd_learn",
    youtube: "https://youtube.com/@srdlearn",
    github: "https://github.com/srd-learn",
    copyright: "© {year} SRD Learn. Built with ❤️ for learners.",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Categories", href: "/categories" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
    show_privacy: true,
    show_terms: true,
  },
  seo: {
    site_title: "SRD Learn — Free Courses, Notes & Resources",
    title_template: "%s | SRD Learn",
    meta_description:
      "SRD Learn is a free, minimal course sharing platform with video lectures, PDF notes and downloadable resources for students.",
    keywords: "free courses, pdf notes, video lectures, programming, web development, study material",
    og_image: img(7776433),
    canonical_url: "https://srd-learn.vercel.app",
    twitter_handle: "@srdlearn",
    robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /profile\n\nSitemap: https://srd-learn.vercel.app/sitemap.xml",
    sitemap_enabled: true,
  },
  theme: {
    logo: "",
    favicon: "",
    primary_color: "#4f46e5",
    secondary_color: "#0ea5e9",
    font: "Inter",
    border_radius: "lg",
    default_mode: "dark",
  },
};

const d = (s: string) => new Date(s).toISOString();

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-web", name: "Web Development", slug: "web-development", description: "HTML, CSS, JavaScript, React and everything frontend & backend.", icon: "💻", color: "#4f46e5", sort_order: 1, created_at: d("2025-01-05") },
  { id: "cat-prog", name: "Programming", slug: "programming", description: "Core programming languages, algorithms and problem solving.", icon: "⌨️", color: "#7c3aed", sort_order: 2, created_at: d("2025-01-05") },
  { id: "cat-data", name: "Data Science", slug: "data-science", description: "SQL, data analysis, statistics and machine learning basics.", icon: "📊", color: "#0891b2", sort_order: 3, created_at: d("2025-01-05") },
  { id: "cat-design", name: "Design", slug: "design", description: "UI/UX, Figma, design systems and visual fundamentals.", icon: "🎨", color: "#db2777", sort_order: 4, created_at: d("2025-01-05") },
  { id: "cat-tools", name: "DevOps & Tools", slug: "devops-tools", description: "Git, Linux, deployment and developer productivity.", icon: "🛠️", color: "#ea580c", sort_order: 5, created_at: d("2025-01-05") },
  { id: "cat-math", name: "Mathematics", slug: "mathematics", description: "Discrete maths, statistics and maths for programmers.", icon: "📐", color: "#16a34a", sort_order: 6, created_at: d("2025-01-05") },
];

export const SEED_COURSES: Course[] = [
  {
    id: "course-js", title: "JavaScript Fundamentals", slug: "javascript-fundamentals",
    short_description: "Master the language of the web from variables to async programming.",
    description: "## What you'll learn\n\n- Variables, data types and operators\n- Functions, scope and closures\n- Arrays, objects and modern ES6+ syntax\n- DOM manipulation and events\n- Promises, async/await and the Fetch API\n\n## Who is this for?\n\nComplete beginners who want a **solid foundation** in JavaScript before moving to frameworks like React or Node.js.\n\n> Practice daily. Every lesson has a matching PDF with exercises.",
    thumbnail: img(5483077), banner: img(5483077), category_id: "cat-web",
    tags: ["javascript", "frontend", "beginner"], instructor: "SRD Team", status: "published", is_featured: true, sort_order: 1, views: 1840,
    created_at: d("2025-02-10"), updated_at: d("2025-02-10"),
  },
  {
    id: "course-py", title: "Python for Beginners", slug: "python-for-beginners",
    short_description: "A gentle, project-based introduction to Python programming.",
    description: "## Course overview\n\nPython is the most beginner-friendly language and the backbone of data science and automation.\n\n- Syntax, variables and control flow\n- Lists, dictionaries and comprehensions\n- Functions, modules and packages\n- File handling and error handling\n- Mini projects: calculator, to-do CLI, web scraper\n\n## Prerequisites\n\nNone. Just a laptop and curiosity.",
    thumbnail: img(5474295), banner: img(5474295), category_id: "cat-prog",
    tags: ["python", "beginner", "automation"], instructor: "SRD Team", status: "published", is_featured: true, sort_order: 2, views: 2210,
    created_at: d("2025-03-02"), updated_at: d("2025-03-02"),
  },
  {
    id: "course-css", title: "Modern CSS & Responsive Design", slug: "modern-css-responsive-design",
    short_description: "Flexbox, Grid, animations and mobile-first layouts explained simply.",
    description: "## Build beautiful, responsive interfaces\n\n- The box model, selectors and specificity\n- Flexbox and CSS Grid layouts\n- Responsive design with media queries\n- Transitions, animations and transforms\n- CSS variables and modern best practices\n\nAll notes include **copy-paste ready snippets**.",
    thumbnail: img(37476297), banner: img(37476297), category_id: "cat-web",
    tags: ["css", "frontend", "design"], instructor: "SRD Team", status: "published", is_featured: false, sort_order: 3, views: 960,
    created_at: d("2025-04-15"), updated_at: d("2025-04-15"),
  },
  {
    id: "course-html", title: "HTML Crash Course", slug: "html-crash-course",
    short_description: "Everything you need to structure web pages the right way.",
    description: "## Start here\n\nHTML is the skeleton of every website. In this short course you will learn semantic tags, forms, tables, media embedding and accessibility basics.\n\n- Document structure\n- Semantic elements\n- Forms & validation\n- Images, audio & video\n- Accessibility essentials",
    thumbnail: img(574077), banner: img(574077), category_id: "cat-web",
    tags: ["html", "frontend", "beginner"], instructor: "SRD Team", status: "published", is_featured: false, sort_order: 4, views: 1320,
    created_at: d("2025-01-20"), updated_at: d("2025-01-20"),
  },
  {
    id: "course-sql", title: "SQL & Databases", slug: "sql-and-databases",
    short_description: "Query, model and manage relational data with confidence.",
    description: "## From SELECT to JOINs\n\n- Relational database concepts\n- SELECT, WHERE, ORDER BY, GROUP BY\n- JOINs and subqueries\n- Indexes, constraints and normalisation\n- Practical PostgreSQL & MySQL examples\n\nIncludes **50 practice questions** with solutions in PDF format.",
    thumbnail: img(546819), banner: img(546819), category_id: "cat-data",
    tags: ["sql", "database", "postgresql"], instructor: "SRD Team", status: "published", is_featured: true, sort_order: 5, views: 1575,
    created_at: d("2025-05-08"), updated_at: d("2025-05-08"),
  },
  {
    id: "course-git", title: "Git & GitHub Essentials", slug: "git-and-github-essentials",
    short_description: "Version control workflows every developer must know.",
    description: "## Collaborate like a pro\n\n- Installing and configuring Git\n- Commits, branches and merges\n- Resolving conflicts\n- Pull requests and code review\n- GitHub Pages & Actions basics",
    thumbnail: img(34803994), banner: img(34803994), category_id: "cat-tools",
    tags: ["git", "github", "tools"], instructor: "SRD Team", status: "published", is_featured: false, sort_order: 6, views: 740,
    created_at: d("2025-06-01"), updated_at: d("2025-06-01"),
  },
  {
    id: "course-dsa", title: "Data Structures & Algorithms", slug: "data-structures-and-algorithms",
    short_description: "Arrays to graphs — with 40+ practice PDFs for interviews.",
    description: "## Crack coding interviews\n\n- Big-O notation and complexity analysis\n- Arrays, strings, linked lists\n- Stacks, queues, hash maps\n- Trees, heaps and graphs\n- Sorting, searching, recursion and dynamic programming\n\nEach topic ships with a **practice sheet** and solutions.",
    thumbnail: img(574069), banner: img(574069), category_id: "cat-prog",
    tags: ["dsa", "algorithms", "interview"], instructor: "SRD Team", status: "published", is_featured: true, sort_order: 7, views: 2980,
    created_at: d("2025-08-20"), updated_at: d("2025-08-20"),
  },
  {
    id: "course-react", title: "React for Beginners", slug: "react-for-beginners",
    short_description: "Components, hooks, routing and state — build real apps with React.",
    description: "## Modern React, simply explained\n\n- JSX and components\n- Props, state and events\n- Hooks: useState, useEffect, useContext\n- React Router and data fetching\n- Building and deploying a project\n\nPrerequisite: **JavaScript Fundamentals**.",
    thumbnail: img(34804000), banner: img(34804000), category_id: "cat-web",
    tags: ["react", "frontend", "javascript"], instructor: "SRD Team", status: "published", is_featured: true, sort_order: 8, views: 2650,
    created_at: d("2025-09-12"), updated_at: d("2025-09-12"),
  },
  {
    id: "course-node", title: "Node.js & Express", slug: "nodejs-and-express",
    short_description: "Build REST APIs and backend services with JavaScript.",
    description: "## Backend with JavaScript\n\n- Node.js runtime & npm\n- Express routing and middleware\n- REST API design\n- Authentication & environment config\n- Deploying to free hosting",
    thumbnail: img(6424588), banner: img(6424588), category_id: "cat-web",
    tags: ["nodejs", "backend", "api"], instructor: "SRD Team", status: "published", is_featured: false, sort_order: 9, views: 880,
    created_at: d("2025-10-05"), updated_at: d("2025-10-05"),
  },
  {
    id: "course-uiux", title: "UI/UX Design Basics", slug: "ui-ux-design-basics",
    short_description: "Design principles, Figma workflow and building a portfolio.",
    description: "## Coming soon\n\nThis course is currently in draft while we finalise the lesson recordings.",
    thumbnail: img(3775128), banner: img(3775128), category_id: "cat-design",
    tags: ["design", "figma", "ux"], instructor: "SRD Team", status: "draft", is_featured: false, sort_order: 10, views: 0,
    created_at: d("2026-01-15"), updated_at: d("2026-01-15"),
  },
];

const lesson = (id: string, course_id: string, title: string, video_url: string, sort_order: number, duration: string, description = "", video_type: "youtube" | "telegram" = "youtube", created_at = "2025-06-01"): Lesson => ({
  id, course_id, title, description, video_type, video_url, duration, sort_order, created_at: d(created_at),
});

export const SEED_LESSONS: Lesson[] = [
  lesson("l-js-1", "course-js", "JavaScript Full Course for Beginners", "https://www.youtube.com/watch?v=PkZNo7MFNFg", 1, "3h 26m", "Complete walkthrough of JavaScript basics: variables, functions, loops, arrays and objects.", "youtube", "2025-02-10"),
  lesson("l-js-2", "course-js", "DOM Manipulation & Events (Telegram)", "https://t.me/srd_learn/42", 2, "48m", "Bonus lecture hosted on our Telegram channel covering DOM selection, events and forms.", "telegram", "2025-02-12"),
  lesson("l-py-1", "course-py", "Python Full Course for Beginners", "https://www.youtube.com/watch?v=rfscVS0vtbw", 1, "4h 26m", "Learn Python from scratch — installation, syntax, data structures and more.", "youtube", "2025-03-02"),
  lesson("l-py-2", "course-py", "Python in 1 Hour — Quick Revision", "https://www.youtube.com/watch?v=kqtD5dpn9C8", 2, "1h 00m", "A fast revision of the core concepts before starting projects.", "youtube", "2025-03-04"),
  lesson("l-css-1", "course-css", "CSS Tutorial — Full Course", "https://www.youtube.com/watch?v=1Rs2ND1ryYc", 1, "11h 00m", "Comprehensive CSS course covering layout, responsive design and animations.", "youtube", "2025-04-15"),
  lesson("l-html-1", "course-html", "HTML Full Course — Build a Website", "https://www.youtube.com/watch?v=pQN-pnXPaVg", 1, "2h 02m", "Build a complete website while learning every important HTML tag.", "youtube", "2025-01-20"),
  lesson("l-sql-1", "course-sql", "SQL Tutorial — Full Database Course", "https://www.youtube.com/watch?v=HXV3zeQKqGY", 1, "4h 20m", "Relational databases, SQL syntax, joins, and database design.", "youtube", "2025-05-08"),
  lesson("l-git-1", "course-git", "Git and GitHub for Beginners — Crash Course", "https://www.youtube.com/watch?v=RGOj5yH7evk", 1, "1h 08m", "Version control basics, branching, merging and GitHub workflow.", "youtube", "2025-06-01"),
  lesson("l-dsa-1", "course-dsa", "Algorithms and Data Structures — Full Course", "https://www.youtube.com/watch?v=8hly31xKli0", 1, "5h 22m", "Big-O, arrays, linked lists, trees, graphs, sorting and searching.", "youtube", "2025-08-20"),
  lesson("l-dsa-2", "course-dsa", "Dynamic Programming Masterclass (Telegram)", "https://t.me/srd_learn/57", 2, "1h 40m", "Recorded live session on DP patterns with solved problems.", "telegram", "2026-01-20"),
  lesson("l-react-1", "course-react", "React Course — Beginner's Tutorial", "https://www.youtube.com/watch?v=bMknfKXIFA8", 1, "11h 55m", "Build 8 projects while learning React fundamentals and hooks.", "youtube", "2025-09-12"),
  lesson("l-node-1", "course-node", "Node.js and Express.js — Full Course", "https://www.youtube.com/watch?v=Oe421EPjeBE", 1, "8h 16m", "Learn Node.js and Express by building real backend projects.", "youtube", "2025-10-05"),
];

const pdf = (id: string, course_id: string, title: string, description: string, file_url: string, file_size: string, sort_order: number, created_at = "2025-06-01"): Pdf => ({
  id, course_id, title, description, file_url, file_size, sort_order, created_at: d(created_at),
});

export const SEED_PDFS: Pdf[] = [
  pdf("p-js-1", "course-js", "JavaScript Cheat Sheet", "Quick reference of syntax, array & string methods.", "https://t.me/srd_notes/101", "1.2 MB", 1, "2025-02-11"),
  pdf("p-js-2", "course-js", "ES6+ Features Notes", "Arrow functions, destructuring, modules, classes.", "https://t.me/srd_notes/102", "2.4 MB", 2, "2025-02-14"),
  pdf("p-py-1", "course-py", "Python Basics Notes", "Chapter-wise notes with examples and exercises.", "https://t.me/srd_notes/110", "3.1 MB", 1, "2025-03-03"),
  pdf("p-css-1", "course-css", "Flexbox & Grid Cheat Sheet", "Visual reference for every Flexbox and Grid property.", "https://t.me/srd_notes/120", "900 KB", 1, "2025-04-16"),
  pdf("p-html-1", "course-html", "HTML Tags Reference", "Every semantic element explained with examples.", "https://t.me/srd_notes/130", "750 KB", 1, "2025-01-21"),
  pdf("p-sql-1", "course-sql", "SQL Practice Questions (50)", "50 questions with detailed solutions.", "https://t.me/srd_notes/140", "1.8 MB", 1, "2025-05-09"),
  pdf("p-sql-2", "course-sql", "Database Normalisation Notes", "1NF to BCNF with worked examples.", "https://t.me/srd_notes/141", "1.1 MB", 2, "2025-05-12"),
  pdf("p-dsa-1", "course-dsa", "DSA Practice Sheet — Arrays & Strings", "40 curated problems with hints.", "https://t.me/srd_notes/150", "2.2 MB", 1, "2025-08-21"),
  pdf("p-dsa-2", "course-dsa", "Trees & Graphs Notes", "Traversals, BFS/DFS, shortest paths.", "https://t.me/srd_notes/151", "2.9 MB", 2, "2025-08-25"),
  pdf("p-dsa-3", "course-dsa", "Dynamic Programming Patterns", "Top 20 DP patterns for interviews.", "https://t.me/srd_notes/152", "1.6 MB", 3, "2026-01-22"),
  pdf("p-react-1", "course-react", "React Hooks Cheat Sheet", "useState, useEffect, useMemo, custom hooks.", "https://t.me/srd_notes/160", "1.0 MB", 1, "2025-09-13"),
  pdf("p-git-1", "course-git", "Git Commands Cheat Sheet", "Most used Git commands on one page.", "https://t.me/srd_notes/170", "400 KB", 1, "2025-06-02"),
];

const res = (id: string, course_id: string, title: string, description: string, type: Resource["type"], url: string, sort_order: number, created_at = "2025-06-01"): Resource => ({
  id, course_id, title, description, type, url, sort_order, created_at: d(created_at),
});

export const SEED_RESOURCES: Resource[] = [
  res("r-js-1", "course-js", "Project Starter Files (ZIP)", "Starter code for all exercises.", "zip", "https://t.me/srd_files/201", 1, "2025-02-11"),
  res("r-js-2", "course-js", "MDN JavaScript Guide", "Official reference documentation.", "link", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", 2, "2025-02-11"),
  res("r-py-1", "course-py", "Mini Projects Source Code", "All mini projects in a single ZIP.", "zip", "https://t.me/srd_files/210", 1, "2025-03-03"),
  res("r-py-2", "course-py", "Official Python Docs", "python.org tutorial.", "link", "https://docs.python.org/3/tutorial/", 2, "2025-03-03"),
  res("r-css-1", "course-css", "Layout Examples Collection", "20 responsive layout demos.", "zip", "https://t.me/srd_files/220", 1, "2025-04-16"),
  res("r-sql-1", "course-sql", "Sample Database (SQL dump)", "Import to practise queries locally.", "document", "https://t.me/srd_files/240", 1, "2025-05-09"),
  res("r-dsa-1", "course-dsa", "Complexity Chart (Image)", "Big-O complexity comparison chart.", "image", "https://t.me/srd_files/250", 1, "2025-08-21"),
  res("r-dsa-2", "course-dsa", "Handwritten Notes", "Complete handwritten notes bundle.", "notes", "https://t.me/srd_files/251", 2, "2025-08-22"),
  res("r-dsa-3", "course-dsa", "Practice Channel", "Daily problems on Telegram.", "telegram", "https://t.me/srd_learn", 3, "2025-08-22"),
  res("r-react-1", "course-react", "Project Repositories", "GitHub repos for all 8 projects.", "link", "https://github.com/srd-learn", 1, "2025-09-13"),
  res("r-node-1", "course-node", "API Boilerplate (ZIP)", "Express starter with auth setup.", "zip", "https://t.me/srd_files/270", 1, "2025-10-06"),
];

export const SEED_PAGES: Page[] = [
  {
    id: "page-about", slug: "about", title: "About SRD Learn", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "SRD Learn is a free, minimal course sharing platform built for students.",
    content: "# About SRD Learn\n\nSRD Learn started with one simple idea: **quality education should be free and beautifully organised**.\n\nWe curate the best video lectures, write concise PDF notes and bundle practical resources into clean, distraction-free courses.\n\n## What we offer\n\n- Video lectures embedded from YouTube & Telegram\n- Downloadable PDF notes and cheat sheets\n- Project files, links and study material\n- A fast, installable web app that works on any device\n\n## Our promise\n\n- No paywalls, no ads inside lessons\n- Mobile-first, fast and accessible\n- Continuously updated content\n\n> Learning should feel light. That's why everything here is minimal.",
  },
  {
    id: "page-contact", slug: "contact", title: "Contact Us", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "Get in touch with the SRD Learn team.",
    content: "# Contact Us\n\nWe usually reply within **24 hours**. For quick questions, our Telegram community is the fastest way to reach us.\n\n- Course requests\n- Broken links or missing files\n- Partnership & contribution",
  },
  {
    id: "page-faq", slug: "faq", title: "Frequently Asked Questions", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "Answers to common questions about SRD Learn.",
    content: "## Is SRD Learn really free?\nYes. Every course, PDF and resource is 100% free. You only need an account to watch videos and download files.\n\n## How do I download PDF notes?\nOpen any course, go to the **PDF Notes** tab and click *Open*. Files are hosted on our Telegram channel, so make sure Telegram is installed or open the link in a browser.\n\n## Can I install this as an app?\nYes! SRD Learn is a Progressive Web App. Use *Install App* from the banner or your browser menu → *Add to Home Screen*.\n\n## Videos are not playing. What should I do?\nCheck your internet connection and make sure YouTube is not blocked on your network. Telegram-hosted lectures open inside Telegram.\n\n## How can I request a course?\nUse the **Contact** page or message us on Telegram with the topic you would like covered.\n\n## I found a broken link.\nPlease report it via the Contact page with the course name — we fix links quickly.",
  },
  {
    id: "page-privacy", slug: "privacy", title: "Privacy Policy", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "How SRD Learn collects and uses your data.",
    content: "# Privacy Policy\n\n*Last updated: January 2025*\n\n## Information we collect\n\n- **Account data**: your email address and name when you register.\n- **Usage data**: anonymous analytics such as pages viewed and course popularity.\n\n## How we use it\n\n- To provide access to courses and resources\n- To improve the platform and content\n- To send important account notifications\n\n## What we never do\n\n- We never sell your data\n- We never show third-party ads inside lessons\n\n## Third-party services\n\nVideos are embedded from YouTube and Telegram, and files are hosted on Telegram. Their privacy policies apply when you interact with those services.\n\n## Contact\n\nFor privacy questions email us at hello@srdlearn.app.",
  },
  {
    id: "page-terms", slug: "terms", title: "Terms & Conditions", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "Terms of use for SRD Learn.",
    content: "# Terms & Conditions\n\nBy using SRD Learn you agree to the following terms.\n\n## Use of content\n\n- All content is provided for **personal, educational use**.\n- Do not redistribute PDFs or resources commercially.\n- Respect the copyright of original creators.\n\n## Accounts\n\n- Keep your login credentials secure.\n- Accounts violating these terms may be blocked.\n\n## Availability\n\nWe strive for 99% uptime but do not guarantee uninterrupted access.\n\n## Changes\n\nWe may update these terms; continued use means acceptance.",
  },
  {
    id: "page-disclaimer", slug: "disclaimer", title: "Disclaimer", is_published: true, updated_at: d("2025-01-10"),
    meta_description: "Content disclaimer for SRD Learn.",
    content: "# Disclaimer\n\nSRD Learn curates publicly available educational videos and shares community-created notes.\n\n- We do not host videos; they are embedded from YouTube and Telegram.\n- Credit for videos belongs to the original creators.\n- If you are a content owner and want something removed, contact us and we will act promptly.",
  },
];

export const SEED_PROFILES: Profile[] = [
  { id: "user-admin", email: "admin@srd.app", full_name: "SRD Admin", avatar_url: null, role: "admin", is_blocked: false, created_at: d("2025-01-01") },
  { id: "user-student", email: "student@srd.app", full_name: "Demo Student", avatar_url: null, role: "student", is_blocked: false, created_at: d("2025-02-01") },
  { id: "user-3", email: "aarav@example.com", full_name: "Aarav Sharma", avatar_url: null, role: "student", is_blocked: false, created_at: d("2025-03-14") },
  { id: "user-4", email: "priya@example.com", full_name: "Priya Verma", avatar_url: null, role: "student", is_blocked: false, created_at: d("2025-05-22") },
  { id: "user-5", email: "rohan@example.com", full_name: "Rohan Gupta", avatar_url: null, role: "student", is_blocked: true, created_at: d("2025-07-30") },
];

export const SEED_MEDIA: MediaItem[] = [
  { id: "m-1", name: "Hero banner", url: img(7776433), type: "banner", created_at: d("2025-01-05") },
  { id: "m-2", name: "JavaScript thumbnail", url: img(5483077), type: "thumbnail", created_at: d("2025-02-10") },
  { id: "m-3", name: "Python thumbnail", url: img(5474295), type: "thumbnail", created_at: d("2025-03-02") },
  { id: "m-4", name: "DSA thumbnail", url: img(574069), type: "thumbnail", created_at: d("2025-08-20") },
  { id: "m-5", name: "Notes channel", url: "https://t.me/srd_notes", type: "telegram", created_at: d("2025-01-05") },
];

export const SEED_LOGS: ActivityLog[] = [
  { id: "log-1", action: "create", entity: "course", details: "Created course “Data Structures & Algorithms”", user_email: "admin@srd.app", created_at: d("2025-08-20") },
  { id: "log-2", action: "create", entity: "course", details: "Created course “React for Beginners”", user_email: "admin@srd.app", created_at: d("2025-09-12") },
  { id: "log-3", action: "update", entity: "settings", details: "Updated hero section", user_email: "admin@srd.app", created_at: d("2026-01-10") },
];

export const SEED_TABLES: Record<string, unknown[]> = {
  categories: SEED_CATEGORIES,
  courses: SEED_COURSES,
  lessons: SEED_LESSONS,
  pdfs: SEED_PDFS,
  resources: SEED_RESOURCES,
  pages: SEED_PAGES,
  profiles: SEED_PROFILES,
  media: SEED_MEDIA,
  activity_logs: SEED_LOGS,
  settings: [],
  bookmarks: [],
  lesson_progress: [],
  contact_messages: [],
  newsletter_subscribers: [],
};

/** Demo credentials for local (no-Supabase) mode. */
export const DEMO_CREDENTIALS: Record<string, string> = {
  "admin@srd.app": "admin123",
  "student@srd.app": "student123",
};
