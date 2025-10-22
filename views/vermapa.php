<?php
session_start();

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../../index.php");
    exit();
}
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
    
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css" />
    
    <link rel="stylesheet" href="styles/mapa.css">
    <link rel="stylesheet" href="styles/formulario.css">
</head>
<body>
    <!-- Botón móvil para alternar panel -->
    <button class="mobile-toggle" id="panelToggle">📋 Formulario</button>
    
    <!-- Contenedor principal -->
    <div class="app-container">
        <!-- Mapa -->
        <div id="map"></div>

        <!-- Panel de formulario -->
        <div id="panel">
            <h2>Registrar Reporte</h2>
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="🔍 Buscar dirección en Colombia..." autocomplete="off">
                    <button type="button" id="btnBuscar" class="btn-buscar">
                        Buscar
                    </button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>

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

                <!-- SECCIÓN DE IMAGEN MEJORADA CON CÁMARA -->
                <div class="campo-imagen">
                    <label for="foto">📸 Fotografía (opcional):</label>
                    
                    <!-- Contenedor de opciones de imagen -->
                    <div class="opciones-imagen">
                        <button type="button" id="btnTomarFoto" class="btn-camara">
                            📸 Tomar Foto
                        </button>
                        <button type="button" id="btnSeleccionarArchivo" class="btn-archivo">
                            📁 Seleccionar Archivo
                        </button>
                    </div>

                    <!-- Input de archivo oculto -->
                    <input type="file" id="foto" name="imagen[]" accept="image/*" capture="environment" multiple style="display: none;">
                    
                    <!-- Previsualización -->
                    <div class="preview">
                        <img id="previewImg" src="" alt="Vista previa" style="display: none;">
                        <div id="sinImagen" class="sin-imagen">
                            📷 No hay imagen seleccionada
                        </div>
                    </div>

                    <!-- Video para la cámara -->
                    <video id="videoCamara" autoplay playsinline style="display: none; width: 100%; border-radius: 8px;"></video>
                    
                    <!-- Controles de cámara -->
                    <div id="controlesCamara" class="controles-camara" style="display: none;">
                        <button type="button" id="btnCapturar" class="btn-capturar">
                            ✅ Capturar Foto
                        </button>
                        <button type="button" id="btnCancelarCamara" class="btn-cancelar">
                            ❌ Cancelar
                        </button>
                    </div>

                    <!-- Canvas oculto para capturar foto -->
                    <canvas id="canvasCaptura" style="display: none;"></canvas>
                </div>

                <label>🗺️ Seleccione ubicación en el mapa:</label>

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

                <button type="submit" id="submitBtn">Registrar Reporte</button>
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
<script src="components/offline-manager.js"></script>
<script src="components/background-sync-manager.js"></script>

<script type="module">
    import { mapaSistema } from './components/mapa/index.js';
    import { formularioSistema } from './components/formulario/index.js';
    
    // Hacer disponibles globalmente
    window.mapaSistema = mapaSistema;
    window.formularioSistema = formularioSistema;
    window.FormularioManager = formularioSistema;

    document.addEventListener('DOMContentLoaded', async function() {
        try {
            console.log('🚀 Inicializando aplicación con soporte offline...');
            
            // 1. Inicializar sistema de mapas
            await mapaSistema.inicializar();
            console.log('✅ Sistema de mapas inicializado');
            
            // 2. Inicializar sistema de formularios
            await formularioSistema.initialize();
            console.log('✅ Sistema de formularios inicializado');
            
            // 3. Inicializar otros módulos
            if (typeof ComentariosManager !== 'undefined') {
                ComentariosManager.inicializar();
                console.log('✅ ComentariosManager inicializado');
            }

            if (typeof BuscadorManager !== 'undefined') {
                BuscadorManager.inicializar(mapaSistema.getMap());
                console.log('✅ BuscadorManager inicializado');
            }
            
            // 4. Inicializar Background Sync Manager
            await backgroundSyncManager.initialize();
            console.log('✅ Background Sync Manager inicializado');
            
            // 5. Integrar Connection Manager con Offline Manager
            if (window.connectionManager) {
                window.connectionManager.addListener((online) => {
                    formularioSistema.handleConnectionChange(online);
                    
                    // Si se recupera conexión, sincronizar
                    if (online) {
                        setTimeout(() => {
                            backgroundSyncManager.sincronizarSilenciosamente();
                        }, 2000);
                    }
                });
            }

            console.log('🎉 Aplicación completamente inicializada con soporte offline');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            
            const alertError = document.getElementById('alertError');
            if (alertError) {
                alertError.textContent = 'Error al cargar la aplicación. Por favor, recarga la página.';
                alertError.style.display = 'block';
            }
        }
    });
</script>

    <!-- Scripts tradicionales (asegúrate de que sean compatibles) -->
    <script src="components/Buscador.js"></script>
    <script src="components/comentarios.js"></script>
    <script src="components/ConnectionManager.js"></script>

</body>
</html>