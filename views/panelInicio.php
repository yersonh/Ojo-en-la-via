<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: ../index.php');
    exit();
}

// Determinar la URL base para el iframe - ACTUALIZADO A HTTPS
$baseUrl = 'https://' . $_SERVER['HTTP_HOST'];
if ($_SERVER['HTTP_HOST'] === 'localhost:8080') {
    // Para desarrollo local, mantener HTTP si no tienes SSL configurado
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
    
    <!-- Forzar HTTPS en producción -->
    <?php if ($_SERVER['HTTP_HOST'] !== 'localhost:8080'): ?>
    <script>
        if (location.protocol !== 'https:') {
            location.replace(`https:${location.href.substring(location.protocol.length)}`);
        }
    </script>
    <?php endif; ?>
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

        <!-- CONTENEDOR PRINCIPAL -->
        <div class="main with-visible-nav" id="mainContent">
            <!-- Estados de carga -->
            <div id="loadingState" class="loading" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Cargando...</p>
            </div>

            <!-- FEED DE INICIO - ESTRUCTURA CORREGIDA -->
            <div id="feedView">
                <div class="feed-container">
                    <div class="posts-grid">
                        <!-- EJEMPLO DE POST 1 -->
                        <div class="post">
                            <div class="post-header">
                                <img class="avatar" src="/imagenes/user-avatar.jpg" alt="Maria García">
                                <div class="user-info">
                                    <div class="user-name">Maria García</div>
                                    <div class="post-meta">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>Corito, Ciudad</span>
                                        <i class="fas fa-clock"></i>
                                        <span>Hace 2 horas</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="post-desc">
                                Bache grande en la calle principal que necesita reparación urgente. Es peligroso para vehículos y peatones.
                            </div>
                            
                            <div class="post-actions">
                                <button class="btn-small">
                                    <i class="fas fa-heart"></i>
                                    <span>Me gusta</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-comment"></i>
                                    <span>Comentar</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-share"></i>
                                    <span>Compartir</span>
                                </button>
                            </div>
                        </div>

                        <!-- EJEMPLO DE POST 2 -->
                        <div class="post">
                            <div class="post-header">
                                <img class="avatar" src="/imagenes/user-avatar2.jpg" alt="Carlos Rodríguez">
                                <div class="user-info">
                                    <div class="user-name">Carlos Rodríguez</div>
                                    <div class="post-meta">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>Centro, Ciudad</span>
                                        <i class="fas fa-clock"></i>
                                        <span>Hace 4 horas</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="post-desc">
                                Semáforo dañado en la intersección de la Avenida Principal con Calle 5. Genera mucho tráfico y riesgo de accidentes.
                            </div>
                            
                            <div class="post-actions">
                                <button class="btn-small">
                                    <i class="fas fa-heart"></i>
                                    <span>Me gusta</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-comment"></i>
                                    <span>Comentar</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-share"></i>
                                    <span>Compartir</span>
                                </button>
                            </div>
                        </div>

                        <!-- EJEMPLO DE POST 3 -->
                        <div class="post">
                            <div class="post-header">
                                <img class="avatar" src="/imagenes/user-avatar3.jpg" alt="Ana Martínez">
                                <div class="user-info">
                                    <div class="user-name">Ana Martínez</div>
                                    <div class="post-meta">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>Zona Norte, Ciudad</span>
                                        <i class="fas fa-clock"></i>
                                        <span>Hace 1 día</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="post-desc">
                                Alumbrado público defectuoso en el parque central. La zona está muy oscura por las noches, representa un riesgo para la seguridad.
                            </div>
                            
                            <div class="post-actions">
                                <button class="btn-small">
                                    <i class="fas fa-heart"></i>
                                    <span>Me gusta</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-comment"></i>
                                    <span>Comentar</span>
                                </button>
                                <button class="btn-small">
                                    <i class="fas fa-share"></i>
                                    <span>Compartir</span>
                                </button>
                            </div>
                        </div>

                        <!-- Más posts se cargarán aquí dinámicamente -->
                    </div>
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

            <!-- Perfil - DENTRO del mainContent -->
            <div id="profileView" style="display:none;">
                <div class="profile-container">
                    <!-- Header Hero -->
                    <div class="profile-hero">
                        <div class="profile-hero-content">
                            <div class="profile-avatar-container">
                                <img id="profileAvatar" class="profile-main-avatar" src="/imagenes/fiveicon.png" alt="Avatar del usuario">
                                <div class="avatar-edit-btn" id="editAvatarBtn" title="Cambiar foto de perfil">
                                    <i class="fas fa-camera"></i>
                                </div>
                            </div>
                            <div class="profile-hero-info">
                                <h1 id="profileName">Cargando...</h1>
                                <div class="profile-hero-stats">
                                    <div class="hero-stat">
                                        <i class="fas fa-envelope"></i>
                                        <span id="profileEmail">cargando...</span>
                                    </div>
                                    <div class="hero-stat">
                                        <i class="fas fa-phone"></i>
                                        <span id="profilePhone">Cargando...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-content">
                        <!-- Columna Principal -->
                        <div class="profile-main">
                            <!-- Información Personal -->
                            <div class="profile-card">
                                <div class="profile-card-header">
                                    <h3><i class="fas fa-user"></i> Información Personal</h3>
                                </div>
                                <div class="contact-info">
                                    <div class="contact-item">
                                        <div class="contact-icon">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div class="contact-details">
                                            <div class="contact-label">Nombres</div>
                                            <div class="contact-value" id="profileNames">cargando...</div>
                                        </div>
                                    </div>
                                    <div class="contact-item">
                                        <div class="contact-icon">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div class="contact-details">
                                            <div class="contact-label">Apellidos</div>
                                            <div class="contact-value" id="profileLastnames">cargando...</div>
                                        </div>
                                    </div>
                                    <div class="contact-item">
                                        <div class="contact-icon">
                                            <i class="fas fa-envelope"></i>
                                        </div>
                                        <div class="contact-details">
                                            <div class="contact-label">Correo Electrónico</div>
                                            <div class="contact-value" id="profileEmailCard">cargando...</div>
                                        </div>
                                    </div>
                                    <div class="contact-item">
                                        <div class="contact-icon">
                                            <i class="fas fa-phone"></i>
                                        </div>
                                        <div class="contact-details">
                                            <div class="contact-label">Teléfono</div>
                                            <div class="contact-value" id="profilePhoneCard">cargando...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Formulario de Edición (oculto inicialmente) -->
                            <form id="profileForm" style="display:none;" class="profile-card edit-form">
                                <div class="profile-card-header">
                                    <h3><i class="fas fa-edit"></i> Editar Perfil</h3>
                                </div>
                                <input type="file" id="fotoPerfil" name="foto" accept="image/*" style="display: none;">
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="inpNombres" class="form-label">Nombres</label>
                                        <input type="text" name="nombres" id="inpNombres" class="form-input" placeholder="Tus nombres">
                                    </div>
                                    <div class="form-group">
                                        <label for="inpApellidos" class="form-label">Apellidos</label>
                                        <input type="text" name="apellidos" id="inpApellidos" class="form-input" placeholder="Tus apellidos">
                                    </div>
                                    <div class="form-group">
                                        <label for="inpTelefono" class="form-label">Teléfono</label>
                                        <input type="tel" name="telefono" id="inpTelefono" class="form-input" placeholder="Tu teléfono">
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="button" id="btnSaveProfile" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Guardar Cambios
                                    </button>
                                    <button type="button" id="btnCancelProfile" class="btn">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Sidebar -->
                        <div class="profile-sidebar">
                            <!-- Estadísticas -->
                            <div class="profile-card">
                                <div class="profile-card-header">
                                    <h3><i class="fas fa-chart-bar"></i> Estadísticas</h3>
                                </div>
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i class="fas fa-flag"></i>
                                        </div>
                                        <div class="stat-number" id="statReports">0</div>
                                        <div class="stat-label">Reportes</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i class="fas fa-heart"></i>
                                        </div>
                                        <div class="stat-number" id="statLikes">0</div>
                                        <div class="stat-label">Likes</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i class="fas fa-comments"></i>
                                        </div>
                                        <div class="stat-number" id="statComments">0</div>
                                        <div class="stat-label">Comentarios</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i class="fas fa-eye"></i>
                                        </div>
                                        <div class="stat-number" id="statViews">0</div>
                                        <div class="stat-label">Visitas</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Acciones Rápidas -->
                            <div class="profile-card">
                                <div class="profile-card-header">
                                    <h3><i class="fas fa-bolt"></i> Acciones Rápidas</h3>
                                </div>
                                <div class="quick-actions">
                                    <button class="quick-action-btn" id="btnEditProfile">
                                        <div class="quick-action-icon">
                                            <i class="fas fa-edit"></i>
                                        </div>
                                        <div class="quick-action-text">
                                            <div class="quick-action-title">Editar Perfil</div>
                                            <div class="quick-action-desc">Actualiza tu información personal</div>
                                        </div>
                                    </button>
                                    <button class="quick-action-btn" onclick="cerrarSesion()">
                                        <div class="quick-action-icon">
                                            <i class="fas fa-sign-out-alt"></i>
                                        </div>
                                        <div class="quick-action-text">
                                            <div class="quick-action-title">Cerrar Sesión</div>
                                            <div class="quick-action-desc">Salir de tu cuenta</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- FIN del profileView -->
            
        </div>
        <!-- FIN del mainContent -->

        <!-- Navegación inferior -->
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

        // Navegación entre vistas
        document.addEventListener('DOMContentLoaded', function() {
            const navItems = document.querySelectorAll('.nav-item');
            const views = document.querySelectorAll('#feedView, #notificationsView, #mapView, #profileView');
            
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    const target = this.getAttribute('data-target');
                    
                    // Remover clase active de todos los items
                    navItems.forEach(nav => nav.classList.remove('active'));
                    // Agregar clase active al item clickeado
                    this.classList.add('active');
                    
                    // Ocultar todas las vistas
                    views.forEach(view => view.style.display = 'none');
                    
                    // Mostrar la vista objetivo
                    const targetView = document.getElementById(target);
                    if (targetView) {
                        targetView.style.display = 'block';
                    }
                });
            });

            // Mostrar feedView por defecto
            document.getElementById('feedView').style.display = 'block';
        });
    </script>

    <script src="components/panel.js"></script>
    <script type="module" src="components/mapa/index.js"></script>
    <script type="module" src="components/formulario/index.js"></script>
    <script src="components/comentarios.js"></script>
</body>
</html>