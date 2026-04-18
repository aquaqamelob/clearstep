"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // In dev: unregister any previously installed SW (e.g. from a past prod build)
    // and purge its caches. Otherwise stale chunks/HTML cause hydration mismatches.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if (typeof caches === "undefined") return;
          return caches
            .keys()
            .then((keys) =>
              Promise.all(
                keys
                  .filter((k) => k.startsWith("clearstep-"))
                  .map((k) => caches.delete(k))
              )
            );
        })
        .catch(() => {});
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => console.warn("SW registration failed", err));
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
