// sw.js - Service Worker para funcionalidad offline
const CACHE_NAME = 'reportes-app-v1';
const OFFLINE_URLS = [
'/',
'/styles/mapa.css',
'/styles/formulario.css',
'/components/mapa.js',
'/components/Buscador.js',
'/components/formulario-reporte.js',
'/components/comentarios.js',
'/components/offline-manager.js'
];

// Instalación
self.addEventListener('install', (event) => {
console.log('🔧 Service Worker instalando...');
event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(OFFLINE_URLS))
    .then(() => self.skipWaiting())
);
});

// Activación
self.addEventListener('activate', (event) => {
console.log('🚀 Service Worker activado');
event.waitUntil(self.clients.claim());
});

// Estrategia de cache
self.addEventListener('fetch', (event) => {
  // Para APIs, intentar network primero
if (event.request.url.includes('reportecontrolador.php')) {
    event.respondWith(
    fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
        success: false,
        offline: true,
        message: "Modo offline activado"
        }), {
         headers: { 'Content-Type': 'application/json' }
        });
    })
    );
} else {
    // Para recursos estáticos, cache first
    event.respondWith(
    caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
}
});

// Background Sync para reportes offline
self.addEventListener('sync', (event) => {
if (event.tag === 'sincronizar-reportes') {
    console.log('🔄 Background Sync activado para reportes');
    event.waitUntil(sincronizarReportesPendientes());
}
});

// Función para sincronizar reportes
async function sincronizarReportesPendientes() {
try {
    console.log('📡 Sincronizando reportes en background...');
    
    // Obtener clientes activos para enviar mensajes
    const clients = await self.clients.matchAll();
    
    // Enviar mensaje a la app para que sincronice
    clients.forEach(client => {
    client.postMessage({
        type: 'SYNC_REPORTES',
        message: 'Sincronizando reportes pendientes'
    });
    });
    
} catch (error) {
    console.error('❌ Error en background sync:', error);
}
}