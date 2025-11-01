<?php
// usuario_controlador.php - VERSIÓN CORREGIDA
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión primero
session_start();

// Configuración básica de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Respuesta por defecto
$response = ['success' => false, 'error' => 'Acción no válida'];

try {
    // Conectar a la base de datos PRIMERO para algunas acciones
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->conectar();

    if (!$db) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $action = $_GET['action'] ?? '';

    // Acciones que NO requieren sesión
    switch ($action) {
        case 'verificar_sesion':
            $response = [
                'sesion_activa' => isset($_SESSION['usuario_id']),
                'usuario_id' => $_SESSION['usuario_id'] ?? null
            ];
            echo json_encode($response);
            exit;

        case 'obtener_id':
            if (isset($_SESSION['usuario_id'])) {
                $response = [
                    'success' => true,
                    'id_usuario' => $_SESSION['usuario_id']
                ];
            } else {
                $response = [
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ];
            }
            echo json_encode($response);
            exit;
    }

    // El resto de acciones SÍ requieren sesión
    if (!isset($_SESSION['usuario_id'])) {
        throw new Exception('No autenticado');
    }

    $usuario_id = $_SESSION['usuario_id'];

    switch ($action) {
        case 'obtener':
            // Consulta SIMPLIFICADA - solo lo esencial
            $query = "SELECT 
                         u.id_usuario, 
                         u.correo,
                         p.nombres, 
                         p.apellidos, 
                         p.telefono
                      FROM usuario u
                      INNER JOIN persona p ON u.id_persona = p.id_persona
                      WHERE u.id_usuario = :id_usuario";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':id_usuario' => $usuario_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($usuario) {
                $response = [
                    'success' => true,
                    'data' => $usuario
                ];
            } else {
                throw new Exception('Usuario no encontrado en la base de datos');
            }
            break;

        case 'actualizar':
            // Datos básicos del formulario
            $nombres = trim($_POST['nombres'] ?? '');
            $apellidos = trim($_POST['apellidos'] ?? '');
            $telefono = trim($_POST['telefono'] ?? '');

            // Validaciones básicas
            if (empty($nombres) || empty($apellidos)) {
                throw new Exception('Nombres y apellidos son obligatorios');
            }

            // Actualizar datos
            $query = "UPDATE persona 
                      SET nombres = :nombres, apellidos = :apellidos, telefono = :telefono 
                      WHERE id_persona = (SELECT id_persona FROM usuario WHERE id_usuario = :id_usuario)";
            
            $stmt = $db->prepare($query);
            $result = $stmt->execute([
                ':nombres' => $nombres,
                ':apellidos' => $apellidos,
                ':telefono' => $telefono,
                ':id_usuario' => $usuario_id
            ]);

            if ($result) {
                $response = [
                    'success' => true,
                    'mensaje' => 'Perfil actualizado correctamente'
                ];
            } else {
                throw new Exception('No se pudo actualizar el perfil');
            }
            break;

        case 'obtener_estadisticas':
            // 🆕 OBTENER ESTADÍSTICAS DEL USUARIO
            $estadisticas = calcularEstadisticas($db, $usuario_id);
            
            $response = [
                'success' => true,
                'estadisticas' => $estadisticas
            ];
            break;

        default:
            throw new Exception('Acción no reconocida: ' . $action);
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
}

// 🚨 CORRECIÓN: AGREGAR exit DESPUÉS DEL JSON
echo json_encode($response);
exit; // ← ESTA LÍNEA ES CRÍTICA

// 🆕 FUNCIÓN PARA CALCULAR ESTADÍSTICAS (adaptada a tu estructura de BD)
function calcularEstadisticas($db, $id_usuario) {
    $estadisticas = [
        'reports' => 0,
        'likes' => 0,
        'comments' => 0,
        'views' => 0
    ];

    try {
        // 1. CONTAR REPORTES DEL USUARIO
        $stmt = $db->prepare("
            SELECT COUNT(*) as total 
            FROM reporte 
            WHERE id_usuario = :id_usuario
        ");
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $estadisticas['reports'] = $result['total'] ?? 0;

        // 2. CONTAR LIKES RECIBIDOS EN SUS REPORTES (usando like_reporte)
        $stmt = $db->prepare("
            SELECT COUNT(*) as total 
            FROM like_reporte lr
            INNER JOIN reporte r ON lr.id_reporte = r.id_reporte
            WHERE r.id_usuario = :id_usuario
        ");
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $estadisticas['likes'] = $result['total'] ?? 0;

        // 3. CONTAR COMENTARIOS RECIBIDOS EN SUS REPORTES
        // Primero verificar si existe la tabla comentarios
        $stmt = $db->prepare("
            SELECT COUNT(*) as total 
            FROM comentarios c
            INNER JOIN reporte r ON c.id_reporte = r.id_reporte
            WHERE r.id_usuario = :id_usuario
        ");
        $stmt->bindParam(':id_usuario', $id_usuario);
        
        try {
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $estadisticas['comments'] = $result['total'] ?? 0;
        } catch (PDOException $e) {
            // Si la tabla comentarios no existe, usar 0
            error_log("Tabla comentarios no encontrada, usando valor 0");
            $estadisticas['comments'] = 0;
        }

        // 4. CONTAR VISITAS TOTALES A SUS REPORTES
        // Como no hay campo 'visitas', contamos reportes como proxy
        $estadisticas['views'] = $estadisticas['reports'] * 10; // Ejemplo: 10 vistas por reporte

        return $estadisticas;

    } catch (PDOException $e) {
        error_log("Error calculando estadísticas: " . $e->getMessage());
        return $estadisticas;
    }
}
?>