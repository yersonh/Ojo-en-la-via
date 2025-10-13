// admin.js - Versión con scroll corregido
class AdminManager {
    constructor() {
        this.map = null;
        this.mapInitialized = false;
        this.markers = [];
        this.init();
    }

    init() {
        // Primero asegurar que el scroll funcione
        this.fixScrollIssues();
        
        this.setupNavigation();
        this.setupEventListeners();
        this.initializeMapIfNeeded();
    }

    // SOLUCIÓN PARA EL SCROLL
    fixScrollIssues() {
        console.log('🔓 Aplicando fix para scroll...');
        
        // Remover cualquier estilo que bloquee el scroll
        const elementsToFix = [
            document.documentElement,
            document.body,
            document.querySelector('.admin-container'),
            document.querySelector('.main-content'),
            document.querySelector('.tab-content'),
            document.querySelector('.dashboard-content')
        ];
        
        elementsToFix.forEach(element => {
            if (element) {
                element.style.overflow = '';
                element.style.overflowX = '';
                element.style.overflowY = '';
                element.style.height = '';
                element.style.maxHeight = '';
                element.style.minHeight = '';
                element.style.position = '';
            }
        });
        
        // Forzar estilos correctos
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';
        
        console.log('✅ Fix de scroll aplicado');
    }

