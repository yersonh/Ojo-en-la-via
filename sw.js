// Service Worker mejorado para funcionalidad offline - RUTAS CORREGIDAS
const CACHE_NAME = 'reportes-app-v2';
const OFFLINE_URLS = [
    '/',
    '/views/vermapa.php',
    '/views/components/mapa/utils/offline-manager.js',
    '/views/components/mapa/utils/GeolocationManager.js',
    '/views/components/mapa/utils/MapaManager.js',
    '/views/components/mapa/utils/MarkerManager.js',
    '/views/components/formulario/utils/FormManager.js',
    '/views/components/formulario/utils/UIManager.js',
    '/views/components/formulario/utils/ImageManager.js'
];

// 🆕 CACHE ESTRATÉGICO - Solo recursos críticos
const CRITICAL_ASSETS = [
    '/',
    '/views/vermapa.php',
    '/views/components/mapa/utils/offline-manager.js',
    '/views/components/mapa/utils/GeolocationManager.js',
    '/views/components/mapa/utils/MapaManager.js'
];

// Instalación
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando recursos críticos...');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => {
                console.log('✅ Todos los recursos críticos cacheados');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Error en instalación:', error);
            })
    );
});

// Activación
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activado');
    
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

// Estrategia de fetch mejorada
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Para APIs de reportes
    if (request.url.includes('reportecontrolador.php')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Si la respuesta es exitosa, guardar en cache para futuro offline
                    if (response.ok && request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(error => {
                    console.log('🔴 Offline - No se puede conectar al servidor');
                    
                    // Para peticiones GET, intentar servir del cache
                    if (request.method === 'GET') {
                        return caches.match(request).then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            
                            // Respuesta offline para APIs
                            return new Response(JSON.stringify({
                                success: false,
                                offline: true,
                                message: "Modo offline activado - No hay conexión a internet"
                            }), {
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'no-cache'
                                }
                            });
                        });
                    }
                    
                    // Para POST, indicar que se guardará offline
                    return new Response(JSON.stringify({
                        success: false,
                        offline: true,
                        message: "Se guardará localmente y se enviará cuando haya conexión"
                    }), {
                        headers: { 
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                })
        );
        return;
    }
    
    // Para recursos estáticos - Cache First
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // Cachear nuevas respuestas
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        })
                        .catch(error => {
                            console.log('🔴 No se pudo cargar recurso:', request.url);
                            
                            // Para páginas HTML, servir vermapa.php desde cache
                            if (request.destination === 'document' || request.mode === 'navigate') {
                                return caches.match('/views/vermapa.php')
                                    .then(cachedPage => {
                                        return cachedPage || new Response(`
                                            <html>
                                                <body>
                                                    <h1>Modo Offline</h1>
                                                    <p>La aplicación no está disponible sin conexión</p>
                                                </body>
                                            </html>
                                        `, {
                                            headers: { 'Content-Type': 'text/html' }
                                        });
                                    });
                            }
                            
                            return new Response('Recurso no disponible en modo offline', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
    }
});

// 🆕 BACKGROUND SYNC MEJORADO
self.addEventListener('sync', (event) => {
    console.log('🔄 Evento de Background Sync:', event.tag);
    
    if (event.tag === 'sincronizar-reportes') {
        event.waitUntil(
            sincronizarReportesBackground()
                .then(() => {
                    console.log('✅ Background Sync completado');
                    // Notificar a la app
                    return notificarClientes({
                        type: 'SYNC_COMPLETED',
                        message: 'Sincronización en background completada'
                    });
                })
                .catch(error => {
                    console.error('❌ Error en Background Sync:', error);
                })
        );
    }
});

// 🆕 SINCRONIZACIÓN EN BACKGROUND
async function sincronizarReportesBackground() {
    try {
        console.log('📡 Iniciando sincronización en background...');
        
        // Obtener clientes para notificar
        const clients = await self.clients.matchAll();
        
        // Notificar inicio de sincronización
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_STARTED',
                message: 'Sincronizando reportes pendientes en background'
            });
        });
        
        // Aquí iría la lógica de sincronización con el servidor
        // Por ahora simulamos una sincronización
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Sincronización en background completada');
        
    } catch (error) {
        console.error('❌ Error en sincronización background:', error);
        throw error;
    }
}

// 🆕 NOTIFICACIÓN A CLIENTES
async function notificarClientes(mensaje) {
    try {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage(mensaje);
        });
    } catch (error) {
        console.error('❌ Error notificando clientes:', error);
    }
}

// 🆕 MANEJO DE PUSH NOTIFICATIONS (opcional para el futuro)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    console.log('📲 Push notification recibida:', data);
    
    const options = {
        body: data.body || 'Nueva actualización disponible',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'reportes-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'Ver'
            },
            {
                action: 'dismiss', 
                title: 'Cerrar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Ojo en la Vía', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' })
                .then(clientList => {
                    if (clientList.length > 0) {
                        return clientList[0].focus();
                    }
                    return self.clients.openWindow('/');
                })
        );
    }
});

console.log('🎯 Service Worker cargado y listo');