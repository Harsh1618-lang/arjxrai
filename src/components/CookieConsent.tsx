import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, Shield, X } from "lucide-react";
import { Button } from "@/components/ui";
import { storage } from "@/lib/utils";

const CONSENT_KEY = "srd_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = storage.get<string | null>(CONSENT_KEY, null);
    if (!consent) {
      // Small delay so it doesn't pop immediately
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    storage.set(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    storage.set(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl animate-slide-up">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              We value your privacy
              <button onClick={() => setVisible(false)} className="ml-auto rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              This website uses cookies to enhance your experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies. Read our{" "}
              <Link to="/privacy" className="font-medium text-primary underline underline-offset-2" onClick={() => setVisible(false)}>
                Privacy Policy
              </Link>{" "}
              for more details.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleReject} className="order-1 flex-1 sm:flex-none">
                Reject
              </Button>
              <Button size="sm" onClick={handleAccept} className="order-2 flex-1 sm:flex-none">
                <Shield className="h-3.5 w-3.5" /> Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
