/* BariaMouv — sw.js
 * Rend l'application utilisable hors connexion (salle de sport, sous-sol…).
 * - code et CDN : réseau d'abord (les mises à jour arrivent), cache en secours ;
 * - images : cache d'abord (elles ne changent pas).
 * Changer CACHE pour forcer le renouvellement après une grosse mise à jour.
 */
const CACHE = 'bariamouv-v3';
const CORE = [
  './', './index.html', './style.css', './app.js', './data.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);

  if (url.origin === location.origin && url.pathname.includes('/img/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }

  // Réseau d'abord, avec un délai max de 4 s avant de servir la copie en cache.
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(req, { ignoreSearch: true })
      .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    const timer = setTimeout(() => {
      fallback().then((hit) => { if (!done && hit && hit.type !== 'error') { done = true; resolve(hit); } });
    }, 4000);
    fetch(req)
      .then((res) => { clearTimeout(timer); put(req, res); if (!done) { done = true; resolve(res); } })
      .catch(() => { clearTimeout(timer); if (!done) { done = true; resolve(fallback()); } });
  }));
});
