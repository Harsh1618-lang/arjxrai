import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Construction, Database, Download, Eraser, Trash2, Upload } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useLogs, useSaveSettings, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { backupApi } from "@/services/api";
import { isDemoMode } from "@/services/adapter";
import { Badge, Button, Card, ConfirmDialog, PageHeader, Toggle } from "@/components/ui";
import { downloadFile, formatDate, getErrorMessage, timeAgo } from "@/lib/utils";
import type { BackupPayload } from "@/types";

export default function BackupAdmin() {
  const { data: settings } = useSettings();
  const { data: logs = [] } = useLogs();
  const saveGeneral = useSaveSettings("general");
  const importM = mutations.useImportBackup();
  const clearLogs = mutations.useClearLogs();
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportDb = async () => {
    setExporting(true);
    try {
      const payload = await backupApi.exportAll();
      downloadFile(`srd-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupPayload;
      if (parsed.version !== 1 || !parsed.tables) throw new Error("Not a valid SRD backup file");
      setPendingImport(parsed);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doImport = async () => {
    if (!pendingImport) return;
    try {
      await importM.mutateAsync(pendingImport);
      toast.success("Database imported");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setPendingImport(null);
    }
  };

  const clearCache = async () => {
    qc.clear();
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    toast.success("Cache cleared — reloading");
    setTimeout(() => window.location.reload(), 600);
  };

  const resetDemo = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("srd_db_"))
      .forEach((k) => localStorage.removeItem(k));
    toast.success("Demo data reset — reloading");
    setTimeout(() => window.location.reload(), 600);
  };

  const toggleMaintenance = async (on: boolean) => {
    if (!settings) return;
    try {
      await saveGeneral.mutateAsync({ ...settings.general, maintenance_mode: on });
      toast.success(on ? "Maintenance mode enabled" : "Maintenance mode disabled");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div>
      <Seo title="Backup · Admin" noIndex />
      <PageHeader title="Backup & system" description="Export or import the database, clear caches, toggle maintenance and review activity logs." />

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4 text-primary" /> Database
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Backend: <b>{isDemoMode ? "Local browser storage (demo)" : "Supabase PostgreSQL"}</b>. Backups include settings, categories, courses, lessons, PDFs, resources, pages and media.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={exportDb} loading={exporting}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Construction className="h-4 w-4 text-primary" /> Maintenance mode
          </h3>
          <p className="mt-1 text-xs text-zinc-500">Show a maintenance screen to visitors while you make changes. Admins keep full access.</p>
          <div className="mt-4">
            <Toggle label={settings?.general.maintenance_mode ? "Maintenance is ON" : "Maintenance is OFF"} checked={!!settings?.general.maintenance_mode} onChange={toggleMaintenance} disabled={saveGeneral.isPending} />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Eraser className="h-4 w-4 text-primary" /> Cache
          </h3>
          <p className="mt-1 text-xs text-zinc-500">Clears the in-memory data cache and the service worker's offline caches, then reloads.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearCache}>
              <Eraser className="h-4 w-4" /> Clear cache
            </Button>
            {isDemoMode && (
              <Button variant="outline" className="text-red-600" onClick={() => setConfirmReset(true)}>
                <Trash2 className="h-4 w-4" /> Reset demo data
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4 text-primary" /> Health
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Service worker</dt><dd className="font-medium">{"serviceWorker" in navigator ? "Supported" : "Unavailable"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Online</dt><dd className="font-medium">{navigator.onLine ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Installed (standalone)</dt><dd className="font-medium">{window.matchMedia("(display-mode: standalone)").matches ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Activity logs</dt><dd className="font-medium">{logs.length}</dd></div>
          </dl>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Activity logs</h3>
          <Button size="sm" variant="ghost" onClick={() => clearLogs.mutateAsync().then(() => toast.success("Logs cleared"))} disabled={logs.length === 0}>
            Clear logs
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap py-2 pr-4 text-zinc-500" title={formatDate(l.created_at)}>{timeAgo(l.created_at)}</td>
                  <td className="whitespace-nowrap py-2 pr-4">{l.user_email}</td>
                  <td className="py-2 pr-4"><Badge className="capitalize">{l.action} · {l.entity}</Badge></td>
                  <td className="py-2">{l.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">No activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!pendingImport}
        title="Import backup?"
        description={`This will replace existing content with the backup from ${pendingImport ? formatDate(pendingImport.exported_at) : ""}. Export a backup first if you're unsure.`}
        confirmLabel="Import & replace"
        loading={importM.isPending}
        onConfirm={doImport}
        onClose={() => setPendingImport(null)}
      />
      <ConfirmDialog open={confirmReset} title="Reset demo data?" description="All local changes will be discarded and the seed data restored." confirmLabel="Reset" onConfirm={resetDemo} onClose={() => setConfirmReset(false)} />
    </div>
  );
}
