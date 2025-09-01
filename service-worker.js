const CACHE = 'graphic-hub-v1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js', '/manifest.json',
  '/icons/icon-48.png','/icons/icon-72.png','/icons/icon-96.png','/icons/icon-128.png','/icons/icon-144.png','/icons/icon-152.png','/icons/icon-192.png','/icons/icon-256.png','/icons/icon-384.png','/icons/icon-512.png',
  '/assets/frames/gold.png','/assets/frames/wood.png','/assets/frames/neon.png',
  '/assets/templates/template-1200x628.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
