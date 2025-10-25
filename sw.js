// sw.js - VERSIÓN DEFINITIVA UNIVERSAL
const CACHE_NAME = 'reportes-app-v1';
const OFFLINE_PAGE = '/offline.html';

// Estrategia: CACHE SOLO LO ESENCIAL Y SEGURO
const STATIC_ASSETS = [
    '/',
    '/views/vermapa.php',
    '/views/admin.php',
    '/styles/mapa.css',
    '/styles/formulario.css', 
    '/styles/admin.css',
    '/imagenes/fiveicon.png'
];

self.addEventListener('install', (event) => {
    console.log('🔧 SW Definitivo instalado');
    self.skipWaiting();
    
    // Precargar solo assets críticos
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('💾 Precargando assets críticos...');
                return cache.addAll(STATIC_ASSETS)
                    .catch(error => {
                        console.log('⚠️ Algunos assets no se pudieron precargar:', error);
                    });
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('🚀 SW Definitivo activado');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Limpiar caches antiguos
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

    // 🔒 ESTRATEGIA SEGURA: IGNORAR LO QUE PUEDE CAUSAR PROBLEMAS
    
    // 1. Ignorar métodos que no sean GET
    if (request.method !== 'GET') {
        return;
    }
    
    // 2. Ignorar esquemas no soportados
    if (request.url.startsWith('chrome-extension:') || 
        request.url.startsWith('moz-extension:') ||
        request.url.includes('safari-extension')) {
        return;
    }
    
    // 3. Ignorar recursos de terceros (solo mismo origin)
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // 4. Ignorar endpoints dinámicos y APIs
    if (request.url.includes('/controllers/') ||
        request.url.includes('/api/') ||
        request.url.includes('sse_notificaciones') ||
        request.url.includes('reportecontrolador') ||
        request.url.includes('notificacion_sistema_controlador')) {
        return;
    }

    // 🎯 ESTRATEGIA INTELIGENTE POR TIPO DE RECURSO
    
    // A) PÁGINAS HTML - Network First
    if (request.destination === 'document' || 
        request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(handleHtmlRequest(request));
        return;
    }
    
    // B) ARCHIVOS ESTÁTICOS (CSS, JS, imágenes) - Cache First  
    if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }
    
    // C) PARA TODO LO DEMÁS - Network Only
    return;
});

// 🏠 MANEJADOR PARA PÁGINAS HTML
async function handleHtmlRequest(request) {
    try {
        // Intentar network primero
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cachear respuesta exitosa
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('Respuesta de red no válida');
    } catch (error) {
        // Fallback al cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback a página offline genérica
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Modo Offline - Ojo en la Vía</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px 20px;
                        background: #f5f5f5;
                        color: #333;
                    }
                    .container {
                        max-width: 500px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #e74c3c; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 30px; line-height: 1.6; }
                    button {
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover { background: #2980b9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔌 Sin conexión</h1>
                    <p>La aplicación requiere conexión a internet para funcionar correctamente.</p>
                    <p>Por favor, verifica tu conexión e intenta nuevamente.</p>
                    <button onclick="location.reload()">Reintentar conexión</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            }
        });
    }
}

// 📦 MANEJADOR PARA ARCHIVOS ESTÁTICOS
async function handleStaticRequest(request) {
    // Intentar cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        // Si no está en cache, buscar en network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cachear para futuras visitas
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Si falla todo, devolver respuesta vacía apropiada
        const contentType = getContentType(request.url);
        return new Response('', {
            status: 408,
            statusText: 'Offline',
            headers: { 'Content-Type': contentType }
        });
    }
}

// 🛠️ FUNCIÓN AUXILIAR PARA DETERMINAR CONTENT TYPE
function getContentType(url) {
    if (url.endsWith('.css')) return 'text/css';
    if (url.endsWith('.js')) return 'application/javascript';
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
    if (url.endsWith('.gif')) return 'image/gif';
    if (url.endsWith('.svg')) return 'image/svg+xml';
    if (url.endsWith('.ico')) return 'image/x-icon';
    return 'text/plain';
}

// 📱 MANEJADOR DE SINCRONIZACIÓN (OPCIONAL PARA FUTURO)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-reports') {
        console.log('🔄 Sincronización en background');
        // Aquí iría la lógica para sincronizar datos pendientes
    }
});

// 🔔 MANEJADOR DE PUSH (OPCIONAL PARA FUTURO)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/imagenes/fiveicon.png'
            })
        );
    }
});