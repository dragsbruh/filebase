// TODO: Fix this

const CACHE_NAME = "filebase-static-cache";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) &&
    (url.protocol === "http:" || url.protocol === "https:")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }

            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "pruneCaches") {
    pruneCaches();
  }
});

function pruneCaches() {
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    );
  });
}

function checkForUpdates() {
  caches.open(CACHE_NAME).then((cache) => {
    cache.keys().then((keys) => {
      keys.forEach((request) => {
        fetch(request.url, { cache: "reload" }).then((response) => {
          if (response.ok) {
            cache.put(request, response);
          }
        });
      });
    });
  });
}

setInterval(checkForUpdates, 60 * 60 * 1000);

checkForUpdates();
