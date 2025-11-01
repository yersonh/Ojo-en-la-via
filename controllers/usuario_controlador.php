<?php
// usuario_controlador.php - VERSIÓN CORREGIDA
header('Content-Type: application/json; charset=utf-8');
session_start();

// Configuración básica de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->conectar();

    if (!$db) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $action = $_GET['action'] ?? '';
    $usuario_id = $_SESSION['usuario_id'] ?? null;

    switch ($action) {
        case 'verificar_sesion':
            $response = [
                'sesion_activa' => isset($_SESSION['usuario_id']),
                'usuario_id' => $usuario_id
            ];
            break;

        case 'obtener_id':
            $response = [
                'success' => isset($_SESSION['usuario_id']),
                'id_usuario' => $usuario_id
            ];
            break;

        case 'obtener_estadisticas':
            if (!$usuario_id) {
                throw new Exception('No autenticado');
            }
            
            $estadisticas = calcularEstadisticas($db, $usuario_id);
            $response = [
                'success' => true,
                'estadisticas' => $estadisticas
            ];
            break;

        case 'obtener':
            if (!$usuario_id) {
                throw new Exception('No autenticado');
            }
            
            $query = "SELECT u.id_usuario, u.correo, p.nombres, p.apellidos, p.telefono
                      FROM usuario u
                      INNER JOIN persona p ON u.id_persona = p.id_persona
                      WHERE u.id_usuario = :id_usuario";
            
            $stmt = $db->prepare($query);
            $stmt->execute([':id_usuario' => $usuario_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($usuario) {
                $response = ['success' => true, 'data' => $usuario];
            } else {
                throw new Exception('Usuario no encontrado');
            }
            break;

        case 'actualizar':
            if (!$usuario_id) {
                throw new Exception('No autenticado');
            }
            
            $nombres = trim($_POST['nombres'] ?? '');
            $apellidos = trim($_POST['apellidos'] ?? '');
            $telefono = trim($_POST['telefono'] ?? '');

            if (empty($nombres) || empty($apellidos)) {
                throw new Exception('Nombres y apellidos son obligatorios');
            }

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

        default:
            throw new Exception('Acción no válida: ' . $action);
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
}

// SOLO UNA SALIDA JSON
echo json_encode($response);
exit;

// FUNCIÓN PARA CALCULAR ESTADÍSTICAS
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

        // 2. CONTAR LIKES RECIBIDOS EN SUS REPORTES
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
        // Verificar si existe la tabla comentarios
        try {
            $stmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM comentarios c
                INNER JOIN reporte r ON c.id_reporte = r.id_reporte
                WHERE r.id_usuario = :id_usuario
            ");
            $stmt->bindParam(':id_usuario', $id_usuario);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $estadisticas['comments'] = $result['total'] ?? 0;
        } catch (PDOException $e) {
            // Si no existe la tabla, usar 0
            $estadisticas['comments'] = 0;
        }

        // 4. VISITAS (estimación basada en reportes)
        $estadisticas['views'] = $estadisticas['reports'] * 10;

    } catch (PDOException $e) {
        error_log("Error calculando estadísticas: " . $e->getMessage());
    }

    return $estadisticas;
}
?>