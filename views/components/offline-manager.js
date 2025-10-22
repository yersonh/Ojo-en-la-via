// ConnectionManager - VERSIÓN FINAL SIN ERRORES DE GOOGLE
class ConnectionManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.lastOnlineState = this.isOnline;
        this.listeners = [];
        this.checkInterval = null;
        this.isChecking = false;
        this.consecutiveFailures = 0;
        this.maxFailures = 2;
        this.backoffDelay = 1000;
        this.maxBackoff = 30000;
        
        this.init();
    }

    init() {
        console.log('🌐 ConnectionManager iniciado');
        
        // Eventos nativos del navegador
        window.addEventListener('online', () => this.handleBrowserOnline());
        window.addEventListener('offline', () => this.handleBrowserOffline());
        
        // Verificación activa con backoff inteligente
        this.startIntelligentChecking();
        
        // Verificación inicial
        setTimeout(() => this.checkConnection(), 1000);
    }

    handleBrowserOnline() {
        console.log('📡 Evento nativo: ONLINE - Verificando realmente...');
        this.checkConnection();
    }

    handleBrowserOffline() {
        console.log('📡 Evento nativo: OFFLINE');
        this.setOnlineState(false);
    }

    async checkConnection() {
        if (this.isChecking) return;
        this.isChecking = true;
        
        try {
            // 🆕 VERIFICACIÓN SEGURA SIN GOOGLE
            const isActuallyOnline = await this.safeConnectionCheck();
            
            if (isActuallyOnline) {
                this.handleOnlineDetection();
            } else {
                this.handleOfflineDetection();
            }
            
        } catch (error) {
            console.log('🔍 Verificación: Error', error);
            this.handleOfflineDetection();
        } finally {
            this.isChecking = false;
        }
    }

    // 🆕 VERIFICACIÓN SEGURA - SIN GOOGLE NI RECURSOS EXTERNOS
    async safeConnectionCheck() {
        const checks = [
            this.quickHeadCheck(),    // Verificación a nuestro servidor
            this.corsSafeCheck()      // Verificación CORS-safe
        ];
        
        try {
            // Si alguna verificación pasa, estamos online
            const result = await Promise.any(checks.map(check => 
                check.then(result => {
                    if (!result) throw new Error('Check failed');
                    return result;
                })
            ));
            return true;
        } catch (error) {
            return false;
        }
    }

    async quickHeadCheck() {
        try {
            // Verificación ultra rápida a nuestro propio servidor
            const response = await fetch(window.location.origin + '/?connection-check=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 3000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async corsSafeCheck() {
        return new Promise((resolve) => {
            // 🆕 VERIFICACIÓN COMPLETAMENTE SEGURA SIN CORS
            // Usar XMLHttpRequest que es más tolerante
            const xhr = new XMLHttpRequest();
            xhr.timeout = 3000;
            
            xhr.onload = () => {
                // Si podemos hacer la petición (aunque falle por CORS), tenemos conexión
                resolve(true);
            };
            
            xhr.onerror = () => resolve(false);
            xhr.ontimeout = () => resolve(false);
            
            // Intentar cargar un recurso local que siempre exista
            xhr.open('HEAD', window.location.origin + '/favicon.ico?' + Date.now());
            xhr.send();
        });
    }

    handleOnlineDetection() {
        this.consecutiveFailures = 0;
        this.backoffDelay = 1000;
        
        if (!this.isOnline) {
            console.log('🟢 Verificación: Cambio a ONLINE');
            this.setOnlineState(true);
            this.notifyConnectionRestored();
        }
    }

    handleOfflineDetection() {
        this.consecutiveFailures++;
        console.log(`🔴 Verificación: Fallo ${this.consecutiveFailures}/${this.maxFailures}`);
        
        if (this.consecutiveFailures >= this.maxFailures && this.isOnline) {
            console.log('🔴 Verificación: Cambio a OFFLINE');
            this.setOnlineState(false);
        }
    }

    // 🆕 VERIFICACIÓN INTELIGENTE CON BACKOFF
    startIntelligentChecking() {
        const checkWithBackoff = () => {
            const delay = this.getNextCheckDelay();
            
            this.checkInterval = setTimeout(() => {
                if (this.shouldCheckNow()) {
                    this.checkConnection();
                }
                checkWithBackoff();
            }, delay);
        };
        
        checkWithBackoff();
    }

    getNextCheckDelay() {
        if (this.isOnline) {
            // Online: verificar cada 20-40 segundos
            return 20000 + Math.random() * 20000;
        } else {
            // Offline: backoff exponencial
            const delay = this.backoffDelay;
            this.backoffDelay = Math.min(this.backoffDelay * 1.5, this.maxBackoff);
            return delay + Math.random() * 2000;
        }
    }

    shouldCheckNow() {
        // No verificar si la pestaña no está visible
        if (document.visibilityState !== 'visible') return false;
        if (navigator.connection && navigator.connection.saveData) return false;
        
        return true;
    }

    setOnlineState(online) {
        if (this.isOnline === online) return;
        
        const oldState = this.isOnline;
        this.isOnline = online;
        
        console.log(`🌐 CAMBIO DE ESTADO: ${oldState ? 'ONLINE' : 'OFFLINE'} → ${online ? 'ONLINE' : 'OFFLINE'}`);
        
        this.notifyListeners();
        this.updateUI();
        
        if (online && !oldState) {
            this.onConnectionRestored();
        }
    }

    // 🆕 NOTIFICACIÓN ESPECÍFICA PARA RECUPERACIÓN
    notifyConnectionRestored() {
        this.listeners.forEach(listener => {
            try {
                if (typeof listener === 'function') {
                    listener(true, true);
                } else if (typeof listener === 'object' && listener.onConnectionRestored) {
                    listener.onConnectionRestored();
                }
            } catch (error) {
                console.error('Error en listener:', error);
            }
        });
    }

    updateUI() {
        if (!this.isOnline) {
            this.showOfflineUI();
        } else {
            this.hideOfflineUI();
        }
    }

    // 🆕 MÉTODO MEJORADO PARA AGREGAR LISTENERS
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    // 🆕 MÉTODO PARA AGREGAR OBJETOS CON MÚLTIPLES HANDLERS
    addListenerObject(listenerObj) {
        this.listeners.push(listenerObj);
    }

    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                if (typeof listener === 'function') {
                    listener(this.isOnline);
                } else if (typeof listener === 'object' && listener.onConnectionChange) {
                    listener.onConnectionChange(this.isOnline);
                }
            } catch (error) {
                console.error('Error en listener:', error);
            }
        });
    }

    onConnectionRestored() {
        console.log('🟢 Conexión restaurada - Notificando sistemas...');
        
        // Notificar a OfflineManager para sincronización inmediata
        if (window.OfflineManager) {
            setTimeout(() => {
                window.OfflineManager.intentarSincronizacionInmediata();
            }, 1000);
        }
        
        // Recargar mapa si existe
        if (window.mapaSistema) {
            setTimeout(() => {
                window.mapaSistema.recargarReportes();
            }, 2000);
        }
    }

    // 🆕 MÉTODO ÚNICO PARA UI OFFLINE (MANTENIDO DE TU CÓDIGO)
    showOfflineUI() {
        console.log('🔴 Activando modo offline');
        this.hideOfflineUI();
        this.mostrarBannerOffline();
        this.disableOnlineFeatures();
        this.mostrarMensajeMapaOffline();
    }

    // 🆕 BANNER OFFLINE MEJORADO
    mostrarBannerOffline() {
        const banner = document.createElement('div');
        banner.id = 'connection-status-message';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f59e0b;
                color: white;
                padding: 12px 20px;
                text-align: center;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                animation: slideDown 0.5s ease;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            ">
                <span>📶</span>
                MODO OFFLINE - Los reportes se guardan localmente y se enviarán automáticamente
                <span>💾</span>
            </div>
            <style>
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(banner);
    }

    // 🆕 DESHABILITAR FUNCIONES ONLINE (PERMITIR ENVÍO OFFLINE)
    disableOnlineFeatures() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const searchBtn = document.getElementById('btnBuscar');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '💾 Guardar Localmente';
            submitBtn.title = 'El reporte se guardará localmente y se enviará cuando haya conexión';
        }
        
        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.style.opacity = '0.5';
            searchBtn.innerHTML = '🔍 Offline';
        }
    }

    // 🆕 HABILITAR FUNCIONES ONLINE
    enableOnlineFeatures() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const searchBtn = document.getElementById('btnBuscar');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = '📝 Registrar Reporte';
            submitBtn.title = '';
        }
        
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.style.opacity = '1';
            searchBtn.innerHTML = 'Buscar';
        }
    }

    // 🆕 LIMPIAR UI OFFLINE
    hideOfflineUI() {
        // Remover banner
        const banner = document.getElementById('connection-status-message');
        if (banner) banner.remove();
        
        // Remover overlay del mapa
        if (this.offlineMapOverlay && window.mapaSistema) {
            window.mapaSistema.getMap().removeLayer(this.offlineMapOverlay);
            this.offlineMapOverlay = null;
        }
        
        // Habilitar funciones
        this.enableOnlineFeatures();
    }

    // 🆕 MENSAJE EN MAPA
    mostrarMensajeMapaOffline() {
        if (!window.mapaSistema) return;
        
        const map = window.mapaSistema.getMap();
        
        if (this.offlineMapOverlay) {
            map.removeLayer(this.offlineMapOverlay);
        }
        
        this.offlineMapOverlay = L.rectangle(map.getBounds(), {
            color: '#6b7280',
            fillColor: '#f3f4f6',
            fillOpacity: 0.5,
            weight: 1,
            interactive: false
        }).addTo(map);
        
        this.offlineMapOverlay.bindPopup(`
            <div style="text-align: center; padding: 15px; min-width: 250px;">
                <div style="font-size: 32px; margin-bottom: 10px;">📶</div>
                <strong style="color: #dc2626; font-size: 16px;">Mapa no disponible</strong>
                <p style="margin: 10px 0; color: #6b7280; font-size: 14px;">
                    Sin conexión a internet<br>
                    <strong>Los reportes se guardan localmente</strong><br>
                    y se enviarán automáticamente<br>
                    cuando recuperes conexión
                </p>
            </div>
        `).openPopup();
    }

    getStatus() {
        return this.isOnline;
    }

    destroy() {
        window.removeEventListener('online', this.handleBrowserOnline);
        window.removeEventListener('offline', this.handleBrowserOffline);
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.hideOfflineUI();
    }
}

// Crear instancia global
const connectionManager = new ConnectionManager();