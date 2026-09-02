import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { db } from "@/services/adapter";
import { DEMO_CREDENTIALS } from "@/data/seed";
import { storage, uid } from "@/lib/utils";
import type { Profile } from "@/types";

export interface AuthService {
  readonly mode: "local" | "supabase";
  getCurrent(): Promise<Profile | null>;
  subscribe(cb: (profile: Profile | null) => void): () => void;
  sendOtp(email: string, allowSignup: boolean): Promise<void>;
  verifyOtp(email: string, token: string): Promise<Profile>;
  signInWithPassword(email: string, password: string): Promise<Profile>;
  signUp(fullName: string, email: string, password: string): Promise<{ profile: Profile | null; needsConfirmation: boolean }>;
  signInWithGoogle(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;
}

export const DEMO_OTP = "123456";

/* ------------------------------------------------------------------ */
/* Local demo auth (no Supabase configured)                            */
/* ------------------------------------------------------------------ */

class LocalAuth implements AuthService {
  readonly mode = "local" as const;
  private listeners = new Set<(p: Profile | null) => void>();

  private async notify() {
    const p = await this.getCurrent();
    this.listeners.forEach((l) => l(p));
  }

  private creds(): Record<string, string> {
    return { ...DEMO_CREDENTIALS, ...storage.get<Record<string, string>>("srd_demo_credentials", {}) };
  }

  private async ensureProfile(email: string, fullName?: string): Promise<Profile> {
    const existing = await db.getOne<Profile>("profiles", { email: email.toLowerCase() });
    if (existing) return existing;
    return db.upsert<Profile>("profiles", {
      id: uid(),
      email: email.toLowerCase(),
      full_name: fullName || email.split("@")[0],
      avatar_url: null,
      role: "student",
      is_blocked: false,
    });
  }

  private async login(profile: Profile): Promise<Profile> {
    if (profile.is_blocked) throw new Error("Your account has been blocked. Please contact support.");
    storage.set("srd_session", profile.id);
    await this.notify();
    return profile;
  }

  async getCurrent(): Promise<Profile | null> {
    const id = storage.get<string | null>("srd_session", null);
    if (!id) return null;
    const p = await db.getOne<Profile>("profiles", { id });
    if (!p || p.is_blocked) {
      storage.remove("srd_session");
      return null;
    }
    return p;
  }

  subscribe(cb: (p: Profile | null) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async sendOtp(email: string, allowSignup: boolean) {
    const existing = await db.getOne<Profile>("profiles", { email: email.toLowerCase() });
    if (!existing && !allowSignup) throw new Error("Registration is currently disabled.");
    storage.set("srd_demo_otp", { email: email.toLowerCase(), code: DEMO_OTP });
  }

  async verifyOtp(email: string, token: string) {
    const pending = storage.get<{ email: string; code: string } | null>("srd_demo_otp", null);
    if (!pending || pending.email !== email.toLowerCase() || pending.code !== token.trim()) throw new Error("Invalid or expired code.");
    storage.remove("srd_demo_otp");
    return this.login(await this.ensureProfile(email));
  }

  async signInWithPassword(email: string, password: string) {
    const stored = this.creds()[email.toLowerCase()];
    if (!stored || stored !== password) throw new Error("Invalid email or password.");
    return this.login(await this.ensureProfile(email));
  }

  async signUp(fullName: string, email: string, password: string) {
    const key = email.toLowerCase();
    if (this.creds()[key]) throw new Error("An account with this email already exists.");
    storage.set("srd_demo_credentials", { ...storage.get<Record<string, string>>("srd_demo_credentials", {}), [key]: password });
    const profile = await this.login(await this.ensureProfile(key, fullName));
    return { profile, needsConfirmation: false };
  }

  async signInWithGoogle() {
    throw new Error("Google login requires Supabase configuration. Use email login in demo mode.");
  }

  async resetPassword() {}

  async changePassword(currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
    const current = await this.getCurrent();
    if (!current) throw new Error("Not logged in.");
    const stored = this.creds()[current.email.toLowerCase()];
    if (!stored || stored !== currentPassword) throw new Error("Current password is incorrect.");
    const allCreds = { ...storage.get<Record<string, string>>("srd_demo_credentials", {}), ...DEMO_CREDENTIALS };
    allCreds[current.email.toLowerCase()] = newPassword;
    storage.set("srd_demo_credentials", allCreds);
  }

  async signOut() {
    storage.remove("srd_session");
    await this.notify();
  }

  async updateProfile(id: string, patch: Partial<Profile>) {
    const saved = await db.upsert<Profile>("profiles", { id, ...patch });
    await this.notify();
    return saved;
  }
}

/* ------------------------------------------------------------------ */
/* Supabase auth                                                       */
/* ------------------------------------------------------------------ */

class SupabaseAuth implements AuthService {
  readonly mode = "supabase" as const;

  private get client() {
    if (!supabase) throw new Error("Supabase not configured");
    return supabase;
  }

  private async loadProfile(user: User): Promise<Profile> {
    let profile = await db.getOne<Profile>("profiles", { id: user.id });
    if (!profile) {
      profile = await db.upsert<Profile>("profiles", {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Student",
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        role: "student",
        is_blocked: false,
      });
    }
    if (profile.is_blocked) {
      await this.client.auth.signOut();
      throw new Error("Your account has been blocked. Please contact support.");
    }
    return profile;
  }

  private async fromSession(session: Session | null): Promise<Profile | null> {
    if (!session?.user) return null;
    try {
      return await this.loadProfile(session.user);
    } catch {
      return null;
    }
  }

  async getCurrent() {
    const { data } = await this.client.auth.getSession();
    return this.fromSession(data.session);
  }

  subscribe(cb: (p: Profile | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        this.fromSession(session).then(cb);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }

  async sendOtp(email: string, allowSignup: boolean) {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: allowSignup, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }

  async verifyOtp(email: string, token: string) {
    const { data, error } = await this.client.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Verification failed");
    return this.loadProfile(data.user);
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return this.loadProfile(data.user);
  }

  async signUp(fullName: string, email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
    if (!data.session || !data.user) return { profile: null, needsConfirmation: true };
    return { profile: await this.loadProfile(data.user), needsConfirmation: false };
  }

  async signInWithGoogle() {
    const { error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error(error.message);
  }

  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile` });
    if (error) throw new Error(error.message);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
    // Verify current password first (Supabase doesn't expose current password check,
    // so we re-authenticate with it to confirm ownership).
    const session = await this.client.auth.getSession();
    const email = session.data.session?.user?.email;
    if (!email) throw new Error("Not logged in.");
    const { data: signInData, error: signInError } = await this.client.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError || !signInData.session) throw new Error("Current password is incorrect.");
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async updateProfile(id: string, patch: Partial<Profile>) {
    const { role: _role, is_blocked: _blocked, ...safe } = patch;
    void _role;
    void _blocked;
    return db.upsert<Profile>("profiles", { id, ...safe });
  }
}

export const auth: AuthService = supabase ? new SupabaseAuth() : new LocalAuth();
