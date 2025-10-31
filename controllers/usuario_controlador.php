<?php
// usuario_controlador.php - VERSIÓN SIMPLIFICADA
header('Content-Type: application/json; charset=utf-8');

// Iniciar sesión primero
session_start();

// Configuración básica de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Respuesta por defecto
$response = ['success' => false, 'error' => 'Acción no válida'];

try {
    // Verificar sesión
    if (!isset($_SESSION['usuario_id'])) {
        throw new Exception('No autenticado');
    }

    $usuario_id = $_SESSION['usuario_id'];
    $action = $_GET['action'] ?? '';

    // Conectar a la base de datos
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->conectar();

    if (!$db) {
        throw new Exception('Error de conexión a la base de datos');
    }

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

        default:
            throw new Exception('Acción no reconocida: ' . $action);
    }

} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage()
    ];
}

// Enviar respuesta FINAL
echo json_encode($response);
?>