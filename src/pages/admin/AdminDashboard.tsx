import { Link } from "react-router-dom";
import { BookOpen, Eye, FileText, FolderOpen, HardDrive, Plus, TrendingUp, Upload, Users, Video } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useLogs, useStats } from "@/hooks/queries";
import { isDemoMode } from "@/services/adapter";
import { Badge, Card, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useStats();
  const { data: logs = [] } = useLogs();

  const cards = [
    { label: "Total users", value: stats?.users, icon: Users, to: "/admin/users", color: "bg-violet-500/10 text-violet-600" },
    { label: "Courses", value: stats?.courses, icon: BookOpen, to: "/admin/courses", color: "bg-primary/10 text-primary", sub: stats ? `${stats.published} live · ${stats.drafts} draft` : undefined },
    { label: "Video lessons", value: stats?.videos, icon: Video, to: "/admin/courses", color: "bg-red-500/10 text-red-500" },
    { label: "PDF notes", value: stats?.pdfs, icon: FileText, to: "/admin/courses", color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Resources", value: stats?.resources, icon: FolderOpen, to: "/admin/courses", color: "bg-amber-500/10 text-amber-600" },
    { label: "Total views", value: stats?.total_views, icon: Eye, to: "/admin/seo", color: "bg-sky-500/10 text-sky-600" },
  ];

  const maxViews = Math.max(1, ...(stats?.top_courses.map((c) => c.views) ?? [1]));

  return (
    <div>
      <Seo title="Admin Dashboard" noIndex />
      <PageHeader
        title="Dashboard"
        description="Overview of your platform's content, users and activity."
        actions={
          <LinkButton to="/admin/courses/new">
            <Plus className="h-4 w-4" /> New course
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </span>
            {isLoading ? <Skeleton className="mt-3 h-7 w-12" /> : <p className="mt-3 text-2xl font-bold">{(c.value ?? 0).toLocaleString()}</p>}
            <p className="text-xs text-zinc-500">{c.label}</p>
            {c.sub && <p className="mt-0.5 text-[11px] text-zinc-400">{c.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Upload className="h-4 w-4 text-primary" /> Latest uploads
            </h2>
            <Link to="/admin/courses" className="text-xs font-medium text-primary hover:underline">
              Manage content
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {(stats?.latest_uploads ?? []).map((u) => (
              <li key={`${u.type}-${u.id}`} className="flex items-center gap-3 py-2.5">
                <Badge className="w-20 justify-center capitalize">{u.type}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.title}</p>
                  {u.course_title && <p className="truncate text-xs text-zinc-500">{u.course_title}</p>}
                </div>
                <span className="shrink-0 text-xs text-zinc-400">{timeAgo(u.created_at)}</span>
              </li>
            ))}
            {!isLoading && stats?.latest_uploads.length === 0 && <li className="py-8 text-center text-sm text-zinc-500">No uploads yet.</li>}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Website analytics
            </h2>
            <div className="space-y-3">
              {(stats?.top_courses ?? []).map((c) => (
                <div key={c.slug}>
                  <div className="mb-1 flex justify-between text-xs">
                    <Link to={`/courses/${c.slug}`} className="truncate font-medium hover:text-primary">
                      {c.title}
                    </Link>
                    <span className="shrink-0 text-zinc-500">{c.views.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.max(4, (c.views / maxViews) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <HardDrive className="h-4 w-4 text-primary" /> Storage status
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Database</dt>
                <dd className="font-medium">{isDemoMode ? "Local (demo)" : "Supabase"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">File storage</dt>
                <dd className="font-medium">Telegram</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Telegram-linked files</dt>
                <dd className="font-medium">{stats?.telegram_files ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Video hosting</dt>
                <dd className="font-medium">YouTube / Telegram</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Storage cost</dt>
                <dd className="font-medium text-emerald-600">₹0 (free tier)</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link to="/admin/backup" className="text-xs font-medium text-primary hover:underline">
            All logs
          </Link>
        </div>
        <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          {logs.slice(0, 6).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate">
                <span className="text-zinc-500">{l.user_email}</span> · {l.details}
              </span>
              <span className="shrink-0 text-xs text-zinc-400">{timeAgo(l.created_at)}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="py-6 text-center text-zinc-500">No activity yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
