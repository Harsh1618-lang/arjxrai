import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Seo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useSettings } from "@/hooks/queries";
import { auth, DEMO_OTP } from "@/services/auth";
import { Logo } from "@/components/layout/Navbar";
import { GoogleIcon } from "@/components/icons";
import { Button, Input, Tabs } from "@/components/ui";
import { getErrorMessage, isValidEmail } from "@/lib/utils";

type Method = "otp" | "password";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const { isAuthenticated, loading, setUser, user } = useAuth();
  const { data: settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAdminAccess = searchParams.get("mode") === "admin";
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";
  /** Admins land on the admin panel unless they were heading somewhere specific. */
  const target = (role?: string) => (role === "admin" && from === "/dashboard" ? "/admin" : from);


  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>(isAdminAccess ? "password" : "otp");

  const registrationEnabled = settings?.general.registration_enabled ?? true;
  const isRegister = mode === "register";

  if (!loading && isAuthenticated) return <Navigate to={target(user?.role)} replace />;
  if (isRegister && settings && !registrationEnabled) {
    return (
      <Shell title="Registration closed" subtitle="New sign-ups are currently disabled by the administrator.">
        <Link to="/login" className="block text-center text-sm font-medium text-primary hover:underline">
          Already have an account? Log in
        </Link>
      </Shell>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    run(async () => {
      await auth.sendOtp(email.trim(), registrationEnabled || !isRegister);
      setOtpSent(true);
      toast.success(auth.mode === "local" ? `Demo mode: your code is ${DEMO_OTP}` : "We emailed you a 6-digit code.");
    });
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) return setError("Enter the 6-digit code.");
    run(async () => {
      const profile = await auth.verifyOtp(email.trim(), otp.trim());
      setUser(profile);
      toast.success(`Welcome, ${profile.full_name}!`);
      navigate(target(profile.role), { replace: true });
    });
  };

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (isRegister && name.trim().length < 2) return setError("Please enter your name.");
    run(async () => {
      if (isRegister) {
        const { profile, needsConfirmation } = await auth.signUp(name.trim(), email.trim(), password);
        if (needsConfirmation || !profile) {
          toast.info("Check your inbox to confirm your email, then log in.");
          navigate("/login");
          return;
        }
        setUser(profile);
        toast.success("Account created — welcome!");
      } else {
        const profile = await auth.signInWithPassword(email.trim(), password);
        setUser(profile);
        toast.success(`Welcome back, ${profile.full_name}!`);
        navigate(target(profile.role), { replace: true });
        return;
      }
      navigate(from, { replace: true });
    });
  };

  const reset = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    run(async () => {
      await auth.resetPassword(email.trim());
      toast.success("If that email exists, a reset link has been sent.");
      setForgot(false);
    });
  };

  const google = () => run(() => auth.signInWithGoogle());

  if (forgot) {
    return (
      <Shell title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
        <Seo title="Reset password" noIndex />
        <form onSubmit={reset} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="w-full" loading={busy}>
            Send reset link
          </Button>
          <button type="button" onClick={() => setForgot(false)} className="flex w-full items-center justify-center gap-1 text-sm text-zinc-500 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>
        </form>
      </Shell>
    );
  }

  const shellTitle = isAdminAccess ? "Admin Access" : isRegister ? "Create your free account" : "Welcome back";
  const shellSubtitle = isAdminAccess ? "Restricted area — admin credentials required." : isRegister ? "Access every course, PDF and resource — free forever." : "Log in to continue learning.";

  return (
    <Shell title={shellTitle} subtitle={shellSubtitle}>
      <Seo title={isAdminAccess ? "Admin login" : isRegister ? "Register" : "Login"} noIndex />

      {isAdminAccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Admin access detected — your session will be routed to the admin panel.</span>
        </div>
      )}

      <Tabs<Method>
        className="mb-5"
        value={method}
        onChange={(m) => {
          setMethod(m);
          setError(null);
          setOtpSent(false);
        }}
        tabs={[
          { value: "otp", label: "Email OTP" },
          { value: "password", label: "Password" },
        ]}
      />

      {method === "otp" ? (
        otpSent ? (
          <form onSubmit={verify} className="space-y-4">
            <div className="rounded-lg bg-primary/5 p-3 text-sm text-zinc-600 dark:text-zinc-300">
              <ShieldCheck className="mb-1 h-4 w-4 text-primary" />
              Code sent to <b>{email}</b>. {auth.mode === "local" && <>Demo code: <b>{DEMO_OTP}</b></>}
            </div>
            <Input label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="text-center text-lg tracking-[0.5em]" autoFocus />
            {error && <ErrorBox message={error} />}
            <Button type="submit" className="w-full" loading={busy}>
              Verify & continue
            </Button>
            <button type="button" onClick={() => setOtpSent(false)} className="w-full text-sm text-zinc-500 hover:text-primary">
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={sendOtp} className="space-y-4">
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            {error && <ErrorBox message={error} />}
            <Button type="submit" className="w-full" loading={busy}>
              <Mail className="h-4 w-4" /> Send login code
            </Button>
            <p className="text-center text-xs text-zinc-500">No password needed — we'll email you a one-time code.</p>
          </form>
        )
      ) : (
        <form onSubmit={submitPassword} className="space-y-4">
          {isRegister && <Input label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />}
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="w-full" loading={busy}>
            <KeyRound className="h-4 w-4" /> {isRegister ? "Create account" : "Log in"}
          </Button>
          {!isRegister && (
            <button type="button" onClick={() => setForgot(true)} className="w-full text-sm text-zinc-500 hover:text-primary">
              Forgot password?
            </button>
          )}
        </form>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" /> or <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
        <GoogleIcon className="h-4 w-4" /> Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        ) : registrationEnabled ? (
          <>
            New here?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create a free account
            </Link>
          </>
        ) : null}
      </p>
      <p className="mt-3 text-center text-[11px] text-zinc-400">
        By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </Shell>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[84vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo compact />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white header-zoom-text">{title}</h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>

      {/* Frosted Liquid Glass Card with High Blur & Specular Sheen (Glow strictly contained inside) */}
      <div className="liquid-glass-card relative overflow-hidden rounded-[26px] p-6 shadow-2xl sm:p-8 animate-fade-in-up">
        {/* Dynamic liquid blobs & glow contained EXCLUSIVELY INSIDE the card */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" aria-hidden>
          {/* Ambient soft iridescent wash inside card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-sky-100/35 opacity-100 dark:opacity-0" />

          {/* Liquid Blob 1: Vibrant Indigo & Violet aura inside card */}
          <div
            className="liquid-blob-anim-1 absolute -top-12 -left-12 h-60 w-60 rounded-full bg-gradient-to-tr from-indigo-500/45 via-violet-500/35 to-purple-600/25 blur-[40px] dark:from-indigo-600/35 dark:via-violet-600/25 dark:to-purple-700/20"
          />
          {/* Liquid Blob 2: Cyan & Sky aura inside card */}
          <div
            className="liquid-blob-anim-2 absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/45 via-sky-500/35 to-blue-600/25 blur-[45px] dark:from-sky-500/35 dark:via-blue-600/25 dark:to-teal-500/20"
          />
          {/* Liquid Blob 3: Warm fuchsia & pink glowing accent inside card */}
          <div
            className="liquid-blob-anim-3 absolute top-1/4 -right-10 h-52 w-52 rounded-full bg-gradient-to-r from-fuchsia-500/35 via-pink-500/30 to-rose-400/20 blur-[40px] dark:from-fuchsia-600/25 dark:to-rose-600/20"
          />
          {/* Liquid Blob 4: Soft emerald/teal core shimmer inside card */}
          <div
            className="liquid-blob-anim-1 absolute -bottom-8 left-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-emerald-400/30 via-teal-400/25 to-sky-400/25 blur-[35px] dark:from-emerald-600/20 dark:to-teal-600/15"
            style={{ animationDelay: "-6s" }}
          />
        </div>

        {/* Specular gloss top light reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/40 to-transparent" />

        {/* Internal refractive liquid highlight */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-white/60 to-transparent blur-2xl dark:from-white/10" />

        {/* Ambient liquid corner glow */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-primary/15 blur-2xl dark:bg-primary/20" />

        {/* Shimmer sweep effect */}
        <div className="pointer-events-none absolute -inset-full liquid-shimmer opacity-40 dark:opacity-20" />

        {/* Card interactive content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{message}</p>;
}
