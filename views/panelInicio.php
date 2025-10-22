<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: ../index.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ojo en la Vía - Inicio</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles/mapa.css">
    <style>
        /* Reset y variables CSS */
        :root {
            --primary: #007bff;
            --primary-dark: #0056b3;
            --secondary: #6c757d;
            --success: #28a745;
            --danger: #dc3545;
            --warning: #ffc107;
            --light: #f8f9fa;
            --dark: #343a40;
            --white: #ffffff;
            --gray-100: #f8f9fa;
            --gray-200: #e9ecef;
            --gray-300: #dee2e6;
            --gray-600: #6c757d;
            --gray-800: #343a40;
            --shadow: 0 2px 10px rgba(0,0,0,0.1);
            --shadow-lg: 0 4px 20px rgba(0,0,0,0.15);
            --border-radius: 12px;
            --border-radius-sm: 8px;
            --transition: all 0.3s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body, html { 
            height: 100%; 
            margin: 0; 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            background: var(--gray-100);
            color: var(--gray-800);
        }

        .app { 
            display: flex; 
            flex-direction: column; 
            height: 100vh; 
            background: var(--gray-100);
        }

        /* Header mejorado */
        .app-header {
            background: var(--white);
            padding: 12px 16px;
            box-shadow: var(--shadow);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 1.2rem;
            color: var(--primary);
        }

        .logo i {
            font-size: 1.4rem;
        }

        .user-menu {
            position: relative;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid var(--gray-300);
            transition: var(--transition);
        }

        .user-avatar:hover {
            border-color: var(--primary);
        }

        /* Main content */
        .main { 
            flex: 1 1 auto; 
            overflow-y: auto; 
            padding: 16px;
            padding-bottom: 80px; /* Espacio para la navegación inferior */
        }

        /* Feed mejorado */
        .post { 
            background: var(--white); 
            border-radius: var(--border-radius); 
            padding: 16px; 
            margin-bottom: 16px; 
            box-shadow: var(--shadow);
            border: 1px solid var(--gray-200);
            transition: var(--transition);
        }

        .post:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }

        .post-header { 
            display: flex; 
            gap: 12px; 
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .avatar { 
            width: 48px; 
            height: 48px; 
            border-radius: 50%; 
            object-fit: cover; 
            background: var(--gray-200);
            flex-shrink: 0;
        }

        .user-info {
            flex: 1;
        }

        .user-name { 
            font-weight: 600; 
            color: var(--gray-800);
            margin-bottom: 2px;
        }

        .post-meta { 
            font-size: 13px; 
            color: var(--gray-600);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .post-meta i {
            font-size: 12px;
        }

        .post-desc { 
            margin: 12px 0; 
            font-size: 15px; 
            color: var(--gray-800);
            line-height: 1.5;
        }

        .post-img { 
            margin-top: 12px; 
            max-width: 100%; 
            border-radius: var(--border-radius-sm);
            box-shadow: var(--shadow);
        }

        .post-actions { 
            display: flex; 
            gap: 12px; 
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--gray-200);
        }

        .btn { 
            padding: 8px 16px; 
            border: none;
            background: var(--white);
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 6px;
            border: 1px solid var(--gray-300);
        }

        .btn:hover {
            background: var(--gray-100);
            transform: translateY(-1px);
        }

        .btn-primary {
            background: var(--primary);
            color: var(--white);
            border-color: var(--primary);
        }

        .btn-primary:hover {
            background: var(--primary-dark);
        }

        .btn-small { 
            padding: 6px 12px; 
            border: 1px solid var(--gray-300); 
            background: var(--white); 
            border-radius: 20px; 
            cursor: pointer;
            font-size: 13px;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .btn-small:hover {
            background: var(--gray-100);
            transform: translateY(-1px);
        }

        .btn-small.active {
            background: var(--primary);
            color: var(--white);
            border-color: var(--primary);
        }

        /* Bottom nav mejorada */
        .bottom-nav { 
            height: 70px; 
            display: flex; 
            align-items: center; 
            justify-content: space-around; 
            border-top: 1px solid var(--gray-300); 
            background: var(--white);
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding-bottom: env(safe-area-inset-bottom); /* Para iPhone */
        }

        .nav-item { 
            flex: 1; 
            text-align: center; 
            font-size: 12px; 
            color: var(--gray-600); 
            cursor: pointer; 
            padding: 8px 6px;
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .nav-item i {
            font-size: 20px;
            margin-bottom: 2px;
        }

        .nav-item.active { 
            color: var(--primary); 
            font-weight: 600;
        }

        .nav-item:hover {
            color: var(--primary);
        }

        /* Perfil mejorado */
        .profile { 
            max-width: 600px; 
            margin: 0 auto; 
        }

        .profile-header { 
            display: flex; 
            gap: 16px; 
            align-items: center; 
            padding: 20px; 
            background: var(--white); 
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin-bottom: 16px;
        }

        .profile-header .avatar { 
            width: 100px; 
            height: 100px; 
        }

        .edit-pencil { 
            position: relative; 
            display: inline-block; 
        }

        .edit-pencil .pencil { 
            position: absolute; 
            right: 4px; 
            bottom: 4px; 
            background: var(--primary); 
            color: var(--white); 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition);
            border: 2px solid var(--white);
        }

        .edit-pencil .pencil:hover {
            background: var(--primary-dark);
            transform: scale(1.1);
        }

        .profile-info h3 {
            margin-bottom: 4px;
            color: var(--gray-800);
        }

        .profile-info p {
            color: var(--gray-600);
            margin-bottom: 4px;
            font-size: 14px;
        }

        .profile-section {
            background: var(--white);
            padding: 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin-bottom: 16px;
        }

        .profile-section h4 {
            margin-bottom: 12px;
            color: var(--gray-800);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .profile-section h4 i {
            color: var(--primary);
        }

        .form-row { 
            display: flex; 
            gap: 12px; 
            margin-top: 12px;
            flex-wrap: wrap;
        }

        .form-group {
            flex: 1;
            min-width: 200px;
        }

        .form-row input, 
        .form-row textarea { 
            width: 100%; 
            padding: 12px; 
            border-radius: var(--border-radius-sm); 
            border: 1px solid var(--gray-300);
            font-size: 14px;
            transition: var(--transition);
        }

        .form-row input:focus, 
        .form-row textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }

        .profile-actions { 
            display: flex; 
            gap: 12px; 
            margin-top: 16px;
            flex-wrap: wrap;
        }

        /* Notificaciones mejoradas */
        .notification { 
            background: var(--white); 
            padding: 16px; 
            border-radius: var(--border-radius); 
            margin-bottom: 12px;
            box-shadow: var(--shadow);
            border-left: 4px solid var(--primary);
            transition: var(--transition);
        }

        .notification:hover {
            transform: translateX(4px);
        }

        .notification.unread {
            border-left-color: var(--warning);
            background: #fffbf0;
        }

        .notification.important {
            border-left-color: var(--danger);
        }

        /* Estados de carga */
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--gray-600);
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--gray-300);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Mapa view */
        .map-container {
            background: var(--white);
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
        }

        .map-container iframe {
            width: 100%;
            height: 60vh;
            border: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .main {
                padding: 12px;
                padding-bottom: 80px;
            }

            .profile-header {
                flex-direction: column;
                text-align: center;
            }

            .form-row {
                flex-direction: column;
                gap: 8px;
            }

            .form-group {
                min-width: 100%;
            }

            .post-header {
                gap: 10px;
            }

            .avatar {
                width: 42px;
                height: 42px;
            }
        }

        @media (min-width: 900px) {
            .main { 
                max-width: 900px; 
                margin: 0 auto; 
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            :root {
                --gray-100: #1a1a1a;
                --gray-200: #2d2d2d;
                --gray-300: #404040;
                --gray-600: #8a8a8a;
                --gray-800: #e0e0e0;
                --white: #2d2d2d;
            }

            body {
                background: #121212;
                color: var(--gray-800);
            }
        }

        /* Mejoras de accesibilidad */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        /* Scroll personalizado */
        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: var(--gray-100);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--gray-300);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--gray-600);
        }
    </style>
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

        <div class="main" id="mainContent">
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
                <div class="map-container">
                    <iframe src="vermapa.php" title="Mapa de reportes"></iframe>
                </div>
                <div style="text-align: center; margin-top: 16px;">
                    <button class="btn btn-primary" onclick="window.open('vermapa.php', '_blank')">
                        <i class="fas fa-expand"></i> Abrir mapa en pantalla completa
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

        <!-- Bottom Navigation mejorada -->
        <nav class="bottom-nav">
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
    </script>

    <script src="components/panel.js"></script>
    <script type="module" src="components/mapa/index.js"></script>
    <script type="module" src="components/formulario/index.js"></script>
    <script src="components/comentarios.js"></script>
</body>
</html>