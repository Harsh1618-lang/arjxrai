// Contact form handler — validates input, rate-limits, stores the message and
// (optionally) emails the site owner via Resend.
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleOptions, json, rateLimit } from "../_shared/cors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const message = String(body?.message ?? "").trim();

    if (name.length < 2 || name.length > 120) return json({ error: "Invalid name." }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "Invalid email address." }, 400);
    if (message.length < 10 || message.length > 5000) return json({ error: "Message must be 10–5000 characters." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
      subject: `New message from ${name}`,
    });
    if (error) throw error;

    // Optional: notify the owner by email (set RESEND_API_KEY + NOTIFY_EMAIL).
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL");
    if (resendKey && notifyEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SRD Learn <onboarding@resend.dev>",
          to: [notifyEmail],
          reply_to: email,
          subject: `New contact: ${name}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      }).catch(() => undefined); // email failure must not fail the request
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 400);
  }
});
