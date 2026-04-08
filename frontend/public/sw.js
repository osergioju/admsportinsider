const CACHE_NAME = "sportinsider-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  const request = e.request;

  // ❌ Ignora métodos que não são GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ❌ Ignora esquemas inválidos (EXTENSÃO, FILE, ETC)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  e.respondWith(
    fetch(request)
      .then((res) => {
        // ❌ Só cacheia respostas válidas
        if (!res || res.status !== 200) {
          return res;
        }

        const clone = res.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });

        return res;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});