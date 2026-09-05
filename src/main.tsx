import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* PWA: register the service worker (production only, and only when served over http(s)). */
if (import.meta.env.PROD && "serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener("load", () => {
    const swUrl = new URL("sw.js", document.baseURI).href;
    navigator.serviceWorker
      .register(swUrl, { scope: new URL("./", document.baseURI).pathname })
      .then((reg) => {
        // Auto-check for updates on load
        reg.update().catch(() => {});
        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                installingWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch(() => {
        /* SW is optional — silently ignore */
      });
  });
}
