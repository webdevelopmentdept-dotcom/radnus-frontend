/* public/sw.js - Radnus push notification service worker
   Must live at the site ROOT (/sw.js) so it can control the whole site. */

const ICON = "/favicon.ico";   // change to your logo (PNG, ~192x192 works best), e.g. "/logo192.png"
const BADGE = "/favicon.ico";  // small monochrome icon (Android); optional

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// A push arrived from the server
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Radnus", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Radnus";
  const options = {
    body: data.body || "",
    icon: ICON,
    badge: BADGE,
    tag: data.id || undefined,          // same id = no duplicate popups
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// User clicked the popup
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = list.find((c) => new URL(c.url).origin === target.origin);

      if (existing) {
        await existing.focus();
        // Let the React app route client-side (no full reload)
        existing.postMessage({ type: "PUSH_NAVIGATE", url: target.pathname + target.search });
      } else {
        await self.clients.openWindow(target.href);
      }
    })()
  );
});