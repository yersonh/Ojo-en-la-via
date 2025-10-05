<?php
session_start();

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../../index.php");
    exit();
}
// Cargar tipos de incidente desde la base de datos
require_once __DIR__ . '/../../config/database.php';
$database = new Database();
$db = $database->conectar();

$query = "SELECT id_tipo_incidente, nombre FROM tipo_incidente ORDER BY nombre";
$stmt = $db->query($query);
$tipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ojo en la Vía - Reportes</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css" />

   <style>
        * { 
            box-sizing: border-box; 
            margin: 0;
            padding: 0;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        body {
            display: flex;
            height: 100vh;
            font-family: "Segoe UI", Arial, sans-serif;
            overflow: hidden;
        }

        /* 📍 MAPA */
        #map {
            flex: 2;
            height: 100vh !important;
            width: 100% !important;
            position: relative;
            z-index: 1;
        }

        /* 🧾 PANEL DERECHO */
        #panel {
            flex: 1;
            background: #ffffff;
            border-left: 2px solid #e0e0e0;
            padding: 25px;
            overflow-y: auto;
            box-shadow: -2px 0 8px rgba(0,0,0,0.05);
            min-width: 350px;
            height: 100vh;
            z-index: 2;
        }

        h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }

        label {
            display: block;
            font-weight: 600;
            margin-top: 15px;
            color: #333;
        }

        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            margin-top: 5px;
            font-size: 14px;
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        input:focus, select:focus, textarea:focus {
            border-color: #3498db;
            box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
            outline: none;
        }

        textarea { 
            resize: none; 
            min-height: 80px;
        }

        button {
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            border: none;
            border-radius: 6px;
            background-color: #007bff;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            font-size: 16px;
        }

        button:hover { 
            background-color: #0056b3; 
        }

        button:active {
            transform: translateY(1px);
        }

        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .preview {
            text-align: center;
            margin-top: 10px;
        }

        .preview img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: 2px solid #e0e0e0;
        }

        .coordenadas {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin-top: 5px;
            font-family: monospace;
            font-size: 12px;
            color: #495057;
        }

        /* 🎯 Estilos para marcadores personalizados */
        .custom-marker {
            background: transparent;
            border: none;
            font-size: 24px;
            text-align: center;
            filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));
        }

        .marker-selected {
            font-size: 28px;
            filter: drop-shadow(2px 2px 4px rgba(255,0,0,0.5));
        }

        /* 📱 Responsive */
        @media (max-width: 768px) {
            body { 
                flex-direction: column; 
                height: 100vh;
            }
            #map { 
                height: 60vh !important; 
                width: 100% !important;
                flex: none;
            }
            #panel {
                height: 40vh;
                overflow-y: auto;
                min-width: unset;
                flex: none;
            }
        }

        /* Loading spinner */
        .loading {
            display: none;
            text-align: center;
            margin: 10px 0;
        }

        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .alert {
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            display: none;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>

    <!-- 🌍 Mapa -->
    <div id="map"></div>

    <!-- 📋 Panel de formulario -->
    <div id="panel">
        <h2>Registrar Reporte</h2>

        <div id="alertSuccess" class="alert alert-success"></div>
        <div id="alertError" class="alert alert-error"></div>

        <form id="formReporte" enctype="multipart/form-data" method="POST">
            <label for="tipo">Tipo de incidente:</label>
            <select id="tipo" name="id_tipo_incidente" required>
                <option value="">Seleccione un tipo...</option>
                <?php foreach ($tipos as $t): ?>
                    <option value="<?= $t['id_tipo_incidente'] ?>"><?= htmlspecialchars($t['nombre']) ?></option>
                <?php endforeach; ?>
            </select>

            <label for="descripcion">Descripción:</label>
            <textarea id="descripcion" name="descripcion" rows="3" required></textarea>

            <label for="foto">📸 Fotografía (opcional):</label>
            <input type="file" id="foto" name="imagen" accept="image/*">
            <div class="preview">
                <img id="previewImg" src="" alt="" style="display: none;">
            </div>

            <label>🗺️ Seleccione ubicación en el mapa:</label>
            <small style="color:#777;">(Haga clic en el mapa para elegir las coordenadas)</small>

             <div class="coordenadas">
                Latitud: <span id="latDisplay">No seleccionada</span><br>
                Longitud: <span id="lngDisplay">No seleccionada</span>
            </div>

            <input type="hidden" id="latitud" name="latitud">
            <input type="hidden" id="longitud" name="longitud">
            <input type="hidden" id="id_usuario" name="id_usuario" value="<?php echo $_SESSION['usuario_id']; ?>">

            <div class="loading" id="loading">
                <div class="spinner"></div> Procesando...
            </div>

            <button type="submit" id="submitBtn">✅ Registrar Reporte</button>
        </form>
    </div>

    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>
    <script>
// Inicializar mapa centrado en Villavicencio
const map = L.map('map').setView([4.142, -73.626], 13);

// Cargar mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Variables globales
let markerCluster = L.markerClusterGroup();
let markers = [];
let markerNuevo = null;

// 🗺️ Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'success') {
    const alertSuccess = document.getElementById('alertSuccess');
    const alertError = document.getElementById('alertError');
    
    if (tipo === 'success') {
        alertSuccess.textContent = mensaje;
        alertSuccess.style.display = 'block';
        alertError.style.display = 'none';
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            alertSuccess.style.display = 'none';
        }, 5000);
    } else {
        alertError.textContent = mensaje;
        alertError.style.display = 'block';
        alertSuccess.style.display = 'none';
    }
}