    // Navegación entre pestañas
    setupNavigation() {
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                
                link.classList.add('active');
                const tabId = link.getAttribute('data-tab');
                const selectedTab = document.getElementById(tabId);
                
                if (selectedTab) {
                    selectedTab.classList.add('active');
                    
                    if (tabId === 'dashboard') {
                        setTimeout(() => this.initializeMapIfNeeded(), 100);
                    } else {
                        this.safeCleanupMap();
                    }
                }
            });
        });
    }

    // Inicializar mapa solo si es necesario
    initializeMapIfNeeded() {
        if (this.mapInitialized) {
            console.log('ℹ️ Mapa ya inicializado');
            return;
        }

        const mapContainer = document.getElementById('adminMap');
        if (!mapContainer) {
            console.error('❌ Contenedor adminMap no encontrado');
            return;
        }

        if (!this.isContainerReady(mapContainer)) {
            console.error('❌ Contenedor no está listo');
            return;
        }

        this.initializeMap(mapContainer);
    }

    // Verificar si el contenedor está listo
    isContainerReady(container) {
        if (!container || !container.getBoundingClientRect) return false;
        
        const rect = container.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && document.body.contains(container);
    }

    // Inicializar el mapa de forma SEGURA
    initializeMap(container) {
        try {
            console.log('🗺️ Inicializando mapa...');

            // Limpiar contenedor
            this.cleanContainer(container);

            // Crear mapa con configuración básica
            this.map = L.map('adminMap', {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true,
                // Configuración para no interferir con scroll
                scrollWheelZoom: false,
                dragging: true,
                doubleClickZoom: true,
                boxZoom: true,
                keyboard: false
            }).setView([4.142, -73.626], 13);

            // Añadir capa base
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Prevenir que el mapa interfiera con el scroll
            this.preventMapScrollInterference();

            this.mapInitialized = true;
            console.log('✅ Mapa inicializado correctamente');

            // Cargar reportes INMEDIATAMENTE
            this.cargarReportesEnMapa();

        } catch (error) {
            console.error('💥 Error inicializando mapa:', error);
            this.handleMapError();
        }
    }

    // Prevenir interferencia del mapa con el scroll
    preventMapScrollInterference() {
        if (!this.map) return;

        // Desactivar scroll wheel zoom
        this.map.scrollWheelZoom.disable();

        // Prevenir eventos de rueda
        const mapContainer = this.map.getContainer();
        mapContainer.addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });

        mapContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.stopPropagation();
            }
        }, { passive: false });
    }

    // Cargar reportes en el mapa
    async cargarReportesEnMapa() {
        if (!this.map || !this.mapInitialized) {
            console.log('❌ Mapa no disponible para cargar reportes');
            return;
        }

        console.log('📊 Cargando reportes...');

        try {
            const response = await fetch('../../controllers/reportecontrolador.php?action=listar');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const reportes = await response.json();
            console.log(`📊 ${reportes.length} reportes cargados desde BD`);

            // LIMPIAR MARCADORES EXISTENTES
            this.clearMarkers();

            // FILTRAR REPORTES VÁLIDOS
            const validReportes = reportes.filter(reporte => 
                reporte.latitud && reporte.longitud &&
                !isNaN(parseFloat(reporte.latitud)) && !isNaN(parseFloat(reporte.longitud))
            );

            console.log(`📍 ${validReportes.length} reportes con coordenadas válidas`);

            // CREAR MARCADORES
            validReportes.forEach(reporte => {
                try {
                    const lat = parseFloat(reporte.latitud);
                    const lng = parseFloat(reporte.longitud);
                    
                    // Crear marcador con icono personalizado
                    const marker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '📍',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30]
                        })
                    }).addTo(this.map);
                    
                    // Bind popup con contenido
                    marker.bindPopup(this.createPopupContent(reporte));
                    
                    // Guardar referencia
                    this.markers.push(marker);
                    
                    console.log(`✅ Marcador creado para: ${reporte.tipo_incidente}`);
                    
                } catch (markerError) {
                    console.error('Error creando marcador:', markerError);
                }
            });

            // AJUSTAR VISTA DEL MAPA
            if (this.markers.length > 0) {
                const group = L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
                console.log('🎯 Vista ajustada a los marcadores');
            } else {
                console.log('ℹ️ No hay marcadores para mostrar');
                this.showMapMessage('No hay reportes con coordenadas válidas para mostrar', 'info');
            }

        } catch (error) {
            console.error('❌ Error cargando reportes:', error);
            this.showMapMessage('Error al cargar reportes: ' + error.message, 'error');
        }
    }

    // LIMPIAR MARCADORES
    clearMarkers() {
        console.log(`🧹 Limpiando ${this.markers.length} marcadores...`);
        
        this.markers.forEach(marker => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        
        this.markers = [];
        console.log('✅ Marcadores limpiados');
    }

    // Limpiar contenedor
    cleanContainer(container) {
        try {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            if (container._leaflet_id) {
                delete container._leaflet_id;
            }
        } catch (error) {
            console.error('Error limpiando contenedor:', error);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshMapBtn' || e.target.closest('#refreshMapBtn')) {
                this.refreshMap();
            }
            
            if (e.target.classList.contains('eliminar-reporte')) {
                const idReporte = e.target.getAttribute('data-id');
                AdminManager.eliminarReporte(idReporte);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('cambiar-estado')) {
                const idReporte = e.target.getAttribute('data-id');
                const nuevoEstado = e.target.value;
                AdminManager.cambiarEstadoReporte(idReporte, nuevoEstado);
            }
            
            if (e.target.classList.contains('cambiar-estado-usuario')) {
                const idUsuario = e.target.getAttribute('data-id');
                const nuevoEstado = e.target.value;
                AdminManager.cambiarEstadoUsuario(idUsuario, nuevoEstado);
            }
            
            if (e.target.id === 'filtroEstado') {
                this.filterReportesByEstado(e.target.value);
            }
        });
    }

    // Refrescar mapa
    refreshMap() {
        console.log('🔁 Refrescando mapa y reportes...');
        
        if (this.map && this.mapInitialized) {
            // Solo recargar reportes, no el mapa completo
            this.cargarReportesEnMapa();
        } else {
            // Si el mapa no está inicializado, reinicializar
            this.safeCleanupMap();
            setTimeout(() => {
                this.initializeMapIfNeeded();
            }, 500);
        }
    }

    // Limpieza segura del mapa
    safeCleanupMap() {
        // Limpiar marcadores primero
        this.clearMarkers();
        
        // Luego limpiar mapa
        if (this.map) {
            try {
                this.map.remove();
            } catch (error) {
                console.error('Error removiendo mapa:', error);
            }
            this.map = null;
        }
        this.mapInitialized = false;
    }

    // Mostrar mensaje en el mapa
    showMapMessage(mensaje, tipo = 'info') {
        const mapContainer = document.getElementById('adminMap');
        if (mapContainer) {
            const color = tipo === 'error' ? '#dc3545' : 
                         tipo === 'warning' ? '#f39c12' : '#007bff';
            const icon = tipo === 'error' ? 'exclamation-triangle' : 
                        tipo === 'warning' ? 'exclamation-circle' : 'info-circle';
            
            mapContainer.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f8f9fa; color: ${color}; text-align: center; padding: 20px;">
                    <div>
                        <i class="fas fa-${icon}" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p style="margin: 0; font-weight: bold;">${mensaje}</p>
                        <button onclick="window.adminManager.refreshMap()" 
                                style="padding: 8px 16px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                            Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Crear contenido del popup
    createPopupContent(reporte) {
        const statusColor = this.getStatusColor(reporte.estado);
        return `
            <div style="min-width: 250px; max-width: 300px;">
                <h4 style="margin: 0 0 8px 0; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                    ${reporte.tipo_incidente || 'Incidente'}
                </h4>
                <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">
                    ${reporte.descripcion || 'Sin descripción'}
                </p>
                <div style="font-size: 12px; color: #666; line-height: 1.4;">
                    <strong>Usuario:</strong> ${reporte.correo || reporte.usuario || 'Anónimo'}<br>
                    <strong>Fecha:</strong> ${new Date(reporte.fecha_reporte).toLocaleDateString()}<br>
                    <strong>Estado:</strong> <span style="color: ${statusColor}; font-weight: bold;">${reporte.estado || 'Desconocido'}</span>
                </div>
            </div>
        `;
    }

    getStatusColor(estado) {
        const colors = {
            'Pendiente': '#f39c12',
            'En Proceso': '#3498db', 
            'Resuelto': '#27ae60',
            'Verificado': '#9b59b6'
        };
        return colors[estado] || '#95a5a6';
    }

    // Manejar error del mapa
    handleMapError() {
        this.mapInitialized = false;
        this.map = null;
        this.markers = [];
        
        this.showMapMessage('Error al inicializar el mapa', 'error');
    }

    // Filtrar reportes por estado
    filterReportesByEstado(estado) {
        const filas = document.querySelectorAll('#reportes tbody tr');
        filas.forEach(fila => {
            const badge = fila.querySelector('.badge');
            if (badge) {
                const estadoFila = badge.textContent.trim();
                fila.style.display = (!estado || estadoFila === estado) ? '' : 'none';
            }
        });
    }

    // Escapar HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Métodos estáticos
AdminManager.cambiarEstadoReporte = function(idReporte, nuevoEstado) {
    if (confirm(`¿Cambiar estado del reporte #${idReporte} a "${nuevoEstado}"?`)) {
        this.enviarAccion('cambiar_estado_reporte', { id_reporte: idReporte, nuevo_estado: nuevoEstado });
    }
};

AdminManager.eliminarReporte = function(idReporte) {
    if (confirm(`¿Estás seguro de eliminar el reporte #${idReporte}?`)) {
        this.enviarAccion('eliminar_reporte', { id_reporte: idReporte });
    }
};

AdminManager.cambiarEstadoUsuario = function(idUsuario, nuevoEstado) {
    const accion = nuevoEstado == 1 ? 'activar' : 'desactivar';
    if (confirm(`¿${accion.toUpperCase()} al usuario #${idUsuario}?`)) {
        this.enviarAccion('cambiar_estado_usuario', { id_usuario: idUsuario, nuevo_estado: nuevoEstado });
    }
};

AdminManager.enviarAccion = function(accion, datos) {
    const formData = new FormData();
    formData.append('action', accion);
    for (const [key, value] of Object.entries(datos)) {
        formData.append(key, value);
    }

    fetch('admin.php', { method: 'POST', body: formData })
        .then(response => {
            if (response.ok) {
                location.reload();
            } else {
                alert('Error al procesar la solicitud');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error de conexión');
        });
};

// Inicialización con fix de scroll
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado - Inicializando AdminManager...');
    
    // Aplicar fix de scroll inmediatamente
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    window.adminManager = new AdminManager();
    window.refreshAdminMap = function() {
        if (window.adminManager) {
            window.adminManager.refreshMap();
        }
    };
});