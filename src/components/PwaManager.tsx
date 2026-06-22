"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

const TRIP_DATES = ["04", "05", "06", "07", "08", "09", "10", "11", "12"];
const OFFLINE_ROUTES = [
  "/",
  "/itinerary",
  ...TRIP_DATES.map((day) => `/itinerary?date=2026-07-${day}`),
  "/guide",
  "/maps",
  "/suggestions",
];
const PWA_ENABLED = process.env.NODE_ENV === "production";

function subscribeToNetwork(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function PwaManager() {
  const online = useSyncExternalStore(subscribeToNetwork, () => navigator.onLine, () => true);
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    if (!PWA_ENABLED) return;

    const handleOnline = () => {
      registrationRef.current?.active?.postMessage({ type: "CACHE_TRIP", urls: OFFLINE_ROUTES });
    };
    const handleControllerChange = () => {
      if (reloadForUpdate.current) window.location.reload();
    };
    const handleOfflineClick = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target || target.download) return;
      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      window.location.assign(url.href);
    };

    window.addEventListener("online", handleOnline);
    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);
    document.addEventListener("click", handleOfflineClick, true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        registrationRef.current = registration;
        if (registration.waiting) setUpdateReady(true);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(true);
          });
        });
        return navigator.serviceWorker.ready;
      }).then((registration) => {
        registrationRef.current = registration;
        navigator.storage?.persist?.().catch(() => false);
        if (window.location.pathname !== "/login" && navigator.onLine) {
          registration.active?.postMessage({ type: "CACHE_TRIP", urls: OFFLINE_ROUTES });
        }
      }).catch(() => {
        // The online app remains fully usable if service-worker setup is unavailable.
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("click", handleOfflineClick, true);
    };
  }, []);

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) return;
    reloadForUpdate.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if (!PWA_ENABLED || (online && !updateReady)) return null;

  return (
    <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#ded3c3] bg-[#26231f] px-4 py-2 text-xs font-bold text-white shadow-xl" role="status">
      {online === false ? <><WifiOff size={15} /> Offline · saved pages available</> : <><RefreshCw size={15} /> An app update is ready <button type="button" onClick={applyUpdate} className="rounded-full bg-white px-3 py-1.5 text-[#26231f]">Update</button></>}
    </div>
  );
}
