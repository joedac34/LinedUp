/* PickLock push service worker.  Place at: public/sw.js  (served from /sw.js) */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'PickLock', body: (event.data && event.data.text()) || '' }; }
  const title = data.title || 'PickLock';
  const options = {
    body: data.body || '',
    icon: '/picklock-icon.png',
    badge: '/picklock-icon.png',
    data: { url: data.url || '/' },
    tag: data.tag || undefined,
    renotify: !!data.tag
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (const c of list) {
        if ('focus' in c) {
          c.focus();
          if (url && url !== '/' && 'navigate' in c) { try { c.navigate(url); } catch (e) {} }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
