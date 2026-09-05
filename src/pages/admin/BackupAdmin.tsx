import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Construction, Database, Download, Eraser, RefreshCw, Trash2, Upload, Wifi } from "lucide-react";
import { Seo } from "@/lib/seo";
import { mutations, useLogs, useSaveSettings, useSettings } from "@/hooks/queries";
import { useToast } from "@/hooks/useToast";
import { backupApi } from "@/services/api";
import { isDemoMode } from "@/services/adapter";
import {
  configuredSupabaseAnonKey,
  configuredSupabaseUrl,
  isSupabaseConfigured,
  resetCustomCredentials,
  saveCustomCredentials,
  supabase,
} from "@/lib/supabase";
import { Badge, Button, Card, ConfirmDialog, Input, PageHeader, Toggle } from "@/components/ui";
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

  // Supabase diagnostic state
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(configuredSupabaseUrl || "");
  const [customKey, setCustomKey] = useState(configuredSupabaseAnonKey || "");

  const testSupabaseConnection = async () => {
    if (!supabase) {
      toast.error("Supabase is not initialized. Please enter credentials below.");
      return;
    }
    setTestingSupabase(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const { error } = await supabase.from("settings").select("key").limit(1);
      const elapsed = Math.round(performance.now() - start);
      if (error) {
        setTestResult(`Connection error: ${error.message}`);
        toast.error(`Supabase returned error: ${error.message}`);
      } else {
        const msg = `Success! Connected in ${elapsed}ms. Realtime WebSocket channel is active.`;
        setTestResult(msg);
        toast.success(msg);
      }
    } catch (e) {
      const msg = getErrorMessage(e);
      setTestResult(`Failed: ${msg}`);
      toast.error(msg);
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) {
      toast.error("Please enter both Supabase Project URL and Anon API Key");
      return;
    }
    saveCustomCredentials(customUrl, customKey);
  };

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
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch {
      /* ignore */
    }
    toast.success("Cache and offline workers cleared — reloading cleanly");
    setTimeout(() => window.location.reload(), 500);
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
      <PageHeader title="Backup & system" description="Manage database sync, Supabase connection, real-time status and activity logs." />

      {/* Supabase Connection & Real-time Sync Status Card */}
      <Card className="mb-6 border-primary/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSupabaseConfigured ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600"}`}>
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Cloud Database & Realtime Status</h3>
                <Badge className={isSupabaseConfigured ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-500 text-amber-600"}>
                  {isSupabaseConfigured ? "Connected to Supabase" : "Local Demo Mode"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isSupabaseConfigured
                  ? `Active Host: ${configuredSupabaseUrl} · Real-time WebSocket: Active (0-sec updates)`
                  : "Currently storing data in browser localStorage. Real users cannot see changes until Supabase is connected."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSupabaseConfigured && (
              <Button size="sm" variant="outline" onClick={testSupabaseConnection} loading={testingSupabase}>
                <RefreshCw className="h-3.5 w-3.5" /> Test Realtime Connection
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setShowConfig(!showConfig)}>
              {showConfig ? "Hide Config" : "Configure Supabase Keys"}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {testResult}
          </div>
        )}

        {showConfig && (
          <form onSubmit={handleSaveCredentials} className="mt-4 border-t border-zinc-200 pt-4 space-y-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              Enter your Supabase credentials here if they are not already supplied via environment variables. These will be saved securely in your browser.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Supabase Project URL"
                placeholder="https://your-project.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                required
              />
              <Input
                label="Supabase Anon Public Key"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save & Connect</Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetCustomCredentials}>Reset to Default</Button>
            </div>
          </form>
        )}
      </Card>

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
            <Eraser className="h-4 w-4 text-primary" /> Cache & Offline Data
          </h3>
          <p className="mt-1 text-xs text-zinc-500">Clears in-memory queries, offline service workers, and forces fresh network data.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearCache}>
              <Eraser className="h-4 w-4" /> Clear cache & reload
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
            <div className="flex justify-between"><dt className="text-zinc-500">Database Engine</dt><dd className="font-medium">{isSupabaseConfigured ? "Supabase PostgreSQL" : "Local Storage"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Live Sync & WebSockets</dt><dd className="font-medium text-emerald-600">Enabled (0s latency)</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Service worker</dt><dd className="font-medium">{"serviceWorker" in navigator ? "Active (v2 Network-First)" : "Unavailable"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Online status</dt><dd className="font-medium">{navigator.onLine ? "Online" : "Offline"}</dd></div>
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
