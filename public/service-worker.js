const CACHE_NAME = "my-site-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    "/",
    "/assets/js/db.js",
    "/index.html",
    "/assets/js/index.js",
    "/manifest.webmanifest",
    "/assets/css/styles.css",
    "/assets/icons/icon-192x192.png",
    "/assets/icons/icon-512x512.png"
  ];
  
  // install
  self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Opened cache, storing the files in the array");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  });

  // fetch API call
  self.addEventListener("fetch", function(evt) {
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
      return;
    }
    // Fallback for any failed route (not API specific) to see if it is in the cache
    evt.respondWith(
        fetch(evt.request).catch(function(){
            return caches.match(evt.request).then(function(response) {
               if(response){
                    return response;
               }else if(evt.request.headers.get("accept").includes("text/html")){
                    // return the cached homepage for all requests for html pages
                    return caches.match("/");
               }
            });
        })
      );
  });