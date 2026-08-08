/*! coi-serviceworker v0.1.7 - Guido Zufolo - MIT License */
(() => {
  const coepCredentialless = true;
  if (typeof window === "undefined") {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
      if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
        return;
      }
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 0) {
              return response;
            }

            const newHeaders = new Headers(response.headers);
            newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          })
          .catch((e) => console.error("coi-serviceworker fetch error:", e))
      );
    });
  } else {
    (() => {
      const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
      window.sessionStorage.removeItem("coiReloadedBySelf");

      const coi = {
        shouldRegister: () => !window.crossOriginIsolated,
        shouldDeregister: () => false,
        doReload: () => window.location.reload(),
        quiet: false,
        ...window.coi,
      };

      if (coi.shouldDeregister() && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }

      if ("serviceWorker" in navigator && coi.shouldRegister()) {
        navigator.serviceWorker
          .register(window.document.currentScript?.src || "/coi-serviceworker.js")
          .then(
            (registration) => {
              if (registration.active && !navigator.serviceWorker.controller) {
                if (reloadedBySelf) {
                  console.warn("coi-serviceworker failed to isolate automatically.");
                } else {
                  window.sessionStorage.setItem("coiReloadedBySelf", "true");
                  coi.doReload();
                }
              }
            },
            (err) => {
              console.error("COOP/COEP Service Worker failed to register:", err);
            }
          );
      }
    })();
  }
})();
