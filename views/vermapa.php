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
    <link rel="shortcut icon" href="/imagenes/fiveicon.png" type="image/png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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

<!-- Scripts tradicionales -->
<script src="components/ConnectionManager.js"></script>
<script src="components/background-sync-manager.js"></script>
<script src="components/Buscador.js"></script>
<script src="components/comentarios.js"></script>

<!-- Módulos ES6 principales -->
<script type="module">
    import { mapaSistema } from './components/mapa/index.js';
    import { formularioSistema } from './components/formulario/index.js';
    
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
            
            // 4. Integrar Connection Manager
            if (window.connectionManager) {
                window.connectionManager.addListener((online) => {
                    formularioSistema.handleConnectionChange(online);
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

<!-- 🔧 SOLUCIÓN MÍNIMA PARA IMÁGENES HTTPS SOLO EN PRODUCCIÓN -->
<script>
// SOLO corregir imágenes en producción (Railway)
function esProduccion() {
    return window.location.hostname.includes('railway.app') || 
           window.location.hostname.includes('ojo-en-la-via');
}

function corregirImagenesSoloProduccion() {
    // Solo ejecutar en producción
    if (!esProduccion()) {
        console.log('🔧 Modo desarrollo: imágenes sin cambios');
        return;
    }
    
    console.log('🔧 Corrigiendo imágenes a HTTPS en producción...');
    
    // Corregir imágenes existentes
    document.querySelectorAll('img').forEach(img => {
        const srcOriginal = img.src;
        if (srcOriginal.startsWith('http://')) {
            img.src = srcOriginal.replace('http://', 'https://');
            console.log('✅ Imagen corregida en producción:', srcOriginal, '→', img.src);
        }
    });
    
    // Observar cambios futuros solo en producción
    if (esProduccion()) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'IMG' && node.src.startsWith('http://')) {
                            node.src = node.src.replace('http://', 'https://');
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('img').forEach(img => {
                                if (img.src.startsWith('http://')) {
                                    img.src = img.src.replace('http://', 'https://');
                                }
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Leaflet se inicialice
    setTimeout(() => {
        corregirImagenesSoloProduccion();
    }, 1000);
});

// También corregir cuando se cargan reportes en producción
if (window.mapaSistema && esProduccion()) {
    const originalRecargarReportes = window.mapaSistema.recargarReportes;
    if (originalRecargarReportes) {
        window.mapaSistema.recargarReportes = async function() {
            await originalRecargarReportes.call(this);
            setTimeout(corregirImagenesSoloProduccion, 500);
        };
    }
}
</script>

<!-- 🚀 SISTEMA DE ACTUALIZACIÓN DEL SERVICE WORKER -->
<script>
class SWManager {
    static async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('🔍 Monitoreando actualizaciones del SW...');
                
                // Verificar actualizaciones periódicamente
                setInterval(() => {
                    registration.update();
                }, 5 * 60 * 1000); // Cada 5 minutos
                
                // Detectar cuando hay nueva versión
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Nueva versión del Service Worker disponible');
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.log('⚠️ No se pudo monitorear actualizaciones:', error);
            }
        }
    }
    
    static showUpdateNotification() {
        // Notificación discreta - No modal intrusivo
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #3b82f6;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-family: Arial;
                font-size: 14px;
                max-width: 300px;
            ">
                <strong>🔄 Actualización disponible</strong>
                <p style="margin: 5px 0; font-size: 12px;">La aplicación se ha actualizado</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #3b82f6;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-right: 5px;
                ">Actualizar</button>
                <button onclick="this.parentElement.remove()" style="
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-ocultar después de 30 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }
}

// 🛠️ COMANDOS DEBUG - Para forzar actualización cuando hay problemas
window.forceSWUpdate = async function() {
    if ('serviceWorker' in navigator) {
        console.log('🔄 Forzando actualización del Service Worker...');
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (let registration of registrations) {
            await registration.unregister();
            console.log('🗑️ SW eliminado:', registration.scope);
        }
        
        console.log('✅ Todos los SW eliminados. Recargando...');
        // Limpiar caches también
        if (window.caches) {
            const cacheNames = await window.caches.keys();
            await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        }
        
        setTimeout(() => {
            location.reload(true); // Forzar recarga sin cache
        }, 1000);
    } else {
        console.log('❌ Service Worker no soportado');
    }
};

// Comando alternativo para recarga forzada
window.hardReload = function() {
    console.log('🔄 Recarga forzada sin cache...');
    location.reload(true);
};

// Inicializar el sistema de actualización cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    SWManager.init();
});
</script>

</body>
</html>