import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, Save, ShieldCheck } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { auth } from "@/services/auth";
import { Avatar, Badge, Button, Card, Input, PageHeader } from "@/components/ui";
import { formatDate, getErrorMessage, isSafeUrl } from "@/lib/utils";

export default function Profile() {
  const { user, setUser, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.full_name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar_url ?? "");
  const [busy, setBusy] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  if (!user) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Name must be at least 2 characters.");
    if (avatar && !isSafeUrl(avatar)) return toast.error("Avatar must be a valid URL.");
    setBusy(true);
    try {
      const updated = await auth.updateProfile(user.id, { full_name: name.trim(), avatar_url: avatar.trim() || null });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match.");
    setPasswordBusy(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Seo title="Profile" noIndex />
      <PageHeader eyebrow="Account" title="Your profile" description="Update how you appear across the platform." />

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name || user.full_name} src={avatar || null} size="lg" />
          <div>
            <p className="text-lg font-semibold">{user.full_name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge className="capitalize">
                <ShieldCheck className="h-3 w-3" /> {user.role}
              </Badge>
              <span className="text-xs text-zinc-400">Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={save} className="mt-8 space-y-5">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Avatar URL" type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" hint="Paste a link to an image (optional)." />
          <Input label="Email" value={user.email} disabled hint="Email is managed by your login provider." />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button type="submit" loading={busy}>
              <Save className="h-4 w-4" /> Save changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => signOut().then(() => navigate("/"))}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password Card */}
      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-primary" />
          Change Password
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Update your password to keep your account secure.</p>
        <form onSubmit={changePassword} className="mt-6 space-y-4">
          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={passwordBusy}>
              <KeyRound className="h-4 w-4" /> Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
