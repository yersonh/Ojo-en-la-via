<?php
session_start();

if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] != 1) {
    header("Location: ../index.php");
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/admin_controlador.php';

$database = new Database();
$adminControlador = new AdminControlador($database);

// Obtener ID de usuario actual para notificaciones
$idUsuarioActual = $_SESSION['usuario_id'];

// Obtener notificaciones del usuario actual
$notificacionesNoLeidas = $adminControlador->contarNotificacionesNoLeidas($idUsuarioActual);
$notificaciones = $adminControlador->obtenerNotificacionesNoLeidas($idUsuarioActual, 5);

// Procesar acciones del administrador
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    switch ($_POST['action']) {
        case 'cambiar_estado_reporte':
            if (isset($_POST['id_reporte'], $_POST['nuevo_estado'])) {
                $adminControlador->cambiarEstadoReporte($_POST['id_reporte'], $_POST['nuevo_estado']);
            }
            break;
            
        case 'eliminar_reporte':
            if (isset($_POST['id_reporte'])) {
                $adminControlador->eliminarReporte($_POST['id_reporte']);
            }
            break;
            
        case 'cambiar_estado_usuario':
            if (isset($_POST['id_usuario'], $_POST['nuevo_estado'])) {
                $adminControlador->cambiarEstadoUsuario($_POST['id_usuario'], $_POST['nuevo_estado']);
            }
            break;
            
        case 'enviar_alerta_autoridad':
            if (isset($_POST['id_reporte'], $_POST['id_autoridad'])) {
                $emailPersonalizado = $_POST['email_personalizado'] ?? null;
                $adminControlador->enviarAlertaAutoridad($_POST['id_reporte'], $_POST['id_autoridad'], $emailPersonalizado);
            }
            break;

        case 'marcar_notificacion_leida':
            if (isset($_POST['id_notificacion'])) {
                $adminControlador->marcarNotificacionLeida($_POST['id_notificacion'], $idUsuarioActual);
                header('Content-Type: application/json');
                echo json_encode(['success' => true]);
                exit();
            }
            break;

        case 'marcar_todas_leidas':
            $adminControlador->marcarTodasLeidas($idUsuarioActual);
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
            exit();
            break;
    }
    
    
    header("Location: admin.php");
    exit();
}

// Obtener datos para las vistas
$estadisticas = $adminControlador->obtenerEstadisticas();
$reportes = $adminControlador->obtenerReportes(50);
$usuarios = $adminControlador->obtenerUsuarios();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Ojo en la Vía</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
    <link rel="stylesheet" href="styles/mapa.css">
    <link rel="stylesheet" href="styles/admin.css">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <?php include 'components/admin-sidebar.php'; ?>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <?php include 'components/admin-header.php'; ?>
            
            <!-- Contenido de las pestañas -->
            <div id="dashboard" class="tab-content active">
                <?php include 'components/admin-dashboard.php'; ?>
            </div>
            
            <div id="reportes" class="tab-content">
                <?php include 'components/admin-reportes.php'; ?>
            </div>
            
            <div id="usuarios" class="tab-content">
                <?php include 'components/admin-usuarios.php'; ?>
            </div>
            
            <div id="analytics" class="tab-content">
                <?php include 'components/admin-analytics.php'; ?>
            </div>
            
            <div id="configuracion" class="tab-content">
                <?php include 'components/admin-configuracion.php'; ?>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="components/admin-analytics.js"></script>
    <script src="components/admin.js"></script>
    <script src="components/admin-configuracion.js"></script>
    <script src="components/admin-notificaciones.js"></script>
    
    <!-- Modal de Alertas -->
    <?php include 'components/admin-alertas-modal.php'; ?>

    <script>
    <?php if (isset($reportes)): ?>
        
    <?php endif; ?>
    </script>
    
</body>
</html>