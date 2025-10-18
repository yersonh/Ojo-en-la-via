// Gestor de sincronización en background
class BackgroundSyncManager {
    constructor() {
        this.initialized = false;
        this.syncInProgress = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log('🔄 Inicializando Background Sync Manager...');

        try {
            // 1. Registrar Service Worker
            if ('serviceWorker' in navigator) {
                await this.registerServiceWorker();
            }

            // 2. Configurar event listeners
            this.setupEventListeners();

            // 3. Sincronizar al iniciar si hay conexión
            await this.sincronizarSilenciosamente();

            this.initialized = true;
            console.log('✅ Background Sync Manager inicializado');

        } catch (error) {
            console.error('❌ Error inicializando Background Sync Manager:', error);
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registrado:', registration.scope);

            // Escuchar mensajes del Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });

            return registration;
        } catch (error) {
            console.log('⚠️ Service Worker no disponible:', error.message);
            throw error;
        }
    }

    setupEventListeners() {
        // Sincronizar cuando se recupera la conexión
        window.addEventListener('online', () => {
            console.log('📡 Conexión recuperada - Sincronizando...');
            this.sincronizarSilenciosamente();
        });

        // Sincronizar cuando la página se vuelve visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                this.sincronizarSilenciosamente();
            }
        });

        // Sincronizar periódicamente cada 5 minutos
        setInterval(() => {
            if (navigator.onLine) {
                this.sincronizarSilenciosamente();
            }
        }, 5 * 60 * 1000);
    }

    async sincronizarSilenciosamente() {
        if (this.syncInProgress || !navigator.onLine) return;

        this.syncInProgress = true;

        try {
            const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
            if (pendientes.length === 0) return;

            console.log(`🔄 Sincronizando ${pendientes.length} reportes en background...`);
            
            await OfflineManager.sincronizarReportesPendientes();
            
        } catch (error) {
            console.log('🔴 Error en sincronización background:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // Sincronización manual (desde botón)
    async sincronizarManual() {
        if (this.syncInProgress) {
            console.log('⏳ Sincronización ya en progreso...');
            return;
        }

        this.mostrarLoadingSincronizacion();

        try {
            await OfflineManager.sincronizarReportesPendientes();
            this.mostrarExitoSincronizacion();
        } catch (error) {
            this.mostrarErrorSincronizacion(error);
        }
    }

    mostrarLoadingSincronizacion() {
        // Podrías mostrar un toast de carga
        if (window.formularioSistema) {
            window.formularioSistema.showAlert('⏳ Sincronizando reportes...', 'info');
        }
    }

    mostrarExitoSincronizacion() {
        if (window.formularioSistema) {
            window.formularioSistema.showAlert('✅ Sincronización completada', 'success');
        }
    }

    mostrarErrorSincronizacion(error) {
        console.error('❌ Error en sincronización manual:', error);
        if (window.formularioSistema) {
            window.formularioSistema.showAlert('❌ Error al sincronizar', 'error');
        }
    }

    handleServiceWorkerMessage(event) {
        const { type, message } = event.data;
        
        switch (type) {
            case 'SYNC_REPORTES':
                console.log('📡 Mensaje del Service Worker:', message);
                this.sincronizarSilenciosamente();
                break;
            
            case 'SYNC_COMPLETED':
                console.log('✅ Sincronización completada desde Service Worker');
                OfflineManager.actualizarBadgePendientes();
                break;
        }
    }

    // Verificar estado de sincronización
    getSyncStatus() {
        return {
            initialized: this.initialized,
            syncInProgress: this.syncInProgress,
            hasPending: JSON.parse(localStorage.getItem('reportes_pendientes') || '[]').length > 0
        };
    }
}

// Instancia global
const backgroundSyncManager = new BackgroundSyncManager();

// Inicialización automática
document.addEventListener('DOMContentLoaded', async () => {
    await backgroundSyncManager.initialize();
});