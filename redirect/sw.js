// Replaces the old app's service worker on github.io: clear its caches, remove
// itself, and send any open tab to the new address.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      const rest = new URL(client.url).pathname.replace(/^\/MahjongKaki\/?/, '');
      client.navigate('https://mahjongkaki.web.app/' + rest);
    }
  })());
});
