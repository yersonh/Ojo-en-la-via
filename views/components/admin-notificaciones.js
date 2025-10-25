// views/components/admin-notificaciones.js
class NotificationManager {
    constructor() {
        this.eventSource = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectTimeout = null;
        this.audioContext = null;
    }

    initialize() {
        console.log('🔔 Inicializando NotificationManager...');
        this.setupEventListeners();
        
        // 🆕 SOLO CONECTAR SSE SI ESTAMOS VISIBLES Y ES PÁGINA ADMIN
        if (document.visibilityState === 'visible' && this.isAdminPage()) {
            // Esperar a que la página esté completamente cargada
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.connectSSE(), 1000);
                });
            } else {
                setTimeout(() => this.connectSSE(), 1000);
            }
        }
        
        // 🆕 LIMPIAR RECURSOS ANTES DE RECARGAR/CERRAR
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
        
        // 🆕 MANEJAR VISIBILIDAD DE LA PÁGINA
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Página en background - desconectar SSE temporalmente
                console.log('👻 Página en background - desconectando SSE');
                this.disconnectSSE();
            } else if (document.visibilityState === 'visible' && !this.isConnected && this.isAdminPage()) {
                // Página visible - reconectar SSE después de un delay
                console.log('👀 Página visible - reconectando SSE');
                setTimeout(() => this.connectSSE(), 2000);
            }
        });
    }

    isAdminPage() {
        return window.location.pathname.includes('admin.php') || 
               document.querySelector('.admin-container') !== null;
    }

    setupEventListeners() {
        // Toggle panel de notificaciones
        const notifIcon = document.getElementById('notificacionIcon');
        const notifPanel = document.getElementById('notificacionesPanel');
        
        if (notifIcon && notifPanel) {
            notifIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                notifPanel.classList.toggle('active');
                this.initAudioContext();
            });
        }

        // Cerrar panel al hacer click fuera
        document.addEventListener('click', (e) => {
            if (notifPanel && !notifPanel.contains(e.target) && !notifIcon.contains(e.target)) {
                notifPanel.classList.remove('active');
            }
        });

        // Marcar todas como leídas
        const marcarTodasBtn = document.getElementById('marcarTodasLeidas');
        if (marcarTodasBtn) {
            marcarTodasBtn.addEventListener('click', () => {
                this.marcarTodasLeidas();
                this.initAudioContext();
            });
        }

        // Delegación de eventos para botones dinámicos
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-marcar-leida')) {
                const notifItem = e.target.closest('.notificacion-item');
                if (notifItem) {
                    const idNotificacion = notifItem.dataset.id;
                    this.marcarComoLeida(idNotificacion, notifItem);
                    this.initAudioContext();
                }
            }
        });

        // Inicializar AudioContext con cualquier click
        document.addEventListener('click', () => {
            this.initAudioContext();
        });
    }

    initAudioContext() {
        if (this.audioContext || !window.AudioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext inicializado');
        } catch (error) {
            console.log('🔇 No se pudo inicializar AudioContext:', error);
        }
    }

    connectSSE() {
        // 🆕 VERIFICAR SI LA PÁGINA ESTÁ SIENDO CERRADA
        if (document.visibilityState === 'hidden') {
            console.log('👻 Página en background - no conectar SSE');
            return;
        }
        
        if (this.eventSource) {
            this.eventSource.close();
        }

        // Limpiar timeout anterior
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        try {
            const sseUrl = '../controllers/sse_notificaciones.php';
            console.log('🔌 Conectando a SSE...');
            
            // 🆕 TIMEOUT DE CONEXIÓN POR SEGURIDAD
            const connectTimeout = setTimeout(() => {
                if (this.eventSource && this.eventSource.readyState !== EventSource.OPEN) {
                    console.log('⏰ Timeout de conexión SSE (5s) - cancelando');
                    this.eventSource.close();
                    this.eventSource = null;
                    this.isConnected = false;
                }
            }, 5000);
            
            this.eventSource = new EventSource(sseUrl);
            
            this.eventSource.onopen = () => {
                clearTimeout(connectTimeout);
                console.log('✅ Conectado a notificaciones en tiempo real');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
            };
            
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'nuevo_reporte') {
                        this.handleNuevoReporte(data.data);
                    } else if (data.type === 'ping') {
                        console.log('📡 Ping recibido - Conexión activa');
                    } else if (data.type === 'error') {
                        console.error('❌ Error del servidor SSE:', data.message);
                        this.handleSSEError(data.message);
                    } else if (data.type === 'connected') {
                        console.log('✅ ' + data.message);
                    }
                } catch (parseError) {
                    console.error('❌ Error parseando mensaje SSE:', parseError);
                }
            };
            
            this.eventSource.onerror = (error) => {
                clearTimeout(connectTimeout);
                console.error('❌ Error en conexión SSE');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    const delay = Math.min(2000 * this.reconnectAttempts, 10000);
                    console.log(`🔄 Reintentando en ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    
                    this.reconnectTimeout = setTimeout(() => {
                        this.reconnectSSE();
                    }, delay);
                } else {
                    console.log('🚫 Máximo de intentos alcanzado - SSE desactivado');
                    this.showToast('Notificaciones en tiempo real desactivadas', 'error');
                }
            };
            
        } catch (error) {
            console.error('❌ Error inicializando SSE:', error);
            this.updateConnectionStatus(false);
        }
    }

    // 🆕 MÉTODO PARA DESCONECTAR TEMPORALMENTE
    disconnectSSE() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.isConnected = false;
            console.log('🔴 SSE desconectado (página en background)');
            this.updateConnectionStatus(false);
        }
    }

    reconnectSSE() {
        console.log('🔄 Reconectando SSE...');
        this.connectSSE();
    }

    // 🆕 MÉTODO PARA LIMPIAR TODOS LOS RECURSOS
    destroy() {
        console.log('🧹 Limpiando recursos de NotificationManager...');
        
        // Cerrar conexión SSE
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            console.log('🔴 Conexión SSE cerrada');
        }
        
        // Limpiar timeouts
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        this.isConnected = false;
        this.updateConnectionStatus(false);
    }

    handleSSEError(message) {
        console.error('❌ Error SSE:', message);
        this.showToast('Error en notificaciones: ' + message, 'error');
    }

    updateConnectionStatus(connected) {
        const notifIcon = document.getElementById('notificacionIcon');
        if (notifIcon) {
            if (connected) {
                notifIcon.classList.remove('offline');
                notifIcon.title = 'Notificaciones en tiempo real - Conectado';
            } else {
                notifIcon.classList.add('offline');
                notifIcon.title = 'Notificaciones - Sin conexión';
            }
        }
    }

    async testSSEConnection() {
        try {
            const baseUrl = window.location.origin;
            const testUrl = `${baseUrl}/controllers/sse_notificaciones.php`;
            
            console.log('🔍 Probando conexión SSE:', testUrl);
            
            const response = await fetch(testUrl);
            console.log('🔍 Estado SSE:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return true;
        } catch (error) {
            console.error('🔍 Error probando SSE:', error);
            return false;
        }
    }

    handleNuevoReporte(reporteData) {
        console.log('📢 Nuevo reporte en tiempo real:', reporteData);
        
        // 1. Mostrar notificación en tiempo real
        this.mostrarNotificacionTiempoReal(reporteData);
        
        // 2. Actualizar badge
        this.incrementarBadge();
        
        // 3. Reproducir sonido
        this.playNotificationSound();
        
        // 4. Notificación del navegador
        this.showBrowserNotification(reporteData);
    }

    mostrarNotificacionTiempoReal(reporteData) {
        this.agregarAlPanelNotificaciones(reporteData);
        this.showToast(`📢 ${reporteData.mensaje}`, 'info');
    }

    agregarAlPanelNotificaciones(reporteData) {
        const notifList = document.querySelector('.notificaciones-list');
        if (!notifList) {
            console.warn('❌ No se encontró el contenedor de notificaciones');
            return;
        }

        const notifElement = this.crearElementoNotificacion({
            id_notificacion: 'temp-' + Date.now(),
            mensaje: reporteData.mensaje,
            tipo: 'nuevo_reporte',
            fecha_creacion: new Date().toISOString(),
            leida: 0,
            id_reporte: reporteData.id_reporte
        });

        notifList.insertBefore(notifElement, notifList.firstChild);
        
        // Remover notificación vacía si existe
        const notifVacia = notifList.querySelector('.notificacion-vacia');
        if (notifVacia) {
            notifVacia.remove();
        }
    }

    crearElementoNotificacion(notificacion) {
        const div = document.createElement('div');
        div.className = `notificacion-item ${notificacion.leida ? '' : 'no-leida'}`;
        div.dataset.id = notificacion.id_notificacion;
        
        const icono = this.getNotificationIcon(notificacion.tipo);
        
        div.innerHTML = `
            <div class="notificacion-icono">
                <i class="fas ${icono.icon} ${icono.color}"></i>
            </div>
            <div class="notificacion-contenido">
                <div class="notificacion-mensaje">${notificacion.mensaje}</div>
                <div class="notificacion-meta">
                    <span class="notificacion-fecha">
                        ${this.formatTime(notificacion.fecha_creacion)}
                    </span>
                </div>
                <div class="notificacion-acciones">
                    <a href="admin.php?ver_reporte=${notificacion.id_reporte}" class="btn-ver-reporte">
                        <i class="fas fa-eye"></i> Ver Reporte
                    </a>
                    ${!notificacion.leida ? 
                        `<button class="btn-marcar-leida">
                            <i class="fas fa-check"></i> Marcar leída
                        </button>` : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    playNotificationSound() {
        if (!this.audioContext) {
            this.initAudioContext();
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.3);
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.log('🔇 Error reproduciendo sonido:', error);
        }
    }

    getNotificationIcon(tipo) {
        const icons = {
            'nuevo_reporte': { icon: 'fa-exclamation-circle', color: 'text-warning' },
            'alerta_autoridad': { icon: 'fa-paper-plane', color: 'text-info' },
            'like': { icon: 'fa-heart', color: 'text-danger' },
            'comentario': { icon: 'fa-comment', color: 'text-success' },
            'default': { icon: 'fa-bell', color: 'text-primary' }
        };
        
        return icons[tipo] || icons.default;
    }

    showBrowserNotification(reporteData) {
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("🚨 Nuevo Reporte - Villavicencio", {
                body: reporteData.mensaje,
                icon: '../../imagenes/fiveicon.png',
                tag: reporteData.id_reporte
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
                window.location.href = `admin.php?ver_reporte=${reporteData.id_reporte}`;
            };
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    ${type === 'info' ? '📢' : type === 'success' ? '✅' : '⚠️'}
                </div>
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    incrementarBadge() {
        const badge = document.querySelector('.notificacion-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
            badge.style.display = 'flex';
        }
        
        const countElement = document.querySelector('.notificacion-count');
        if (countElement) {
            const currentText = countElement.textContent;
            const newCount = (parseInt(currentText) || 0) + 1;
            countElement.textContent = `${newCount} sin leer`;
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        
        return date.toLocaleDateString('es-CO', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async marcarComoLeida(idNotificacion, element) {
        try {
            const formData = new FormData();
            formData.append('id_notificacion', idNotificacion);
            formData.append('action', 'marcar_notificacion_leida');
            
            const response = await fetch('admin.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                element.classList.remove('no-leida');
                element.querySelector('.btn-marcar-leida')?.remove();
                this.updateNotificationBadge(-1);
            }
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    }

    async marcarTodasLeidas() {
        try {
            const formData = new FormData();
            formData.append('action', 'marcar_todas_leidas');
            
            const response = await fetch('admin.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                document.querySelectorAll('.notificacion-item.no-leida').forEach(item => {
                    item.classList.remove('no-leida');
                    item.querySelector('.btn-marcar-leida')?.remove();
                });
                this.updateNotificationBadge(0);
                this.showToast('Todas las notificaciones marcadas como leídas', 'success');
            }
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector('.notificacion-badge');
        const countElement = document.querySelector('.notificacion-count');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        if (countElement) {
            if (count > 0) {
                countElement.textContent = `${count} sin leer`;
            } else {
                countElement.textContent = 'Todas leídas';
            }
        }
    }
}

// Inicialización mejorada con manejo de errores
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en una página de admin
    if (window.location.pathname.includes('admin.php') || 
        document.querySelector('.admin-container')) {
        
        try {
            window.notificationManager = new NotificationManager();
            window.notificationManager.initialize();
            
            console.log('✅ NotificationManager inicializado correctamente');
            
            // Solicitar permisos de notificación después de un delay
            if ("Notification" in window && Notification.permission === "default") {
                setTimeout(() => {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            console.log('✅ Permisos de notificación concedidos');
                        }
                    });
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Error inicializando NotificationManager:', error);
        }
    }
});

// 🆕 Asegurar que se limpien los recursos incluso si hay errores
window.addEventListener('error', function() {
    if (window.notificationManager) {
        window.notificationManager.destroy();
    }
});