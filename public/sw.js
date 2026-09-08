// Minimal service worker: exists only so notification display can go through
// registration.showNotification(), which is the path mobile browsers require.
// It does not cache anything or enable offline use, and it cannot wake this
// app or fire a notification once the browser itself is fully closed — that
// needs a server holding a Web Push subscription, which this app has none of.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const existing = clientsArr.find((c) => "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow("/");
    }),
  );
});
