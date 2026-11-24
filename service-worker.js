// Permet à l'application de se charger même sans connexion (tablette hors wifi) :
// sert une version mise en cache de la page si le réseau échoue.
const CACHE_NAME = 'as-gestion-licences-v1';
const CORE_ASSETS = ['./', './index.html', './GestionLicences.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(CORE_ASSETS.map(url => cache.add(url).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Seules les requêtes GET vers ce même site sont gérées : les appels à
  // Google Apps Script (autre origine) passent directement au réseau.
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./GestionLicences.html')))
  );
});
