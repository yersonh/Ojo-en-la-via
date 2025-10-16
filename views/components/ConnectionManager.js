// ConnectionManager - Versión SIN ERRORES CORS
class ConnectionManager {
    constructor() {
        this.isOnline = true;
        this.lastOnlineState = true;
        this.listeners = [];
        this.checkInterval = null;
        this.isChecking = false;
        this.consecutiveFailures = 0;
        this.maxFailures = 2;
        
        this.init();
    }

    init() {
        console.log('🌐 ConnectionManager iniciado');
        
        // Eventos nativos
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Verificación cada 10 segundos (menos frecuente)
        this.startActiveChecking();
        
        setTimeout(() => this.checkConnection(), 1000);
    }

    handleOnline() {
        console.log('📡 Evento nativo: ONLINE');
        this.setOnlineState(true);
    }

    handleOffline() {
        console.log('📡 Evento nativo: OFFLINE');
        this.setOnlineState(false);
    }

    async checkConnection() {
        if (this.isChecking) return;
        this.isChecking = true;
        
        try {
            // 🎯 SOLO 2 métodos para evitar CORS
            const isActuallyOnline = await this.simpleReliableCheck();
            
            if (isActuallyOnline) {
                this.consecutiveFailures = 0;
                if (!this.isOnline) {
                    console.log('🔍 Verificación: Cambio a ONLINE');
                    this.setOnlineState(true);
                }
            } else {
                this.consecutiveFailures++;
                console.log(`🔍 Verificación: Fallo ${this.consecutiveFailures}/${this.maxFailures}`);
                
                if (this.consecutiveFailures >= this.maxFailures && this.isOnline) {
                    console.log('🔍 Verificación: Cambio a OFFLINE');
                    this.setOnlineState(false);
                }
            }
            
        } catch (error) {
            console.log('🔍 Verificación: Error');
            this.consecutiveFailures++;
            
            if (this.consecutiveFailures >= this.maxFailures && this.isOnline) {
                this.setOnlineState(false);
            }
        } finally {
            this.isChecking = false;
        }
    }

    async simpleReliableCheck() {
        // 🎯 SOLO métodos que no generan CORS
        const checks = [
            this.checkWithFetchNoCors(),
            this.checkWithImage()
        ];
        
        const results = await Promise.allSettled(checks);
        
        const onlineCount = results.filter(result => 
            result.status === 'fulfilled' && result.value === true
        ).length;
        
        console.log(`🔍 Resultados: ${onlineCount}/2 métodos dicen ONLINE`);
        
        return onlineCount >= 1; // Solo 1 de 2 necesita funcionar
    }

    async checkWithFetchNoCors() {
        try {
            // Usar modo no-cors para evitar errores
            const response = await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors', // 🎯 Importante: evitar CORS
                headers: { 'Cache-Control': 'no-cache' }
            });
            // En modo no-cors, si no hay error = hay conexión
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkWithImage() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            
            setTimeout(() => resolve(false), 3000);
            
            img.src = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png?t=' + Date.now();
        });
    }

    startActiveChecking() {
        // Verificación cada 10 segundos (menos spam)
        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 10000);
    }

    setOnlineState(online) {
        if (this.isOnline === online) return;
        
        console.log(`🌐 CAMBIO: ${this.isOnline ? 'ONLINE' : 'OFFLINE'} → ${online ? 'ONLINE' : 'OFFLINE'}`);
        
        this.isOnline = online;
        this.notifyListeners();
        this.updateUI();
        
        if (online) {
            this.onConnectionRestored();
        }
    }

    updateUI() {
        if (!this.isOnline) {
            this.showOfflineUI();
        } else {
            this.hideOfflineUI();
        }
    }

    showOfflineUI() {
        console.log('🔴 Activando modo offline');
        this.hideOfflineUI();
        
        const banner = document.createElement('div');
        banner.id = 'connection-status-message';
        banner.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; 
                background: #dc2626; color: white; padding: 12px 20px; 
                text-align: center; font-weight: bold; z-index: 10000; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                animation: slideDown 0.5s ease;
                font-size: 14px;
            ">
                ⚠️ SIN CONEXIÓN - Modo offline activado 📶
            </div>
        `;
        document.body.appendChild(banner);
        this.disableOnlineFeatures();
    }

    hideOfflineUI() {
        console.log('🟢 Desactivando modo offline');
        const banner = document.getElementById('connection-status-message');
        if (banner) banner.remove();
        this.enableOnlineFeatures();
    }

    disableOnlineFeatures() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const searchBtn = document.getElementById('btnBuscar');
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.innerHTML = '📶 Sin Conexión';
        }
        
        if (searchBtn) {
            searchBtn.disabled = true;
            searchBtn.style.opacity = '0.5';
            searchBtn.innerHTML = '🔍 Offline';
        }
    }

    enableOnlineFeatures() {
        const submitBtn = document.querySelector('button[type="submit"]');
        const searchBtn = document.getElementById('btnBuscar');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = 'Registrar Reporte';
        }
        
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.style.opacity = '1';
            searchBtn.innerHTML = 'Buscar';
        }
    }

    onConnectionRestored() {
        console.log('🟢 Conexión restaurada');
        setTimeout(() => {
            if (window.mapaSistema) {
                window.mapaSistema.recargarReportes();
            }
        }, 2000);
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

    simulateConnectionChange(online) {
        console.log('🧪 Simulando:', online ? 'ONLINE' : 'OFFLINE');
        this.setOnlineState(online);
    }

    async forceCheck() {
        console.log('🔍 Forzando verificación...');
        await this.checkConnection();
    }

    destroy() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.hideOfflineUI();
    }
}

// Crear instancia global
const connectionManager = new ConnectionManager();