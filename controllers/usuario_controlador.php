<?php
// LO PRIMERO EN EL ARCHIVO - Sin espacios/blancos antes!
ob_start();

// FORZAR HTTPS EN PRODUCCIÓN
if (empty($_SERVER['HTTPS']) && $_SERVER['HTTP_HOST'] !== 'localhost:8080' && $_SERVER['HTTP_HOST'] !== '127.0.0.1') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit();
}

// Configuración de errores para desarrollo
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión una sola vez al principio
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_GET['action'] ?? '';

try {
    require_once __DIR__ . '/../config/database.php';

    $database = new Database();
    $db = $database->conectar();

    if (!$db) {
        throw new Exception("No se pudo conectar a la base de datos");
    }

    // Configurar zona horaria para PostgreSQL
    $db->exec("SET timezone = 'America/Bogota'");

    switch ($action) {
        case 'obtener':
            if (!isset($_SESSION['usuario_id'])) {
                throw new Exception("No autenticado");
            }

            $id = $_SESSION['usuario_id'];
            
            // SOLO campos que existen en la BD
            $query = "SELECT 
                        u.id_usuario, 
                        u.correo, 
                        p.nombres, 
                        p.apellidos, 
                        p.telefono 
                      FROM usuario u 
                      JOIN persona p ON u.id_persona = p.id_persona 
                      WHERE u.id_usuario = :id";
                      
            $stmt = $db->prepare($query);
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo json_encode($user);
            } else {
                throw new Exception("Usuario no encontrado");
            }
            break;

        case 'actualizar':
            if (!isset($_SESSION['usuario_id'])) {
                throw new Exception("No autenticado");
            }

            $id = $_SESSION['usuario_id'];
            
            // Obtener id_persona del usuario
            $queryPersona = "SELECT id_persona FROM usuario WHERE id_usuario = :id";
            $stmtPersona = $db->prepare($queryPersona);
            $stmtPersona->execute([':id' => $id]);
            $usuario = $stmtPersona->fetch(PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                throw new Exception("Usuario no encontrado");
            }
            
            $id_persona = $usuario['id_persona'];
            
            // Validar datos requeridos
            $nombres = $_POST['nombres'] ?? '';
            $apellidos = $_POST['apellidos'] ?? '';
            $telefono = $_POST['telefono'] ?? '';
            
            if (empty($nombres) || empty($apellidos)) {
                throw new Exception("Nombres y apellidos son obligatorios");
            }
            
            // Actualizar SOLO campos que existen
            $query = "UPDATE persona 
                      SET nombres = :nombres, 
                          apellidos = :apellidos, 
                          telefono = :telefono 
                      WHERE id_persona = :id_persona";
                      
            $stmt = $db->prepare($query);
            $success = $stmt->execute([
                ':nombres' => $nombres,
                ':apellidos' => $apellidos, 
                ':telefono' => $telefono,
                ':id_persona' => $id_persona
            ]);
            
            if ($success) {
                echo json_encode([
                    'success' => true, 
                    'mensaje' => 'Perfil actualizado correctamente'
                ]);
            } else {
                throw new Exception("Error al actualizar perfil");
            }
            break;

        case 'obtener_estadisticas':
            if (!isset($_SESSION['usuario_id'])) {
                throw new Exception("Usuario no autenticado");
            }

            $id_usuario = $_SESSION['usuario_id'];
            
            error_log("📊 Calculando estadísticas para usuario: " . $id_usuario);

            // 1. Contar reportes del usuario
            $queryReportes = "SELECT COUNT(*) as total FROM reporte WHERE id_usuario = :id_usuario";
            $stmtReportes = $db->prepare($queryReportes);
            $stmtReportes->execute([':id_usuario' => $id_usuario]);
            $resultReportes = $stmtReportes->fetch(PDO::FETCH_ASSOC);
            $totalReportes = $resultReportes ? (int)$resultReportes['total'] : 0;

            // 2. Contar likes recibidos en los reportes del usuario
            $queryLikes = "
                SELECT COUNT(*) as total 
                FROM like_reporte lr
                INNER JOIN reporte r ON lr.id_reporte = r.id_reporte 
                WHERE r.id_usuario = :id_usuario
            ";
            $stmtLikes = $db->prepare($queryLikes);
            $stmtLikes->execute([':id_usuario' => $id_usuario]);
            $resultLikes = $stmtLikes->fetch(PDO::FETCH_ASSOC);
            $totalLikes = $resultLikes ? (int)$resultLikes['total'] : 0;

            // 3. Contar comentarios recibidos en los reportes del usuario
            $queryComentarios = "
                SELECT COUNT(*) as total 
                FROM comentario_reporte cr
                INNER JOIN reporte r ON cr.id_reporte = r.id_reporte 
                WHERE r.id_usuario = :id_usuario
            ";
            $stmtComentarios = $db->prepare($queryComentarios);
            $stmtComentarios->execute([':id_usuario' => $id_usuario]);
            $resultComentarios = $stmtComentarios->fetch(PDO::FETCH_ASSOC);
            $totalComentarios = $resultComentarios ? (int)$resultComentarios['total'] : 0;

            // 4. Calcular vistas estimadas (si no existe tabla de vistas)
            $totalVistas = $totalReportes * 10 + $totalLikes + $totalComentarios * 2;

            error_log("✅ Estadísticas calculadas - Reportes: $totalReportes, Likes: $totalLikes, Comentarios: $totalComentarios, Vistas: $totalVistas");

            echo json_encode([
                "success" => true,
                "estadisticas" => [
                    "reportes" => $totalReportes,
                    "likes" => $totalLikes,
                    "comentarios" => $totalComentarios,
                    "vistas" => $totalVistas
                ]
            ]);
            break;

        case 'obtener_id':
            // Endpoint para obtener el ID del usuario actual
            if (!isset($_SESSION['usuario_id'])) {
                throw new Exception("No autenticado");
            }
            
            echo json_encode([
                "success" => true,
                "id_usuario" => $_SESSION['usuario_id']
            ]);
            break;

        default:
            throw new Exception("Acción no válida: " . $action);
            break;
    }

} catch (Exception $e) {
    // Limpiar cualquier output accidental
    $unexpected_output = ob_get_contents();
    if (!empty($unexpected_output)) {
        error_log("⚠️ Output inesperado en usuario_controlador: " . $unexpected_output);
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Error interno del servidor',
        'mensaje' => $e->getMessage()
    ]);
    error_log("❌ Error en usuario_controlador: " . $e->getMessage());
}

ob_end_flush();
?>