// ✅ Función de validación del formulario
function validarFormulario() {
    const lat = document.getElementById('latitud').value;
    const lng = document.getElementById('longitud').value;
    const tipo = document.getElementById('tipo').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const foto = document.getElementById('foto').files[0];
    
    // Validar tipo de incidente
    if (!tipo) {
        mostrarAlerta('Seleccione un tipo de incidente', 'error');
        return false;
    }
    
    // Validar descripción
    if (!descripcion) {
        mostrarAlerta('Ingrese una descripción del incidente', 'error');
        return false;
    }
    
    if (descripcion.length < 10) {
        mostrarAlerta('La descripción debe tener al menos 10 caracteres', 'error');
        return false;
    }
    
    // Validar ubicación
    if (!lat || !lng) {
        mostrarAlerta('Debe seleccionar una ubicación en el mapa', 'error');
        return false;
    }
    
    return true;
}

// 📍 Cargar reportes existentes
async function cargarReportes() {
    try {
        // Limpiar marcadores anteriores
        markerCluster.clearLayers();
        markers = [];

        const resp = await fetch('../../controllers/reportecontrolador.php?action=listar');
        const data = await resp.json();
        
        data.forEach(r => {
            // Crear ícono personalizado
            const icono = L.divIcon({
                className: 'custom-marker',
                html: '📍',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            const marker = L.marker([r.latitud, r.longitud], { icon: icono });
            
            marker.bindPopup(`
                <div style="min-width: 250px;">
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${r.tipo_incidente}</h4>
                    <p style="margin: 0 0 8px 0; line-height: 1.4;">${r.descripcion}</p>
                    <div style="font-size: 12px; color: #666; line-height: 1.3;">
                        <strong>Reportado por:</strong> ${r.usuario}<br>
                        <strong>Fecha:</strong> ${new Date(r.fecha_reporte).toLocaleDateString()}<br>
                        <strong>Estado:</strong> <span style="color: ${r.estado === 'Activo' ? 'green' : 'orange'}; font-weight: bold;">${r.estado}</span>
                    </div>
                </div>
            `);
            
            markerCluster.addLayer(marker);
            markers.push(marker);
        });

        map.addLayer(markerCluster);
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        mostrarAlerta('Error al cargar reportes del servidor.', 'error');
    }
}

// Cargar reportes al iniciar
cargarReportes();

// 🗺️ Seleccionar coordenadas
map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    
    // Remover marcador anterior si existe
    if (markerNuevo) {
        map.removeLayer(markerNuevo);
    }
    
    // Crear nuevo marcador con estilo destacado
    markerNuevo = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker marker-selected',
            html: '🎯',
            iconSize: [35, 35],
            iconAnchor: [17, 35]
        })
    }).addTo(map);
    
    // Actualizar coordenadas en el formulario
    document.getElementById('latitud').value = lat;
    document.getElementById('longitud').value = lng;
    document.getElementById('latDisplay').textContent = lat.toFixed(6);
    document.getElementById('lngDisplay').textContent = lng.toFixed(6);
    
    // Mostrar popup con las coordenadas
    markerNuevo.bindPopup(`
        <div style="text-align: center;">
            <strong>Ubicación seleccionada</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
        </div>
    `).openPopup();
});

// 📸 Previsualizar imagen con validación de tamaño
document.getElementById('foto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        // Validar tamaño de archivo (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
            mostrarAlerta('La imagen no debe superar los 5MB', 'error');
            this.value = '';
            previewImg.style.display = 'none';
            previewImg.src = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            previewImg.src = ev.target.result;
            previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewImg.style.display = 'none';
        previewImg.src = '';
    }
});

// 🚀 Enviar formulario con imagen y datos
document.getElementById('formReporte').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validar formulario antes de enviar
    if (!validarFormulario()) {
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');

    // Mostrar loading
    submitBtn.disabled = true;
    loading.style.display = 'block';

    try {
        const resp = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
            method: 'POST',
            body: formData
        });

        const result = await resp.json();
        
        if (result.success) {
            mostrarAlerta('✅ ' + result.mensaje);
            
            // Limpiar formulario
            form.reset();
            document.getElementById('previewImg').style.display = 'none';
            document.getElementById('latDisplay').textContent = 'No seleccionada';
            document.getElementById('lngDisplay').textContent = 'No seleccionada';
            
            // Remover marcador temporal
            if (markerNuevo) {
                map.removeLayer(markerNuevo);
                markerNuevo = null;
            }
            
            // Recargar reportes en el mapa
            await cargarReportes();
            
        } else {
            mostrarAlerta('❌ ' + (result.mensaje || result.error || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('❌ Error de conexión: ' + error.message, 'error');
    } finally {
        // Ocultar loading
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});

// Debug: Verificar que el mapa se cargue correctamente
console.log('Mapa inicializado:', map);
 // Detectar y mostrar tamaño de pantalla (solo para debug)
    console.log('Ancho de pantalla:', window.innerWidth, 'Altura:', window.innerHeight);
</script>
</body>
</html>