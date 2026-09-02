import { AlertTriangle, CheckCircle2, Database, ExternalLink, KeyRound, Terminal } from "lucide-react";

const steps = [
  {
    title: "Create a Supabase project",
    body: (
      <>
        Go to{" "}
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          supabase.com
        </a>{" "}
        and create a new project (free tier works).
      </>
    ),
  },
  {
    title: "Run the database schema",
    body: (
      <>
        Open <b>SQL Editor</b> → paste and run <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">supabase/schema.sql</code>, then{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">supabase/seed.sql</code>.
      </>
    ),
  },
  {
    title: "Enable auth providers",
    body: (
      <>
        In <b>Authentication → Providers</b> enable <b>Email</b> (magic link / OTP) and optionally <b>Google</b>.
      </>
    ),
  },
  {
    title: "Add environment variables",
    body: (
      <>
        Create a <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">.env</code> file (or set them in Vercel) and restart the server.
      </>
    ),
  },
];

export function SetupScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Connect Supabase</h1>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            SRD Learn requires Supabase for authentication and data. Add your project credentials to start the app — everything else (schema, CMS, UI) is already production-ready.
          </p>
        </div>

        <ol className="mt-8 space-y-6">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
              <div>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-primary" /> .env
          </div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100">
{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-KEY
VITE_SITE_URL=https://your-domain.com`}
          </pre>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Done?
          </div>
          <p className="mt-1">Restart the dev server (<code className="font-mono text-xs">npm run dev</code>) or redeploy on Vercel. This screen will be replaced by the full app automatically.</p>
        </div>

        <a href="https://supabase.com/docs/guides/getting-started" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          Read the full deployment guide <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="mt-10 flex items-center gap-2 text-xs text-zinc-400">
          <Terminal className="h-3.5 w-3.5" /> Tip: you can verify your setup with <code className="font-mono">supabase link --project-ref YOUR-REF</code> and <code className="font-mono">supabase db push</code>.
        </div>
      </div>
    </div>
  );
}
