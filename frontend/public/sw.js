self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { convId, msgId, appUrl } = event.notification.data ?? {};

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            await client.focus();
            client.postMessage({ type: "NOTIFICATION_CLICK", convId, msgId });
            return;
          }
        }
        return self.clients.openWindow(appUrl ?? "/");
      })
  );
});
