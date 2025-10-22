import { Config, TipoIconos } from './utils/Config.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { CacheManager } from './utils/CacheManager.js';

export class MarkerManager {
    constructor(mapaManager) {
        this.mapa = mapaManager;
        this.markerCluster = null;
        this.markers = [];
        this.cache = new CacheManager();
        this.popupManager = null;
    }
    
    inicializar() {
        try {
            this.markerCluster = L.markerClusterGroup(Config.clusters);
            this.mapa.getMap().addLayer(this.markerCluster);
            console.log('✅ MarkerManager inicializado');
        } catch (error) {
            ErrorHandler.mostrarError('Error al inicializar MarkerManager', error);
            throw error;
        }
    }
    
    setPopupManager(popupManager) {
        this.popupManager = popupManager;
    }
    
    async cargarReportes() {
        try {
            this.limpiarMarcadores();
            
            const reportes = await this.cache.obtenerConCache(
                'reportes',
                () => this._fetchReportes()
            );
            
            reportes.forEach((reporte, index) => {
                this.agregarReporte(reporte);
            });
            
            this._ajustarVista();
            return reportes;
        } catch (error) {
            ErrorHandler.mostrarError('Error al cargar reportes', error);
            return [];
        }
    }
    
    async _fetchReportes() {
    try {
        const resp = await fetch('../../controllers/reportecontrolador.php?action=listar');
        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }
        const data = await resp.json();
        console.log('📊 Reportes cargados:', data.length);
        return data;
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        throw error;
    }
}
    
    agregarReporte(reporte) {
        try {
            const icono = this._crearIconoPersonalizado(reporte.tipo_incidente, reporte.estado);
            const marker = L.marker([reporte.latitud, reporte.longitud], { icon: icono });
            
            if (this.popupManager) {
                marker.bindPopup(this.popupManager.crearPopupContent(reporte));
            }
            
            // Efectos interactivos
            marker.on('mouseover', function() {
                this.openPopup();
            });
            
            this.markerCluster.addLayer(marker);
            this.markers.push({
                marker: marker,
                data: reporte
            });
            
            return marker;
        } catch (error) {
            ErrorHandler.mostrarError(`Error al agregar reporte ${reporte.id_reporte}`, error);
            return null;
        }
    }
    
    _crearIconoPersonalizado(tipoIncidente, estado) {
        const emoji = TipoIconos[tipoIncidente] || TipoIconos.default;
        const color = Config.icons.estado[estado] || Config.icons.defaultColor;
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;
                ">
                    ${emoji}
                </div>
            `,
            iconSize: [45, 45],
            iconAnchor: [22, 45],
            popupAnchor: [0, -45]
        });
    }
    agregarMarkerOffline(reporteOffline) {
    console.log('📍 Agregando marker offline:', reporteOffline.id);
    
    // 🆕 VERIFICAR SI EL MARKER YA EXISTE
    const markerExistente = this.markers.find(m => 
        m.options && m.options.customId === `offline-${reporteOffline.id}`
    );
    
    if (markerExistente) {
        console.log('⚠️ Marker offline ya existe, no se duplicará:', reporteOffline.id);
        return;
    }
    
    // Crear marker para reporte offline
    const marker = L.marker([reporteOffline.latitud, reporteOffline.longitud], {
        icon: this.crearIconoPersonalizado(reporteOffline.tipo_incidente, true), // true para offline
        customId: `offline-${reporteOffline.id}` // ID único para evitar duplicados
    });
    
    // Configurar popup
    const popupContent = this.crearPopupOffline(reporteOffline);
    marker.bindPopup(popupContent);
    
    // Agregar al mapa y al array
    marker.addTo(this.mapa);
    this.markers.push(marker);
    
    console.log('✅ Marker offline agregado:', reporteOffline.id);
}
crearPopupOffline(reporte) {
    return `
        <div class="popup-offline">
            <div class="popup-header" style="background: #f59e0b; color: white; padding: 8px 12px; border-radius: 4px 4px 0 0;">
                <strong>📶 Reporte Offline</strong>
            </div>
            <div class="popup-content" style="padding: 12px;">
                <p><strong>Tipo:</strong> ${this.obtenerNombreTipoIncidente(reporte.tipo_incidente)}</p>
                <p><strong>Descripción:</strong> ${reporte.descripcion}</p>
                <p><strong>Fecha:</strong> ${new Date(reporte.fecha).toLocaleString()}</p>
                <p><strong>Estado:</strong> <span style="color: #f59e0b; font-weight: bold;">⏳ Pendiente de envío</span></p>
                <div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 12px;">
                    📍 Este reporte se enviará automáticamente cuando recuperes conexión
                </div>
            </div>
        </div>
    `;
}
    
limpiarMarkersOffline() {
    console.log('🧹 Limpiando markers offline...');
    
    this.markers = this.markers.filter(marker => {
        if (marker.options && marker.options.customId && marker.options.customId.startsWith('offline-')) {
            this.mapa.removeLayer(marker);
            return false; // Eliminar del array
        }
        return true; // Mantener en el array
    });
    
    console.log('✅ Markers offline limpiados');
}
    _ajustarVista() {
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers.map(m => m.marker));
            this.mapa.getMap().fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    limpiarMarcadores() {
        this.markerCluster.clearLayers();
        this.markers = [];
        this.cache.clear();
    }
    
    filtrarMarcadores(filtros) {
        this.markers.forEach(({ marker, data }) => {
            const visible = this._cumpleFiltros(data, filtros);
            marker.setOpacity(visible ? 1 : 0.3);
            marker.setZIndexOffset(visible ? 1000 : 0);
        });
    }
    
    _cumpleFiltros(reporte, filtros) {
        // Implementar lógica de filtrado según necesidades
        return true;
    }
    
    obtenerMarcadores() {
        return this.markers.map(m => m.data);
    }
}