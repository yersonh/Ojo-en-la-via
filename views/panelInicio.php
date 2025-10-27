<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: ../index.php');
    exit();
}

// Determinar la URL base para el iframe
$baseUrl = 'http://' . $_SERVER['HTTP_HOST'];
if ($_SERVER['HTTP_HOST'] === 'localhost:8080') {
    $baseUrl = 'http://localhost:8080';
}
$mapUrl = $baseUrl . '/views/vermapa.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ojo en la Vía - Inicio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles/mapa.css">
    <link rel="stylesheet" href="styles/panel.css">
   
</head>
<body>
    <div class="app">
        <!-- Header mejorado -->
        <header class="app-header">
            <div class="logo">
                <i class="fas fa-eye"></i>
                <span>Ojo en la Vía</span>
            </div>
            <div class="user-menu">
                <img id="headerAvatar" class="user-avatar" src="/imagenes/fiveicon.png" alt="Avatar" 
                    onclick="document.querySelector('.nav-item[data-target=\"profileView\"]').click()">
            </div>
        </header>

        <!-- CAMBIO 1: Agregar clase with-visible-nav al main -->
        <div class="main with-visible-nav" id="mainContent">
            <!-- Estados de carga -->
            <div id="loadingState" class="loading" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Cargando...</p>
            </div>

            <!-- Inicio por defecto -->
            <div id="feedView">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Cargando publicaciones...</p>
                </div>
            </div>

            <!-- Notificaciones -->
            <div id="notificationsView" style="display:none;">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Cargando notificaciones...</p>
                </div>
            </div>

<!-- Mapa -->
<div id="mapView" style="display:none;">
    <iframe 
        src="<?php echo $mapUrl; ?>" 
        title="Mapa de reportes de Ojo en la Vía"
    ></iframe>
    <!-- Botón DENTRO del mapa -->
    <button class="map-floating-button" 
            onclick="window.open('<?php echo $mapUrl; ?>', '_blank')">
        <i class="fas fa-expand"></i>
    </button>
</div>
</div>

            <!-- Perfil -->
            <div id="profileView" style="display:none;">
                <div class="profile">
                    <div class="profile-header">
                        <div class="edit-pencil">
                            <img id="profileAvatar" class="avatar" src="/imagenes/fiveicon.png" alt="Avatar del usuario">
                            <div class="pencil" id="editAvatarBtn" title="Cambiar foto de perfil">
                                <i class="fas fa-camera"></i>
                            </div>
                        </div>
                        <div class="profile-info">
                            <h3 id="profileName">Cargando...</h3>
                            <p id="profileEmail"><i class="fas fa-envelope"></i> cargando...</p>
                            <p id="profilePhone"><i class="fas fa-phone"></i> Cargando...</p>
                            <p id="profileLocation"><i class="fas fa-map-marker-alt"></i> Cargando...</p>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4><i class="fas fa-user"></i> Biografía</h4>
                        <p id="profileBio" style="line-height: 1.6; color: var(--gray-600);">Sin biografía...</p>
                    </div>

                    <div class="profile-section">
                        <h4><i class="fas fa-edit"></i> Acciones</h4>
                        <div class="profile-actions">
                            <button id="btnEditProfile" class="btn btn-primary">
                                <i class="fas fa-edit"></i> Editar perfil
                            </button>
                            <button class="btn" onclick="cerrarSesion()">
                                <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                            </button>
                        </div>
                    </div>

                    <form id="profileForm" style="display:none;" class="profile-section">
                        <h4><i class="fas fa-cog"></i> Editar información</h4>
                        <input type="file" id="fotoPerfil" name="foto" accept="image/*" style="display: none;">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="inpNombres" style="display: block; margin-bottom: 4px; font-weight: 500;">Nombres</label>
                                <input type="text" name="nombres" id="inpNombres" placeholder="Tus nombres">
                            </div>
                            <div class="form-group">
                                <label for="inpApellidos" style="display: block; margin-bottom: 4px; font-weight: 500;">Apellidos</label>
                                <input type="text" name="apellidos" id="inpApellidos" placeholder="Tus apellidos">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="inpTelefono" style="display: block; margin-bottom: 4px; font-weight: 500;">Teléfono</label>
                                <input type="tel" name="telefono" id="inpTelefono" placeholder="Tu teléfono">
                            </div>
                            <div class="form-group">
                                <label for="inpUbicacion" style="display: block; margin-bottom: 4px; font-weight: 500;">Ubicación</label>
                                <input type="text" name="ubicacion" id="inpUbicacion" placeholder="Tu ubicación">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="inpBio" style="display: block; margin-bottom: 4px; font-weight: 500;">Biografía</label>
                            <textarea name="biografia" id="inpBio" placeholder="Cuéntanos sobre ti..." rows="3"></textarea>
                        </div>
                        
                        <div class="profile-actions">
                            <button type="button" id="btnSaveProfile" class="btn btn-primary">
                                <i class="fas fa-save"></i> Guardar cambios
                            </button>
                            <button type="button" id="btnCancelProfile" class="btn">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- CAMBIO 2: Agregar clase visible al bottom-nav -->
        <nav class="bottom-nav visible">
            <div class="nav-item active" data-target="feedView">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
            </div>
            <div class="nav-item" data-target="notificationsView">
                <i class="fas fa-bell"></i>
                <span>Alertas</span>
            </div>
            <div class="nav-item" data-target="mapView">
                <i class="fas fa-map"></i>
                <span>Mapa</span>
            </div>
            <div class="nav-item" data-target="profileView">
                <i class="fas fa-user"></i>
                <span>Perfil</span>
            </div>
        </nav>
        
        <!-- CAMBIO 3: La zona de activación se crea automáticamente con JavaScript -->
        <!-- No necesitas agregar nada aquí, el JavaScript la creará -->
    </div>

    <script>
        // Función para cerrar sesión
        function cerrarSesion() {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                window.location.href = '../logout.php';
            }
        }

        // Mejorar la experiencia en móviles
        document.addEventListener('touchstart', function() {}, { passive: true });

        // Variable global con la URL del mapa
        const mapUrl = '<?php echo $mapUrl; ?>';
    </script>

    <script src="components/panel.js"></script>
    <script type="module" src="components/mapa/index.js"></script>
    <script type="module" src="components/formulario/index.js"></script>
    <script src="components/comentarios.js"></script>
</body>
</html>