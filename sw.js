// sw.js - VERSIÓN PARA PRODUCCIÓN
const CACHE_NAME = 'reportes-app-' + 'v3-' + Date.now(); // 🆕 VERSIÓN ÚNICA
const CRITICAL_ASSETS = [
    '/',
    '/views/vermapa.php'
    // 🆕 NO cachear archivos JS/CSS que cambian frecuentemente
];

// 🆕 ARCHIVOS QUE NUNCA DEBEN CACHEARSE
const NEVER_CACHE = [
    '/controllers/reportecontrolador.php',
    '/api/',
    '/views/components/formulario/utils/FormManager.js',
    '/views/components/formulario/utils/ImageManager.js',
    '/views/components/formulario/utils/CameraManager.js'
];

self.addEventListener('install', (event) => {
    console.log('🔧 SW Production v3 instalando...');
    self.skipWaiting(); // 🆕 ACTIVAR INMEDIATAMENTE
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW Production v3 activado');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 🆕 LIMPIAR TODOS LOS CACHES ANTERIORES
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 🆕 ESTRATEGIA: NUNCA CACHEAR ARCHIVOS CRÍTICOS QUE CAMBIAN
    if (NEVER_CACHE.some(path => request.url.includes(path))) {
        event.respondWith(fetch(request)); // 🆕 SOLO RED, SIN CACHE
        return;
    }

    // 🆕 PARA JS/CSS - NETWORK FIRST CON ACTUALIZACIÓN
    if (request.url.includes('.js') || request.url.includes('.css')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // 🆕 VERIFICAR SI LA RESPUESTA ES FRESCA
                    if (response.ok) {
                        const cacheControl = response.headers.get('cache-control');
                        if (!cacheControl || !cacheControl.includes('no-cache')) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseClone));
                        }
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // 🆕 PARA HTML - ESTRATEGIA CONSERVADORA
    if (request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // PARA RECURSOS ESTÁTICOS (imágenes, fuentes) - CACHE FIRST
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request);
            })
    );
});