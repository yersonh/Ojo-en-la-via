// Módulo para gestionar el mapa y marcadores
const MapaManager = {
    map: null,
    markerCluster: null,
    markers: [],
    markerNuevo: null,

    inicializar() {
        // Inicializar mapa centrado en Villavicencio
        this.map = L.map('map').setView([4.142, -73.626], 13);

        // Cargar mapa base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Inicializar cluster de marcadores
        this.markerCluster = L.markerClusterGroup();
        this.map.addLayer(this.markerCluster);

        // Configurar evento de clic en el mapa
        this.configurarEventos();
    },

    configurarEventos() {
        this.map.on('click', (e) => {
            this.seleccionarUbicacion(e.latlng);
        });
    },

    seleccionarUbicacion(latlng) {
        const { lat, lng } = latlng;
        
        // Remover marcador anterior si existe
        if (this.markerNuevo) {
            this.map.removeLayer(this.markerNuevo);
        }
        
        // Crear nuevo marcador con estilo destacado
        this.markerNuevo = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker marker-selected',
                html: '🎯',
                iconSize: [35, 35],
                iconAnchor: [17, 35]
            })
        }).addTo(this.map);
        
        // Actualizar coordenadas en el formulario
        FormularioManager.actualizarCoordenadas(lat, lng);
        
        // Mostrar popup con las coordenadas
        this.markerNuevo.bindPopup(`
            <div style="text-align: center;">
                <strong>Ubicación seleccionada</strong><br>
                Lat: ${lat.toFixed(6)}<br>
                Lng: ${lng.toFixed(6)}
            </div>
        `).openPopup();
    },

    crearPopupContent(reporte) {
        return `
            <div style="min-width: 300px;">
                <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${reporte.tipo_incidente}</h4>
                <p style="margin: 0 0 8px 0; line-height: 1.4;">${reporte.descripcion}</p>
                <div style="font-size: 12px; color: #666; line-height: 1.3; margin-bottom: 15px;">
                    <strong>Reportado por:</strong> ${reporte.usuario}<br>
                    <strong>Fecha:</strong> ${new Date(reporte.fecha_reporte).toLocaleDateString()}<br>
                    <strong>Estado:</strong> <span style="color: ${reporte.estado === 'Pendiente' ? 'orange' : reporte.estado === 'Resuelto' ? 'green' : 'blue'}; font-weight: bold;">${reporte.estado}</span>
                </div>
                <button onclick="ComentariosManager.abrirComentarios(${reporte.id_reporte})" 
                        style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    💬 Ver Comentarios
                </button>
            </div>
        `;
    },

    async cargarReportes() {
        try {
            this.markerCluster.clearLayers();
            this.markers = [];

            const resp = await fetch('../../controllers/reportecontrolador.php?action=listar');
            const data = await resp.json();

            console.log('📊 Reportes cargados desde BD:', data);
            
            data.forEach(r => {
                const icono = L.divIcon({
                    className: 'custom-marker',
                    html: '📍',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                });

                const marker = L.marker([r.latitud, r.longitud], { icon: icono });
                
                marker.bindPopup(this.crearPopupContent(r));
                
                this.markerCluster.addLayer(marker);
                this.markers.push(marker);
            });

        } catch (error) {
            console.error('Error al cargar reportes:', error);
            this.mostrarAlerta('Error al cargar reportes del servidor.', 'error');
        }
    },

    mostrarAlerta(mensaje, tipo = 'success') {
        const alertSuccess = document.getElementById('alertSuccess');
        const alertError = document.getElementById('alertError');
        
        if (tipo === 'success') {
            alertSuccess.textContent = mensaje;
            alertSuccess.style.display = 'block';
            alertError.style.display = 'none';
            
            setTimeout(() => {
                alertSuccess.style.display = 'none';
            }, 5000);
        } else {
            alertError.textContent = mensaje;
            alertError.style.display = 'block';
            alertSuccess.style.display = 'none';
        }
    },

    limpiarMarcadorTemporal() {
        if (this.markerNuevo) {
            this.map.removeLayer(this.markerNuevo);
            this.markerNuevo = null;
        }
    }
};