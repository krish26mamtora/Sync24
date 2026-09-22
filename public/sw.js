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