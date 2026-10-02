/* =========================================================
   LIFECYCLE  (new)
   Activate updated versions of this file immediately instead
   of waiting for every Sync24 tab to be closed.
========================================================= */

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

/* =========================================================
   FETCH  (new)
   Chrome only offers installation (and fires beforeinstallprompt)
   when the service worker has a fetch handler that does something.

   Deliberately simple and safe:
   - Page navigations are network-first and NOTHING is cached,
     so users can never see a stale copy of the app or the news.
   - If the network fails, a small offline page is shown.
   - All other requests (JS, images, APIs) are left to the browser.
========================================================= */

self.addEventListener("fetch", function (event) {
  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(function () {
      return new Response(
        `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sync24 - Offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
             font-family: system-ui, sans-serif; background: #0f172a; color: #fff;
             text-align: center; padding: 24px; }
      button { margin-top: 16px; padding: 10px 18px; border: 0;
               border-radius: 999px; font: inherit; cursor: pointer; }
    </style>
  </head>
  <body>
    <div>
      <h1>You're offline</h1>
      <p>Sync24 needs a connection to load today's stories.</p>
      <button onclick="location.reload()">Try again</button>
    </div>
  </body>
</html>`,
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }),
  );
});

/* =========================================================
   PUSH  (your existing code, unchanged)
========================================================= */

self.addEventListener("push", function (event) {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error("[SW] Push payload is not JSON:", error);

      data = {
        title: "Sync24",
        body: event.data.text(),
        url: "/",
      };
    }
  }

  const title = data.title || "Sync24";

  const options = {
    body: data.body || "Today's tech news is ready.",
    icon: "/sync_logo.png",
    badge: "/sync_logo.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});