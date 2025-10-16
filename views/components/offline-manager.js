// Módulo para manejar reportes offline
const OfflineManager = {
    dbName: 'ReportesOfflineDB',
    dbVersion: 1,
    db: null,

    // Inicializar la base de datos
    async inicializar() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ Error al abrir IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Base de datos offline inicializada');
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
                    
                    // Crear índices para búsquedas
                    store.createIndex('fecha', 'fecha', { unique: false });
                    store.createIndex('estado', 'estado', { unique: false });
                }

                // Crear almacén para imágenes offline
                if (!db.objectStoreNames.contains('imagenes_offline')) {
                    db.createObjectStore('imagenes_offline', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                }
            };
        });
    },

    // Verificar conexión a internet
    verificarConexion() {
        return navigator.onLine;
    },

    // Guardar reporte offline
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
                intentos: 0
            };

            // Guardar imágenes en almacén separado
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

    // 🆕 GUARDADO RÁPIDO + BACKGROUND SYNC
    async guardarReporteYProgramarSync(formData) {
        try {
            // 1. Guardar rápidamente en IndexedDB
            const idOffline = await this.guardarReporteOffline(formData);
            console.log('💾 Reporte guardado localmente:', idOffline);
            
            // 2. Programar sincronización para cuando haya conexión
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sincronizar-reportes');
                console.log('🔄 Background Sync registrado');
            } else {
                // Fallback: Sincronización tradicional
                this.programarSincronizacion();
            }
            
            // 3. Mostrar confirmación inmediata al usuario
            this.mostrarConfirmacionOffline(idOffline);
            
            return idOffline;
            
        } catch (error) {
            console.error('❌ Error guardando offline:', error);
            throw error;
        }
    },

    // 🆕 CONFIRMACIÓN QUE FUNCIONA INMEDIATAMENTE
    mostrarConfirmacionOffline(idOffline) {
        // Guardar en localStorage para persistir entre sesiones
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        pendientes.push({
            id: idOffline,
            fecha: new Date().toISOString(),
            timestamp: Date.now()
        });
        localStorage.setItem('reportes_pendientes', JSON.stringify(pendientes));
        
        // Mostrar alerta inmediata
        MapaManager.mostrarAlerta(
            `✅ Reporte guardado (ID: ${idOffline}). Se enviará automáticamente cuando tengas conexión.`,
            'success'
        );
        
        // Mostrar badge de pendientes
        this.actualizarBadgePendientes();
    },

    // 🆕 BADGE PARA SABER CUÁNTOS REPORTES PENDIENTES HAY
    actualizarBadgePendientes() {
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        const badge = document.getElementById('badge-pendientes') || this.crearBadgePendientes();
        
        badge.textContent = pendientes.length;
        badge.style.display = pendientes.length > 0 ? 'flex' : 'none';
        
        // Actualizar título de la página
        if (pendientes.length > 0) {
            document.title = `(${pendientes.length}) Ojo en la Vía - Villavicencio`;
        } else {
            document.title = 'Ojo en la Vía - Villavicencio';
        }
    },

    crearBadgePendientes() {
        const badge = document.createElement('div');
        badge.id = 'badge-pendientes';
        badge.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                left: 10px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            "></div>
        `;
        document.body.appendChild(badge);
        return badge;
    },

    // 🆕 VERIFICAR ESTADO AL CARGAR LA PÁGINA
    async verificarEstadoInicial() {
        // Verificar si hay reportes pendientes de sesiones anteriores
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        
        if (pendientes.length > 0 && this.verificarConexion()) {
            console.log(`🔄 Hay ${pendientes.length} reportes pendientes de sesiones anteriores`);
            await this.sincronizarReportesPendientes();
        }
        
        this.actualizarBadgePendientes();
    },

    // 🆕 PROGRAMAR SINCRONIZACIÓN PERIÓDICA
    programarSincronizacion() {
        // Intentar sincronizar cada 5 minutos cuando haya conexión
        setInterval(() => {
            if (this.verificarConexion()) {
                this.sincronizarReportesPendientes();
            }
        }, 5 * 60 * 1000); // 5 minutos
    },

    // Guardar imagen en IndexedDB
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

    // Obtener imagen de IndexedDB
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

    // Obtener todos los reportes pendientes
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

    // Eliminar reporte sincronizado
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

    // Sincronizar reportes pendientes cuando haya conexión
    async sincronizarReportesPendientes() {
        if (!this.verificarConexion()) {
            console.log('📡 Sin conexión, no se puede sincronizar');
            return;
        }

        try {
            const reportesPendientes = await this.obtenerReportesPendientes();
            console.log(`🔄 Sincronizando ${reportesPendientes.length} reportes pendientes...`);

            for (const reporte of reportesPendientes) {
                try {
                    await this.enviarReporteOffline(reporte);
                    await this.eliminarReporteOffline(reporte.id);
                    
                    // 🆕 ACTUALIZAR LOCALSTORAGE también
                    this.actualizarLocalStorageDespuesSync(reporte.id);
                    
                    console.log(`✅ Reporte ${reporte.id} sincronizado correctamente`);
                } catch (error) {
                    console.error(`❌ Error sincronizando reporte ${reporte.id}:`, error);
                    // Incrementar intentos y actualizar
                    await this.actualizarIntentoReporte(reporte.id, reporte.intentos + 1);
                }
            }

            // Mostrar notificación de éxito
            if (reportesPendientes.length > 0) {
                this.mostrarNotificacionSincronizacion(reportesPendientes.length);
            }
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    },

    // 🆕 ACTUALIZAR LOCALSTORAGE DESPUÉS DE SINCRONIZAR
    actualizarLocalStorageDespuesSync(idReporte) {
        const pendientes = JSON.parse(localStorage.getItem('reportes_pendientes') || '[]');
        const nuevosPendientes = pendientes.filter(p => p.id !== idReporte);
        localStorage.setItem('reportes_pendientes', JSON.stringify(nuevosPendientes));
        this.actualizarBadgePendientes();
    },

    // Enviar reporte offline al servidor
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
                // Convertir dataURL a Blob
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

    // Actualizar número de intentos
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

    // Mostrar notificación de sincronización
    mostrarNotificacionSincronizacion(cantidad) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Reportes Sincronizados', {
                body: `${cantidad} reporte(s) se subieron correctamente`,
                icon: '/icon.png'
            });
        }

        // También mostrar alerta en la interfaz
        MapaManager.mostrarAlerta(`✅ ${cantidad} reporte(s) pendientes se sincronizaron`, 'success');
    },

    // Solicitar permisos para notificaciones
    async solicitarPermisosNotificaciones() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
};