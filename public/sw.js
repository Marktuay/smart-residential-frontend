self.addEventListener('push', function(event) {
  let data = { title: 'Notificación', body: 'Nueva alerta de seguridad' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificación', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/shield-alert.png', // O un icono general
    badge: '/shield-alert.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
