// Replaces the old app's service worker on github.io: clear the old app's caches,
// remove itself, and reload its open windows. The page then decides: a browser tab
// goes on to the new address; a home-screen app gets steps to swap its icon (sending
// an installed app to another site opens a small browser window that hides its buttons).
// xynkro.github.io is shared with other projects, so only MahjongKaki's caches go.
const OURS = key => key.includes('/MahjongKaki/') || key.startsWith('mk-');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (OURS(key)) await caches.delete(key);
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.allSettled(
      windows.filter(c => new URL(c.url).pathname.startsWith('/MahjongKaki')).map(c => c.navigate(c.url)),
    );
  })());
});
