// Módulo mejorado para manejar reportes offline con resiliencia
const OfflineManager = {
    dbName: 'ReportesOfflineDB',
    dbVersion: 2, // Versión incrementada
    db: null,
    initialized: false,

    // Inicialización mejorada
    async inicializar() {
        if (this.initialized) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ Error al abrir IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                console.log('✅ Base de datos offline inicializada');
                
                // Verificar pendientes al inicializar
                this.verificarEstadoInicial();
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear almacén para reportes pendientes
                if (!db.objectStoreNames.contains('reportes_pendientes')) {
                    const store = db.createObjectStore('reportes_pendientes', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    store.createIndex('fecha', 'fecha', { unique: false });
                    store.createIndex('estado', 'estado', { unique: false });
                    store.createIndex('intentos', 'intentos', { unique: false });
                }

                if (!db.objectStoreNames.contains('imagenes_offline')) {
                    db.createObjectStore('imagenes_offline', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                }
            };
        });
    },

    // 🆕 MÉTODO PRINCIPAL MEJORADO - Estrategia híbrida
    async procesarReporteConResiliencia(formData) {
    // 🆕 VERIFICACIÓN MÁS ROBUSTA DE CONEXIÓN
    const tieneConexion = await this.verificarConexionReal();
    
    console.log(`🔍 Verificación conexión: ${tieneConexion ? 'ONLINE' : 'OFFLINE'}`);
    
    if (tieneConexion) {
        // 🟢 INTENTAR ENVÍO INMEDIATO
        try {
            console.log('🟢 Intentando envío inmediato ONLINE...');
            const resultado = await this.enviarReporteOnline(formData);
            return { 
                success: true, 
                modo: 'online',
                data: resultado 
            };
        } catch (error) {
            console.log('🟡 Falló envío online, guardando offline:', error.message);
            // Continuar con flujo offline
        }
    }

    // 🔴 MODO OFFLINE - GUARDADO INMEDIATO
    console.log('🔴 Guardando en modo OFFLINE...');
    const idOffline = await this.guardarReporteYProgramarSync(formData);
    
    return {
        success: true,
        modo: 'offline', 
        idOffline: idOffline,
        mensaje: 'Reporte guardado localmente'
    };
},
async verificarConexionReal() {
    // 1. Verificar estado nativo del navegador
    if (!navigator.onLine) {
        console.log('📡 Navigator reporta: OFFLINE');
        return false;
    }
    
    // 2. Verificar nuestro ConnectionManager si existe
    if (window.connectionManager && !window.connectionManager.getStatus()) {
        console.log('📡 ConnectionManager reporta: OFFLINE');
        return false;
    }
    
    // 3. Verificación activa con timeout corto
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(window.location.origin + '/?connection-test=' + Date.now(), {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        const estaOnline = response.ok;
        console.log('📡 Verificación activa:', estaOnline ? 'ONLINE' : 'OFFLINE');
        return estaOnline;
        
    } catch (error) {
        console.log('📡 Verificación activa falló: OFFLINE');
        return false;
    }
},

    // 🆕 ENVÍO ONLINE CON TIMEOUT Y RECUPERACIÓN
    async enviarReporteOnline(formData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

        try {
            console.log('🌐 Enviando reporte online...');
            const respuesta = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            
            const resultado = await respuesta.json();
            if (!resultado.success) {
                throw new Error(resultado.mensaje || resultado.error);
            }

            console.log('✅ Reporte enviado online correctamente');
            return resultado;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Guardando localmente...');
            }
            throw error;
        }
    },

    // 🆕 VERIFICACIÓN ROBUSTA DE CONEXIÓN
    async verificarConexionRobusta() {
        // Verificación básica
        if (!navigator.onLine) return false;
        
        // Verificación de conexión real (no solo "conectado" sino con internet)
        try {
            const response = await fetch('/?connection-test=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    verificarConexion() {
        return navigator.onLine;
    },

    // 🆕 GUARDADO RÁPIDO + BACKGROUND SYNC MEJORADO
    async guardarReporteOffline(formData) {
    if (!this.db) await this.inicializar();

    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['reportes_pendientes'], 'readwrite');
        const store = transaction.objectStore('reportes_pendientes');

        // 🆕 CREAR HASH ÚNICO PARA EVITAR DUPLICADOS
        const datosReporte = {
            id_tipo_incidente: formData.get('id_tipo_incidente'),
            descripcion: formData.get('descripcion'),
            latitud: formData.get('latitud'),
            longitud: formData.get('longitud'),
            id_usuario: formData.get('id_usuario')
        };
        
        const hash = this.crearHashReporte(datosReporte);
        
        const reporte = {
            datos: datosReporte,
            imagenes: [],
            fecha: new Date().toISOString(),
            estado: 'pendiente',
            intentos: 0,
            timestamp: Date.now(),
            hash: hash // 🆕 ID único para evitar duplicados
        };

        // 🆕 VERIFICAR SI YA EXISTE UN REPORTE SIMILAR
        const verificarRequest = store.index('hash').get(hash);
        
        verificarRequest.onsuccess = () => {
            if (verificarRequest.result) {
                console.log('⚠️ Reporte similar ya existe, actualizando...');
                // Actualizar timestamp del reporte existente
                const reporteExistente = verificarRequest.result;
                reporteExistente.timestamp = Date.now();
                reporteExistente.intentos = 0;
                
                const updateRequest = store.put(reporteExistente);
                updateRequest.onsuccess = () => {
                    console.log('✅ Reporte existente actualizado:', reporteExistente.id);
                    resolve(reporteExistente.id);
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                // Proceder con guardado normal
                this.procesarImagenesYGuardar(store, reporte, formData, resolve, reject);
            }
        };
        
        verificarRequest.onerror = () => reject(verificarRequest.error);
    });
},
crearHashReporte(datos) {
    const str = `${datos.id_tipo_incidente}-${datos.descripcion}-${datos.latitud}-${datos.longitud}-${datos.id_usuario}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
},
procesarImagenesYGuardar(store, reporte, formData, resolve, reject) {
    const imagenes = formData.getAll('imagen[]');
    if (imagenes && imagenes.length > 0) {
        const imagenPromises = Array.from(imagenes).map((imagen, index) => {
            return this.guardarImagenOffline(imagen);
        });

        Promise.all(imagenPromises)
            .then(imagenIds => {
                reporte.imagenes = imagenIds;
                const request = store.add(reporte);
                
                request.onsuccess = () => {
                    console.log('✅ Nuevo reporte guardado offline con ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => reject(request.error);
            })
            .catch(reject);
    } else {
        const request = store.add(reporte);
        
        request.onsuccess = () => {
            console.log('✅ Nuevo reporte guardado offline con ID:', request.result);
            resolve(request.result);
        };
        
        request.onerror = () => reject(request.error);
    }
},

    // Guardar reporte offline (existente pero mejorado)
    async guardarReporteOffline(formData) {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['reportes_pendientes'], 'readwrite');
            const store = transaction.objectStore('reportes_pendientes');

            const reporte = {
                datos: {
                    id_tipo_incidente: formData.get('id_tipo_incidente'),
                    descripcion: formData.get('descripcion'),
                    latitud: formData.get('latitud'),
                    longitud: formData.get('longitud'),
                    id_usuario: formData.get('id_usuario')
                },
                imagenes: [],
                fecha: new Date().toISOString(),
                estado: 'pendiente',
                intentos: 0,
                timestamp: Date.now()
            };

            // Procesar imágenes
            const imagenes = formData.getAll('imagen[]');
            if (imagenes && imagenes.length > 0) {
                const imagenPromises = Array.from(imagenes).map((imagen, index) => {
                    return this.guardarImagenOffline(imagen);
                });

                Promise.all(imagenPromises)
                    .then(imagenIds => {
                        reporte.imagenes = imagenIds;
                        const request = store.add(reporte);
                        
                        request.onsuccess = () => {
                            console.log('✅ Reporte guardado offline con ID:', request.result);
                            resolve(request.result);
                        };
                        
                        request.onerror = () => reject(request.error);
                    })
                    .catch(reject);
            } else {
                const request = store.add(reporte);
                
                request.onsuccess = () => {
                    console.log('✅ Reporte guardado offline con ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => reject(request.error);
            }
        });
    },

    // 🆕 PROGRAMAR SINCRONIZACIÓN MEJORADA
    async programarSincronizacion() {
        // Intentar Background Sync si está disponible
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sincronizar-reportes');
                console.log('🔄 Background Sync registrado');
                return;
            } catch (error) {
                console.log('❌ Background Sync no disponible:', error);
            }
        }

        // Fallback: Sincronización programada
        console.log('⏰ Programando sincronización tradicional...');
        this.programarSincronizacionTradicional();
    },

    programarSincronizacionTradicional() {
        // Sincronizar cada 2 minutos cuando haya conexión
        setInterval(() => {
            if (this.verificarConexion()) {
                this.sincronizarReportesPendientes();
            }
        }, 2 * 60 * 1000);
    },

    // 🆕 CONFIRMACIÓN INMEDIATA MEJORADA
    mostrarConfirmacionOffline(idOffline) {
        // Guardar en localStorage para persistencia entre sesiones
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        pendientes.push({
            id: idOffline,
            fecha: new Date().toISOString(),
            timestamp: Date.now(),
            estado: 'pendiente'
        });
        localStorage.setItem('reportes_pendientes', JSON.stringify(pendientes));
        
        // Mostrar notificación visual
        this.mostrarNotificacionOffline(idOffline);
        
        // Actualizar UI
        this.actualizarBadgePendientes();
    },

    mostrarNotificacionOffline(idOffline) {
        // Usar el sistema de alertas existente
        if (window.formularioSistema) {
            window.formularioSistema.showAlert(
                `✅ Reporte guardado (ID: ${idOffline}). Se enviará automáticamente cuando recuperes conexión.`,
                'success'
            );
        } else {
            // Fallback
            alert(`✅ Reporte guardado (ID: ${idOffline}). Se enviará automáticamente cuando recuperes conexión.`);
        }
    },

    // 🆕 BADGE MEJORADO
    actualizarBadgePendientes() {
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        const badge = document.getElementById('badge-pendientes') || this.crearBadgePendientes();
        
        badge.textContent = pendientes.length;
        badge.style.display = pendientes.length > 0 ? 'flex' : 'none';
        
        // Actualizar título de la página
        this.actualizarTituloPagina(pendientes.length);
    },

    crearBadgePendientes() {
        const badge = document.createElement('div');
        badge.id = 'badge-pendientes';
        badge.style.cssText = `
            position: fixed;
            top: 15px;
            left: 15px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
        `;
        
        badge.addEventListener('click', () => {
            this.mostrarPanelPendientes();
        });
        
        document.body.appendChild(badge);
        return badge;
    },

    actualizarTituloPagina(cantidadPendientes) {
        if (cantidadPendientes > 0) {
            document.title = `(${cantidadPendientes}) Ojo en la Vía - Villavicencio`;
        } else {
            document.title = 'Ojo en la Vía - Villavicencio';
        }
    },

    // 🆕 PANEL DE PENDIENTES
    mostrarPanelPendientes() {
        const panel = document.getElementById('panel-pendientes') || this.crearPanelPendientes();
        this.actualizarContenidoPanelPendientes();
        panel.style.display = 'block';
    },

    crearPanelPendientes() {
        const panel = document.createElement('div');
        panel.id = 'panel-pendientes';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 50px;
                left: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                min-width: 280px;
                max-width: 350px;
                display: none;
                border: 1px solid #e5e7eb;
            ">
                <div style="padding: 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <strong>📋 Reportes Pendientes</strong>
                    <button id="cerrar-panel" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280;">×</button>
                </div>
                <div id="lista-pendientes" style="max-height: 300px; overflow-y: auto; padding: 10px;">
                    <div style="text-align: center; color: #6b7280; padding: 20px;">
                        Cargando...
                    </div>
                </div>
                <div style="padding: 12px; border-top: 1px solid #e5e7eb; text-align: center; background: #f8f9fa;">
                    <button id="btn-sincronizar" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        🔄 Sincronizar Ahora
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Event listeners
        document.getElementById('cerrar-panel').addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        document.getElementById('btn-sincronizar').addEventListener('click', async () => {
            await this.sincronizarManual();
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target.id !== 'badge-pendientes') {
                panel.style.display = 'none';
            }
        });
        
        return panel;
    },

    async actualizarContenidoPanelPendientes() {
        const lista = document.getElementById('lista-pendientes');
        if (!lista) return;

        try {
            const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
            
            if (pendientes.length === 0) {
                lista.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">No hay reportes pendientes</div>';
                return;
            }

            lista.innerHTML = pendientes.map(pendiente => `
                <div style="padding: 10px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 500;">ID: ${pendiente.id}</div>
                        <div style="font-size: 12px; color: #6b7280;">
                            ${new Date(pendiente.fecha).toLocaleDateString()} 
                            ${new Date(pendiente.fecha).toLocaleTimeString()}
                        </div>
                    </div>
                    <div style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                        Pendiente
                    </div>
                </div>
            `).join('');
        } catch (error) {
            lista.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 20px;">Error al cargar pendientes</div>';
        }
    },

    // 🆕 SINCRONIZACIÓN MANUAL
    async sincronizarManual() {
        const btnSincronizar = document.getElementById('btn-sincronizar');
        const originalText = btnSincronizar.innerHTML;
        
        btnSincronizar.innerHTML = '⏳ Sincronizando...';
        btnSincronizar.disabled = true;
        
        try {
            await this.sincronizarReportesPendientes();
            btnSincronizar.innerHTML = '✅ Sincronizado';
        } catch (error) {
            btnSincronizar.innerHTML = '❌ Error';
            console.error('Error en sincronización manual:', error);
        } finally {
            setTimeout(() => {
                btnSincronizar.innerHTML = originalText;
                btnSincronizar.disabled = false;
            }, 2000);
        }
    },

    // 🆕 VERIFICAR ESTADO INICIAL MEJORADO
    async verificarEstadoInicial() {
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        
        if (pendientes.length > 0 && await this.verificarConexionRobusta()) {
            console.log(`🔄 Hay ${pendientes.length} reportes pendientes de sesiones anteriores`);
            // Sincronizar después de 3 segundos (dar tiempo a que cargue la app)
            setTimeout(() => {
                this.sincronizarReportesPendientes();
            }, 3000);
        }
        
        this.actualizarBadgePendientes();
    },

    // ... (MÉTODOS EXISTENTES - mantener igual)
    async guardarImagenOffline(archivoImagen) {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['imagenes_offline'], 'readwrite');
            const store = transaction.objectStore('imagenes_offline');

            const reader = new FileReader();
            reader.onload = function(e) {
                const imagenData = {
                    nombre: archivoImagen.name,
                    tipo: archivoImagen.type,
                    datos: e.target.result,
                    fecha: new Date().toISOString()
                };

                const request = store.add(imagenData);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(archivoImagen);
        });
    },

    async obtenerImagenOffline(id) {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['imagenes_offline'], 'readonly');
            const store = transaction.objectStore('imagenes_offline');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async obtenerReportesPendientes() {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['reportes_pendientes'], 'readonly');
            const store = transaction.objectStore('reportes_pendientes');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async eliminarReporteOffline(id) {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['reportes_pendientes'], 'readwrite');
            const store = transaction.objectStore('reportes_pendientes');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // SINCRONIZACIÓN MEJORADA
    async sincronizarReportesPendientes() {
        if (!await this.verificarConexionRobusta()) {
            console.log('📡 Sin conexión, no se puede sincronizar');
            return;
        }

        try {
            const reportesPendientes = await this.obtenerReportesPendientes();
            console.log(`🔄 Sincronizando ${reportesPendientes.length} reportes pendientes...`);

            let sincronizadosExitosos = 0;
            let errores = 0;

            for (const reporte of reportesPendientes) {
                try {
                    // No intentar sincronizar reportes con muchos intentos fallidos
                    if (reporte.intentos >= 3) {
                        console.log(`⏭️ Saltando reporte ${reporte.id} (demasiados intentos)`);
                        continue;
                    }

                    await this.enviarReporteOffline(reporte);
                    await this.eliminarReporteOffline(reporte.id);
                    this.actualizarLocalStorageDespuesSync(reporte.id);
                    sincronizadosExitosos++;
                    
                    console.log(`✅ Reporte ${reporte.id} sincronizado correctamente`);
                } catch (error) {
                    console.error(`❌ Error sincronizando reporte ${reporte.id}:`, error);
                    await this.actualizarIntentoReporte(reporte.id, reporte.intentos + 1);
                    errores++;
                }
            }

            // Mostrar resumen
            if (sincronizadosExitosos > 0) {
                this.mostrarNotificacionSincronizacion(sincronizadosExitosos);
            }
            
            if (errores > 0) {
                console.log(`⚠️ ${errores} reportes no pudieron sincronizarse`);
            }

        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    },

    async enviarReporteOffline(reporte) {
        const formData = new FormData();
        
        // Agregar datos básicos
        Object.keys(reporte.datos).forEach(key => {
            formData.append(key, reporte.datos[key]);
        });

        // Agregar imágenes
        for (const imagenId of reporte.imagenes) {
            const imagenData = await this.obtenerImagenOffline(imagenId);
            if (imagenData) {
                const response = await fetch(imagenData.datos);
                const blob = await response.blob();
                formData.append('imagen[]', blob, imagenData.nombre);
            }
        }

        const respuesta = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
            method: 'POST',
            body: formData
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();
        if (!resultado.success) {
            throw new Error(resultado.mensaje || resultado.error);
        }

        return resultado;
    },

    async actualizarIntentoReporte(id, intentos) {
        if (!this.db) await this.inicializar();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['reportes_pendientes'], 'readwrite');
            const store = transaction.objectStore('reportes_pendientes');
            const request = store.get(id);

            request.onsuccess = () => {
                const reporte = request.result;
                reporte.intentos = intentos;
                reporte.ultimoIntento = new Date().toISOString();

                const updateRequest = store.put(reporte);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    },

    actualizarLocalStorageDespuesSync(idReporte) {
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        const nuevosPendientes = pendientes.filter(p => p.id !== idReporte);
        localStorage.setItem('reportes_pendientes', JSON.stringify(nuevosPendientes));
        this.actualizarBadgePendientes();
    },

    mostrarNotificacionSincronizacion(cantidad) {
        // Notificación del sistema
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('✅ Reportes Sincronizados', {
                body: `${cantidad} reporte(s) se enviaron correctamente`,
                icon: '/icon.png'
            });
        }

        // Notificación en la interfaz
        if (window.formularioSistema) {
            window.formularioSistema.showAlert(`✅ ${cantidad} reporte(s) pendientes se sincronizaron`, 'success');
        }
    },

    async solicitarPermisosNotificaciones() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
};

// Inicialización automática
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await OfflineManager.inicializar();
        console.log('🎯 OfflineManager listo');
    } catch (error) {
        console.error('❌ Error inicializando OfflineManager:', error);
    }
});
window.OfflineManager = OfflineManager;