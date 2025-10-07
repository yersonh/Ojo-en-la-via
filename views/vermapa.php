<?php
session_start();

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../../index.php");
    exit();
}
// Cargar tipos de incidente desde la base de datos
require_once __DIR__ . '/../config/database.php';
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
    
    <!-- Hojas de estilo externas -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        
        /* Contenedor principal */
        .app-container {
            display: flex;
            height: 100vh;
            position: relative;
        }
        
        /* 🌍 Mapa */
        #map {
            flex: 1;
            height: 100%;
            z-index: 1;
        }
        
        /* 📋 Panel de formulario */
        #panel {
            width: 400px;
            background: white;
            padding: 20px;
            overflow-y: auto;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            z-index: 2;
        }
        
        #panel h2 {
            margin-bottom: 20px;
            color: #333;
            font-size: 22px;
        }
        
        /* Formulario */
        #formReporte {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        label {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
            display: block;
        }
        
        select, textarea, input[type="text"], input[type="file"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .coordenadas {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
        }
        
        .preview {
            margin-top: 10px;
            text-align: center;
        }
        
        #previewImg {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        
        /* Alertas */
        .alert {
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 15px;
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
        
        /* Loading */
        .loading {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #ddd;
            border-top: 2px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Botones */
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 14px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #0056b3;
        }
        
        /* Sección de comentarios */
        .comentarios-section {
            margin-top: 25px;
            border-top: 2px solid #eee;
            padding-top: 20px;
        }
        
        .comentarios-section h3 {
            margin-bottom: 15px;
            color: #333;
        }
        
        .comentarios-list {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 15px;
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 10px;
        }
        
        .form-comentario {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        /* Botón móvil para alternar panel */
        .mobile-toggle {
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
        }
        
        /* Media Queries para Responsive */
        @media (max-width: 768px) {
            .app-container {
                flex-direction: column;
            }
            
            #map {
                height: 60vh;
                width: 100%;
            }
            
            #panel {
                width: 100%;
                height: 40vh;
                position: fixed;
                bottom: 0;
                left: 0;
                transform: translateY(calc(100% - 50px));
                transition: transform 0.3s ease;
                border-top-left-radius: 15px;
                border-top-right-radius: 15px;
                padding-top: 40px;
            }
            
            #panel.active {
                transform: translateY(0);
                height: 70vh;
            }
            
            .mobile-toggle {
                display: block;
            }
            
            #panel h2 {
                font-size: 20px;
                margin-bottom: 15px;
            }
            
            select, textarea, input[type="text"], input[type="file"] {
                padding: 14px;
                font-size: 16px; /* Previene zoom en iOS */
            }
            
            button {
                padding: 16px;
            }
            
            .comentarios-section {
                margin-top: 20px;
                padding-top: 15px;
            }
            
            .comentarios-list {
                max-height: 150px;
            }
        }
        
        @media (max-width: 480px) {
            #map {
                height: 55vh;
            }
            
            #panel {
                padding: 15px;
                padding-top: 40px;
            }
            
            #panel.active {
                height: 75vh;
            }
            
            #panel h2 {
                font-size: 18px;
            }
            
            .coordenadas {
                font-size: 12px;
                padding: 8px;
            }
            
            .comentarios-list {
                max-height: 120px;
            }
        }
        
        @media (max-width: 360px) {
            #panel {
                padding: 12px;
                padding-top: 40px;
            }
            
            #panel h2 {
                font-size: 16px;
            }
            
            select, textarea, input[type="text"], input[type="file"] {
                padding: 12px;
            }
            
            button {
                padding: 14px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <!-- Botón móvil para alternar panel -->
    <button class="mobile-toggle" id="panelToggle">📋 Formulario</button>
    
    <!-- Contenedor principal -->
    <div class="app-container">
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

            <!-- 📝 Sección de Comentarios -->
            <div id="comentariosSection" class="comentarios-section" style="display: none;">
                <h3>💬 Comentarios del Reporte</h3>
                
                <div class="comentarios-list" id="comentariosList">
                    <!-- Los comentarios se cargarán aquí -->
                </div>
                
                <form id="formComentario" class="form-comentario">
                    <input type="hidden" id="comentarioIdReporte" name="id_reporte">
                    <input type="hidden" name="id_usuario" value="<?php echo $_SESSION['usuario_id']; ?>">
                    
                    <textarea 
                        id="textoComentario" 
                        name="comentario" 
                        placeholder="Agrega un comentario..." 
                        required
                    ></textarea>
                    
                    <button type="submit" id="btnComentario">💬 Comentar</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts externos -->
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>
    
    <!-- Nuestros módulos JavaScript -->
    <script src="components/mapa.js"></script>
    <script src="components/formulario-reporte.js"></script>
    <script src="components/comentarios.js"></script>
    
    <!-- Script de inicialización -->
    <script>
        // Inicializar la aplicación cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar módulos
            MapaManager.inicializar();
            FormularioManager.inicializar();
            ComentariosManager.inicializar();
            
            // Cargar reportes iniciales
            MapaManager.cargarReportes();
            
            // Control del panel móvil
            const panelToggle = document.getElementById('panelToggle');
            const panel = document.getElementById('panel');
            
            panelToggle.addEventListener('click', function() {
                panel.classList.toggle('active');
                panelToggle.textContent = panel.classList.contains('active') ? '🗺️ Mapa' : '📋 Formulario';
            });
            
            // Cerrar panel al hacer clic fuera en móviles
            document.addEventListener('click', function(event) {
                if (window.innerWidth <= 768) {
                    const isClickInsidePanel = panel.contains(event.target);
                    const isClickOnToggle = panelToggle.contains(event.target);
                    
                    if (!isClickInsidePanel && !isClickOnToggle && panel.classList.contains('active')) {
                        panel.classList.remove('active');
                        panelToggle.textContent = '📋 Formulario';
                    }
                }
            });
        });
    </script>
</body>
</html>