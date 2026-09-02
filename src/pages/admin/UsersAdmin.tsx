import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Search, Trash2, Users } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useUsers } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { isDemoMode } from "@/services/adapter";
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { formatDate, getErrorMessage } from "@/lib/utils";
import type { Profile, Role } from "@/types";

export default function UsersAdmin() {
  const { data: users = [], isLoading } = useUsers();
  const { user: me } = useAuth();
  const update = mutations.useUpdateUser();
  const remove = mutations.useDeleteUser();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<Profile | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return users.filter((u) => !term || u.email.toLowerCase().includes(term) || u.full_name.toLowerCase().includes(term));
  }, [users, q]);

  const patch = async (u: Profile, p: Partial<Profile>, msg: string) => {
    if (u.id === me?.id && (p.role === "student" || p.is_blocked)) return toast.error("You cannot change your own admin access.");
    try {
      await update.mutateAsync({ id: u.id, patch: p });
      toast.success(msg);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("User removed");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Seo title="Users · Admin" noIndex />
      <PageHeader title="Users" description={`${users.length} registered · ${users.filter((u) => u.role === "admin").length} admins · ${users.filter((u) => u.is_blocked).length} blocked`} />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="h-10 w-full rounded-[var(--radius)] border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No users found" />
      ) : (
        <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={u.full_name} src={u.avatar_url} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.full_name}
                      {u.id === me?.id && <Badge>You</Badge>}
                      {u.is_blocked && <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Blocked</Badge>}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {u.email} · Joined {formatDate(u.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={u.role} onChange={(e) => patch(u, { role: e.target.value as Role }, `Role changed to ${e.target.value}`)} className="h-9 rounded-[var(--radius)] border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" aria-label="Role">
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button size="sm" variant={u.is_blocked ? "outline" : "ghost"} onClick={() => patch(u, { is_blocked: !u.is_blocked }, u.is_blocked ? "User unblocked" : "User blocked")}>
                    {u.is_blocked ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" /> Block
                      </>
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => setDeleting(u)} disabled={u.id === me?.id} title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isDemoMode && <p className="mt-3 text-xs text-zinc-500">Note: deleting a profile removes the user's data. To fully delete the auth account, use the Supabase dashboard or a service-role function.</p>}

      <ConfirmDialog open={!!deleting} title={`Remove ${deleting?.email}?`} description="The user's profile will be deleted." confirmLabel="Delete user" loading={remove.isPending} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
    </div>
  );
}
