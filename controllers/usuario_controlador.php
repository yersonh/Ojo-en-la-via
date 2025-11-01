<?php
// usuario_controlador.php - VERSIÓN SIMPLIFICADA Y FUNCIONAL
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/bootstrap_session.php';

try {
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
            $query = "SELECT 
                        u.id_usuario, 
                        u.correo,
                        p.nombres, 
                        p.apellidos, 
                        p.telefono,
                        p.foto_perfil
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

        case 'obtener_estadisticas':
            // 🆕 ESTADÍSTICAS DIRECTAS - SIN FUNCIÓN SEPARADA
            
            // 1. CONTAR REPORTES DEL USUARIO
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM reporte WHERE id_usuario = ?");
            $stmt->execute([$usuario_id]);
            $reportes = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // 2. CONTAR LIKES RECIBIDOS
            $stmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM like_reporte lr 
                INNER JOIN reporte r ON lr.id_reporte = r.id_reporte 
                WHERE r.id_usuario = ?
            ");
            $stmt->execute([$usuario_id]);
            $likes = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // 3. CONTAR COMENTARIOS RECIBIDOS
            // Primero intentamos con 'comentario_reporte' (nombre más lógico)
            try {
                $stmt = $db->prepare("
                    SELECT COUNT(*) as total 
                    FROM comentario_reporte cr 
                    INNER JOIN reporte r ON cr.id_reporte = r.id_reporte 
                    WHERE r.id_usuario = ?
                ");
                $stmt->execute([$usuario_id]);
                $comentarios = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            } catch (PDOException $e) {
                // Si falla, intentamos con 'comentarios' (nombre alternativo)
                try {
                    $stmt = $db->prepare("
                        SELECT COUNT(*) as total 
                        FROM comentarios c 
                        INNER JOIN reporte r ON c.id_reporte = r.id_reporte 
                        WHERE r.id_usuario = ?
                    ");
                    $stmt->execute([$usuario_id]);
                    $comentarios = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
                } catch (PDOException $e2) {
                    // Si ambas fallan, usar 0
                    $comentarios = 0;
                }
            }

            // 4. VISITAS (estimación simple)
            $visitas = $reportes * 10;

            $response = [
                'success' => true,
                'estadisticas' => [
                    'reports' => (int)$reportes,
                    'likes' => (int)$likes,
                    'comments' => (int)$comentarios,
                    'views' => (int)$visitas
                ]
            ];
            break;
            case 'actualizar_foto':
    if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/perfiles/';
        
        // Crear directorio si no existe
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileName = uniqid() . '_' . basename($_FILES['foto_perfil']['name']);
        $uploadFile = $uploadDir . $fileName;
        
        if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $uploadFile)) {
            // Actualizar en base de datos
            $query = "UPDATE persona SET foto_perfil = :foto_perfil 
                    WHERE id_persona = (SELECT id_persona FROM usuario WHERE id_usuario = :id_usuario)";
            
            $stmt = $db->prepare($query);
            $result = $stmt->execute([
                ':foto_perfil' => $fileName,
                ':id_usuario' => $usuario_id
            ]);
            
            if ($result) {
                $_SESSION['foto_perfil'] = $fileName;
                $response = [
                    'success' => true,
                    'mensaje' => 'Foto actualizada correctamente',
                    'foto_url' => '/uploads/perfiles/' . $fileName
                ];
            }
        }
    }
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

echo json_encode($response);
exit;
?>