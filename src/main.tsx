import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CACHE_VERSION = "v3-2026-06-02";

(async () => {
  if (localStorage.getItem("cache_version") === CACHE_VERSION) return;

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }

  localStorage.setItem("cache_version", CACHE_VERSION);
  if ("serviceWorker" in navigator) {
    window.location.reload();
    return;
  }
})();

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
