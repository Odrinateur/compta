// @ts-nocheck
// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
        self.registration.showNotification(data.title ?? "Nouvelle notification", {
            body: data.body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            data: { url: data.url },
            tag: data.tag ?? "default",
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Si une fenêtre est déjà ouverte, on la focus
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Sinon on ouvre une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
