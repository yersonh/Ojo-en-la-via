// Módulo para gestionar el mapa y marcadores - VERSIÓN CORREGIDA
const MapaManager = {
    map: null,
    markerCluster: null,
    markers: [],
    markerNuevo: null,

    inicializar() {
        // Inicializar mapa centrado en Villavicencio con estilo mejorado
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true,
            scrollWheelZoom: true,
            dragging: true,
            doubleClickZoom: true,
            boxZoom: true
        }).setView([4.142, -73.626], 13);

        // CARGAR MAPA BASE MEJORADO
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd'
        }).addTo(this.map);

        // Inicializar cluster de marcadores
        this.markerCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true
        });
        this.map.addLayer(this.markerCluster);

        // Agregar controles adicionales
        this.agregarControles();

        // Configurar evento de clic en el mapa
        this.configurarEventos();
    },

    agregarControles() {
        console.log('🔧 Agregando controles al mapa...');
        
        // Control de escala
        L.control.scale({ 
            imperial: false,
            position: 'bottomleft'
        }).addTo(this.map);

        // ✅ CONTROL DE GEOLOCALIZACIÓN MANUAL (sin plugin externo)
        this.agregarControlGeolocalizacionManual();
    },

    agregarControlGeolocalizacionManual() {
    // Crear control personalizado estilo Google Maps
    const LocateControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            
            container.innerHTML = `
                <a href="#" title="Mostrar mi ubicación actual" 
                   style="display: block; width: 40px; height: 40px; 
                          background: white; border: none; 
                          border-radius: 2px; text-align: center; line-height: 40px;
                          font-size: 18px; text-decoration: none; color: #555;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                          transition: all 0.3s ease;">
                    <span style="display: inline-block; transition: transform 0.3s ease;">📍</span>
                </a>
            `;
            
            const link = container.querySelector('a');
            
            // Prevenir eventos del mapa
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'click', L.DomEvent.stop);
            
            // Efecto hover
            link.addEventListener('mouseenter', function() {
                this.style.background = '#f8f9fa';
                this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
                this.querySelector('span').style.transform = 'scale(1.1)';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.background = 'white';
                this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                this.querySelector('span').style.transform = 'scale(1)';
            });
            
            // Evento click
            L.DomEvent.on(container, 'click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('📍 Buscando ubicación...');
                
                if (!navigator.geolocation) {
                    alert('Tu navegador no soporta geolocalización');
                    return;
                }
                
                // Mostrar loading con animación
                const originalHTML = link.innerHTML;
                link.innerHTML = `
                    <div style="
                        width: 20px; height: 20px; margin: 0 auto;
                        border: 2px solid #f3f3f3; border-top: 2px solid #4285f4;
                        border-radius: 50%; animation: spin 1s linear infinite;
                    "></div>
                `;
                link.style.background = '#f8f9fa';
                link.style.pointerEvents = 'none';
                
                navigator.geolocation.getCurrentPosition(
                    // Success
                    (position) => {
                        console.log('✅ Ubicación encontrada:', position.coords);
                        
                        const latlng = [
                            position.coords.latitude, 
                            position.coords.longitude
                        ];
                        
                        // Centrar mapa en la ubicación con animación suave
                        map.flyTo(latlng, 16, {
                            duration: 1.5,
                            easeLinearity: 0.25
                        });
                        
                        // Remover marcador anterior si existe
                        if (map._locationMarker) {
                            map.removeLayer(map._locationMarker);
                        }
                        
                        if (map._accuracyCircle) {
                            map.removeLayer(map._accuracyCircle);
                        }
                        
                        // CREAR MARCADOR ESTILO GOOGLE MAPS
                        map._locationMarker = L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'google-maps-marker',
                                html: `
                                    <div style="
                                        position: relative;
                                        width: 22px; height: 22px;
                                    ">
                                        <!-- Punto central -->
                                        <div style="
                                            position: absolute; top: 50%; left: 50%;
                                            transform: translate(-50%, -50%);
                                            width: 14px; height: 14px;
                                            background: #4285f4;
                                            border: 2px solid white;
                                            border-radius: 50%;
                                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                            z-index: 2;
                                        "></div>
                                        <!-- Anillo de pulso -->
                                        <div style="
                                            position: absolute; top: 50%; left: 50%;
                                            transform: translate(-50%, -50%);
                                            width: 22px; height: 22px;
                                            border: 2px solid #4285f4;
                                            border-radius: 50%;
                                            background: rgba(66, 133, 244, 0.2);
                                            animation: pulse-ring 2s infinite;
                                        "></div>
                                    </div>
                                `,
                                iconSize: [22, 22],
                                iconAnchor: [11, 11]
                            }),
                            zIndexOffset: 1000
                        }).addTo(map);
                        
                        // CÍRCULO DE PRECISIÓN estilo Google Maps
                        if (position.coords.accuracy) {
                            map._accuracyCircle = L.circle(latlng, {
                                radius: position.coords.accuracy,
                                color: '#4285f4',
                                fillColor: '#4285f4',
                                fillOpacity: 0.15,
                                weight: 1,
                                opacity: 0.6
                            }).addTo(map);
                        }
                        
                        // POPUP ESTILO GOOGLE MAPS
                        map._locationMarker.bindPopup(`
                            <div style="
                                min-width: 200px; font-family: 'Roboto', Arial, sans-serif;
                            ">
                                <div style="
                                    background: #4285f4; color: white; padding: 12px 16px;
                                    margin: -16px -16px 12px -16px; border-radius: 8px 8px 0 0;
                                    font-weight: 500; font-size: 14px;
                                ">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px;">📍</span>
                                        Tu ubicación actual
                                    </div>
                                </div>
                                
                                <div style="padding: 0 8px 12px 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                                        <span style="color: #4285f4; font-size: 14px;">📌</span>
                                        <div style="font-size: 12px;">
                                            <strong>Coordenadas:</strong><br>
                                            <span style="font-family: 'Courier New', monospace;">
                                                ${latlng[0].toFixed(6)}, ${latlng[1].toFixed(6)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    ${position.coords.accuracy ? `
                                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                                        <span style="color: #34a853; font-size: 14px;">🎯</span>
                                        <div style="font-size: 12px;">
                                            <strong>Precisión:</strong><br>
                                            <span>± ${Math.round(position.coords.accuracy)} metros</span>
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    <div style="margin-top: 12px; text-align: center;">
                                        <button onclick="this.closest('.leaflet-popup')._source.closePopup()" 
                                                style="
                                                    background: #f1f3f4; color: #3c4043; border: none;
                                                    padding: 8px 16px; border-radius: 4px; font-size: 12px;
                                                    cursor: pointer; font-weight: 500; transition: background 0.2s;
                                                "
                                                onmouseover="this.style.background='#e8eaed'"
                                                onmouseout="this.style.background='#f1f3f4'">
                                            
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).openPopup();
                        
                        // Restaurar botón después de un breve delay
                        setTimeout(() => {
                            link.innerHTML = originalHTML;
                            link.style.background = 'white';
                            link.style.pointerEvents = 'auto';
                            
                            // Agregar efecto de éxito
                            link.style.background = '#34a853';
                            link.style.color = 'white';
                            setTimeout(() => {
                                link.style.background = 'white';
                                link.style.color = '#555';
                            }, 1000);
                            
                        }, 500);
                    },
                    // Error
                    (error) => {
                        console.error('❌ Error de geolocalización:', error);
                        
                        let mensaje = 'No se pudo obtener la ubicación';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                mensaje = 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración de tu navegador.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                mensaje = 'Información de ubicación no disponible. Verifica tu conexión GPS.';
                                break;
                            case error.TIMEOUT:
                                mensaje = 'Tiempo de espera agotado. Intenta nuevamente.';
                                break;
                        }
                        
                        // Mostrar alerta estilo Google
                        const alertDiv = L.DomUtil.create('div', 'geolocation-alert');
                        alertDiv.innerHTML = `
                            <div style="
                                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                                background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                z-index: 10000; max-width: 300px; text-align: center; font-family: Arial, sans-serif;
                            ">
                                <div style="font-size: 48px; margin-bottom: 10px;">📍</div>
                                <h3 style="margin: 0 0 10px 0; color: #ea4335; font-size: 16px;">Ubicación no disponible</h3>
                                <p style="margin: 0 0 15px 0; color: #5f6368; font-size: 14px; line-height: 1.4;">
                                    ${mensaje}
                                </p>
                                <button onclick="this.parentElement.remove()" 
                                        style="
                                            background: #1a73e8; color: white; border: none;
                                            padding: 10px 20px; border-radius: 4px; cursor: pointer;
                                            font-size: 14px; font-weight: 500;
                                        ">
                                    Entendido
                                </button>
                            </div>
                        `;
                        document.body.appendChild(alertDiv);
                        
                        // Restaurar botón
                        link.innerHTML = originalHTML;
                        link.style.background = 'white';
                        link.style.pointerEvents = 'auto';
                        
                        // Efecto de error
                        link.style.background = '#ea4335';
                        link.style.color = 'white';
                        setTimeout(() => {
                            link.style.background = 'white';
                            link.style.color = '#555';
                        }, 1000);
                    },
                    // Opciones
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 30000
                    }
                );
            });
            
            return container;
        }
    });
    
    // Agregar control al mapa
    new LocateControl().addTo(this.map);
    console.log('✅ Control de geolocalización estilo Google Maps agregado');
},

    configurarEventos() {
        this.map.on('click', (e) => {
            this.seleccionarUbicacion(e.latlng);
        });

        // Mejorar la experiencia de hover en marcadores
        this.map.on('popupopen', (e) => {
            const marker = e.popup._source;
            if (marker) {
                marker.setZIndexOffset(1000);
            }
        });
    },

    seleccionarUbicacion(latlng) {
        const { lat, lng } = latlng;
        
        // Remover marcador anterior si existe
        if (this.markerNuevo) {
            this.map.removeLayer(this.markerNuevo);
        }
        
        // Crear nuevo marcador con estilo mejorado
        this.markerNuevo = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker marker-selected',
                html: `
                    <div style="
                        background: #e74c3c;
                        border: 3px solid white;
                        border-radius: 50%;
                        width: 45px;
                        height: 45px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        box-shadow: 0 3px 15px rgba(231, 76, 60, 0.4);
                        animation: pulse 1.5s infinite;
                    ">
                        🎯
                    </div>
                `,
                iconSize: [45, 45],
                iconAnchor: [22, 45],
                popupAnchor: [0, -45]
            }),
            zIndexOffset: 1000
        }).addTo(this.map);
        
        // Actualizar coordenadas en el formulario
        FormularioManager.actualizarCoordenadas(lat, lng);
        
        // Mostrar popup con las coordenadas mejorado
        this.markerNuevo.bindPopup(`
            <div style="text-align: center; padding: 10px; min-width: 200px;">
                <div style="font-size: 16px; font-weight: bold; color: #e74c3c; margin-bottom: 8px;">
                    📍 Ubicación Seleccionada
                </div>
                <div style="font-family: 'Courier New', monospace; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                    <strong>Lat:</strong> ${lat.toFixed(6)}<br>
                    <strong>Lng:</strong> ${lng.toFixed(6)}
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #666;">
                    Haz clic en "Registrar Reporte" para guardar
                </div>
            </div>
        `).openPopup();
    },

    // MÉTODO MEJORADO PARA CREAR ICONOS SEGÚN TIPO DE INCIDENTE
    getIconoPersonalizado(tipoIncidente, estado) {
        console.log('🎯 CREANDO ICONO PARA:', tipoIncidente);
        
        // Mapeo DIRECTO y EXPLÍCITO
        let emoji = '📍'; // Por defecto
        
        if (tipoIncidente === 'Accidente de tránsito') {
            emoji = '🚨';
        } else if (tipoIncidente === 'Hueco en la vía') {
            emoji = '🕳️';
        } else if (tipoIncidente === 'Inundación') {
            emoji = '🌊';
        } else if (tipoIncidente === 'Semáforo dañado') {
            emoji = '🚦';
        }
        
        console.log('✅ EMOJI ASIGNADO:', emoji);
        
        const coloresEstado = {
            'Pendiente': '#e74c3c',
            'En Proceso': '#f39c12',
            'Resuelto': '#27ae60',
            'Verificado': '#9b59b6'
        };

        const color = coloresEstado[estado] || '#3498db';

        // Crear el icono con el emoji
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
    },

    // POPUP MEJORADO
    crearPopupContent(reporte) {
        const fecha = new Date(reporte.fecha_reporte);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const coloresEstado = {
            'Pendiente': '#e74c3c',
            'En Proceso': '#f39c12',
            'Resuelto': '#27ae60',
            'Verificado': '#9b59b6'
        };

        const colorEstado = coloresEstado[reporte.estado] || '#3498db';

        return `
            <div style="min-width: 320px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <!-- Encabezado con gradiente -->
                <div style="
                    background: linear-gradient(135deg, ${colorEstado}, ${this.ajustarBrillo(colorEstado, -30)});
                    color: white;
                    padding: 15px;
                    margin: -16px -16px 15px -16px;
                    border-radius: 8px 8px 0 0;
                ">
                    <h4 style="margin: 0; font-size: 16px; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${this.getEmojiForType(reporte.tipo_incidente)}</span>
                        ${reporte.tipo_incidente}
                    </h4>
                </div>
                
                <!-- Contenido -->
                <div style="padding: 0 10px;">
                    <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5; color: #555;">
                        ${reporte.descripcion}
                    </p>
                    
                    <!-- Información detallada -->
                    <div style="font-size: 13px; color: #666; line-height: 1.6;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                            <span style="color: #3498db; font-size: 14px;">👤</span>
                            <div>
                                <strong>Reportado por:</strong><br>
                                <span style="color: #2c3e50;">${reporte.usuario}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                            <span style="color: #e74c3c; font-size: 14px;">📅</span>
                            <div>
                                <strong>Fecha:</strong><br>
                                <span style="color: #2c3e50;">${fechaFormateada}</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                            <span style="color: ${colorEstado}; font-size: 14px;">🏷️</span>
                            <div>
                                <strong>Estado:</strong><br>
                                <span style="
                                    background: ${colorEstado};
                                    color: white;
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    font-size: 12px;
                                    font-weight: bold;
                                ">${reporte.estado}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botón de acción -->
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                        <button onclick="ComentariosManager.abrirComentarios(${reporte.id_reporte})" 
                                style="
                                    background: linear-gradient(135deg, #3498db, #2980b9);
                                    color: white;
                                    border: none;
                                    padding: 12px 20px;
                                    border-radius: 8px;
                                    font-size: 14px;
                                    cursor: pointer;
                                    width: 100%;
                                    font-weight: bold;
                                    transition: all 0.3s ease;
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(52, 152, 219, 0.3)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            💬 Ver Comentarios
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // MÉTODOS AUXILIARES
    getEmojiForType(tipo) {
        console.log('🔍 BUSCANDO EMOJI PARA:', tipo);
        
        let emoji = '📍'; // Por defecto
        
        if (tipo === 'Accidente de tránsito') {
            emoji = '🚨';
        } else if (tipo === 'Hueco en la vía') {
            emoji = '🕳️';
        } else if (tipo === 'Inundación') {
            emoji = '🌊';
        } else if (tipo === 'Semáforo dañado') {
            emoji = '🚦';
        }
        
        console.log('✅ EMOJI ENCONTRADO:', emoji);
        return emoji;
    },

    ajustarBrillo(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },

    async cargarReportes() {
        try {
            this.markerCluster.clearLayers();
            this.markers = [];

            const resp = await fetch('../../controllers/reportecontrolador.php?action=listar');
            const data = await resp.json();

            console.log('📊 REPORTES CARGADOS:', data);
            
            data.forEach((r, index) => {
                console.log(`--- REPORTE ${index + 1} ---`);
                console.log('Tipo:', r.tipo_incidente);
                console.log('Estado:', r.estado);
                console.log('Coords:', r.latitud, r.longitud);
                
                const icono = this.getIconoPersonalizado(r.tipo_incidente, r.estado);
                const marker = L.marker([r.latitud, r.longitud], { icon: icono });
                
                marker.bindPopup(this.crearPopupContent(r));
                
                // Efectos interactivos
                marker.on('mouseover', function() {
                    this.openPopup();
                });
                
                this.markerCluster.addLayer(marker);
                this.markers.push(marker);
            });

            // Ajustar vista si hay marcadores
            if (this.markers.length > 0) {
                const group = new L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }

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