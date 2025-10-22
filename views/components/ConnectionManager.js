// ConnectionManager - VERSIÓN QUE DETECTA WIFI REAL
if (window.connectionManager && typeof window.connectionManager === 'object') {
    console.log('✅ ConnectionManager ya está inicializado');
} else {
    class ConnectionManager {
        constructor() {
            this.isOnline = navigator.onLine;
            this.listeners = [];
            this.consecutiveFailures = 0;
            this.maxFailures = 1; // Solo 1 falla para cambiar a offline
            this.isChecking = false;

            console.log('🌐 ConnectionManager iniciado - Estado:', this.isOnline ? 'ONLINE' : 'OFFLINE');
            
            this.init();
        }

        init() {
            // 🆕 EVENTOS PRINCIPALES - Confiar más en el navegador
            window.addEventListener('online', () => {
                console.log('📡 EVENTO ONLINE del navegador');
                this.handleBrowserOnline();
            });
            
            window.addEventListener('offline', () => {
                console.log('📡 EVENTO OFFLINE del navegador');
                this.setOnlineState(false);
            });

            // 🆕 Verificar cada 3 segundos (más frecuente)
            setInterval(() => this.checkConnection(), 3000);
        }

        handleBrowserOnline() {
            // Cuando el navegador dice online, verificar realmente
            setTimeout(() => {
                this.checkConnection();
            }, 1000);
        }

        async checkConnection() {
            if (this.isChecking) return;
            this.isChecking = true;
            
            try {
                console.log('🔍 Verificando conexión a internet...');
                
                // 🆕 ESTRATEGIA MEJORADA: Verificar si tenemos internet real
                const hasRealInternet = await this.checkRealInternet();
                
                if (hasRealInternet) {
                    this.consecutiveFailures = 0;
                    if (!this.isOnline) {
                        console.log('🟢 INTERNET DETECTADO - Cambiando a ONLINE');
                        this.setOnlineState(true);
                    }
                } else {
                    // 🆕 Si no hay internet real, cambiar a offline inmediatamente
                    if (this.isOnline) {
                        console.log('🔴 SIN INTERNET - Cambiando a OFFLINE');
                        this.setOnlineState(false);
                    }
                }
                
            } catch (error) {
                console.log('🔍 Error en verificación:', error);
                // 🆕 Si hay error, asumir que no hay internet
                if (this.isOnline) {
                    console.log('🔴 ERROR - Cambiando a OFFLINE');
                    this.setOnlineState(false);
                }
            } finally {
                this.isChecking = false;
            }
        }

        async checkRealInternet() {
            // VERIFICAR INTERNET REAL, NO SOLO CONEXIÓN LOCAL
            
            // 1. Primero verificar si el navegador dice que está offline
            if (!navigator.onLine) {
                console.log('❌ Navegador reporta OFFLINE');
                return false;
            }
            
            // 2. Intentar conectar a un recurso externo confiable
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                // 🆕 Usar un recurso que solo funcione con internet real
                const response = await fetch('https://httpbin.org/status/200', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    console.log('✅ Conexión a internet confirmada');
                    return true;
                } else {
                    console.log('❌ Respuesta no OK de internet');
                    return false;
                }
                
            } catch (error) {
                console.log('❌ No se pudo conectar a internet:', error.message);
                
                // FALLBACK: Intentar con Google (pero sin bloquear)
                try {
                    const fallbackResponse = await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), {
                        method: 'HEAD',
                        cache: 'no-cache',
                        mode: 'no-cors'
                    });
                    console.log('✅ Fallback a Google exitoso');
                    return true;
                } catch (fallbackError) {
                    console.log('❌ Fallback también falló');
                    return false;
                }
            }
        }

        setOnlineState(online) {
            if (this.isOnline === online) {
                return;
            }
            
            this.isOnline = online;
            console.log('🌐🔥 CAMBIO DE ESTADO:', online ? 'ONLINE' : 'OFFLINE');
            
            this.notifyListeners();
            this.updateUI();
            
            if (online) {
                this.onConnectionRestored();
            }
        }

        updateUI() {
            if (this.isOnline) {
                this.hideOfflineUI();
            } else {
                this.showOfflineUI();
            }
        }

        showOfflineUI() {
            console.log('🔴 ACTIVANDO MODO OFFLINE');
            this.hideOfflineUI();
            
            const banner = document.createElement('div');
            banner.id = 'connection-status-message';
            banner.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #dc2626;
                    color: white;
                    padding: 12px 20px;
                    text-align: center;
                    font-weight: bold;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                ">
                    📶 MODO OFFLINE - Sin conexión a internet
                </div>
            `;
            document.body.appendChild(banner);
            
            this.disableOnlineFeatures();
        }

        hideOfflineUI() {
            console.log('🟢 DESACTIVANDO MODO OFFLINE');
            const banner = document.getElementById('connection-status-message');
            if (banner) banner.remove();
            
            this.enableOnlineFeatures();
        }

        disableOnlineFeatures() {
            const searchBtn = document.getElementById('btnBuscar');
            if (searchBtn) {
                searchBtn.disabled = true;
                searchBtn.style.opacity = '0.5';
                searchBtn.innerHTML = '🔍 Offline';
            }
        }

        enableOnlineFeatures() {
            const searchBtn = document.getElementById('btnBuscar');
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.style.opacity = '1';
                searchBtn.innerHTML = 'Buscar';
            }
        }

        onConnectionRestored() {
            console.log('🟢 CONEXIÓN RESTAURADA - Sincronizando...');
            
            if (window.OfflineManager && window.OfflineManager.intentarSincronizacionInmediata) {
                setTimeout(() => {
                    window.OfflineManager.intentarSincronizacionInmediata();
                }, 1000);
            }
        }

        addListener(callback) {
            this.listeners.push(callback);
        }

        notifyListeners() {
            this.listeners.forEach(listener => {
                try {
                    listener(this.isOnline);
                } catch (error) {
                    console.error('Error en listener:', error);
                }
            });
        }

        getStatus() {
            return this.isOnline;
        }
    }

    window.connectionManager = new ConnectionManager();
}