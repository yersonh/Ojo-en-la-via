// ConnectionManager - Versión CORREGIDA
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
        
        // Verificación cada 10 segundos
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
        if (!this.isOnline && this.consecutiveFailures > 5) {
        console.log('🔴 Ya en modo offline, reduciendo verificaciones...');
        return;
    }
        if (this.isChecking) return;
        this.isChecking = true;
        
        try {
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
        const checks = [
            this.checkWithFetchNoCors(),
            this.checkWithImage()
        ];
        
        const results = await Promise.allSettled(checks);
        
        const onlineCount = results.filter(result => 
            result.status === 'fulfilled' && result.value === true
        ).length;
        
        console.log(`🔍 Resultados: ${onlineCount}/2 métodos dicen ONLINE`);
        
        return onlineCount >= 1;
    }

    async checkWithFetchNoCors() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors',
                headers: { 'Cache-Control': 'no-cache' }
            });
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

    // 🆕 MÉTODO ÚNICO PARA UI OFFLINE
    showOfflineUI() {
        console.log('🔴 Activando modo offline');
        this.hideOfflineUI();
        
        // Banner mejorado
        this.mostrarBannerOffline();
        
        // Deshabilitar funciones online (PERO NO EL BOTÓN DE ENVIAR)
        this.disableOnlineFeatures();
        
        // Mensaje en mapa
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
            // 🆕 IMPORTANTE: NO DESHABILITAR EL BOTÓN DE ENVIAR
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

    destroy() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        if (this.checkInterval) clearInterval(this.checkInterval);
        this.hideOfflineUI();
    }
}

// Crear instancia global
const connectionManager = new ConnectionManager();