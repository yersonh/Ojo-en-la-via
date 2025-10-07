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
    <link rel="stylesheet" href="styles/mapa.css">
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
        });
    </script>
</body>
</html>