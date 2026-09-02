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
    navigator.serviceWorker.register(swUrl, { scope: new URL("./", document.baseURI).pathname }).catch(() => {
      /* SW is optional — silently ignore (e.g. when sw.js is not served) */
    });
  });
}
