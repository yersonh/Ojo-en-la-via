<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';

try {
    $database = new Database();
    $db = $database->conectar();

    switch ($action) {
       case 'obtener':
    session_start();
    if (!isset($_SESSION['usuario_id'])) {
        echo json_encode(['error' => 'No autenticado']);
        exit();
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
        echo json_encode(['error' => 'Usuario no encontrado']);
    }
    break;


        case 'actualizar':
    session_start();
    if (!isset($_SESSION['usuario_id'])) {
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }

    $id = $_SESSION['usuario_id'];
    
    // Obtener id_persona del usuario
    $queryPersona = "SELECT id_persona FROM usuario WHERE id_usuario = :id";
    $stmtPersona = $db->prepare($queryPersona);
    $stmtPersona->execute([':id' => $id]);
    $usuario = $stmtPersona->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit();
    }
    
    $id_persona = $usuario['id_persona'];
    
    // Actualizar SOLO campos que existen
    $query = "UPDATE persona 
              SET nombres = :nombres, 
                  apellidos = :apellidos, 
                  telefono = :telefono 
              WHERE id_persona = :id_persona";
              
    $stmt = $db->prepare($query);
    $success = $stmt->execute([
        ':nombres' => $_POST['nombres'],
        ':apellidos' => $_POST['apellidos'], 
        ':telefono' => $_POST['telefono'],
        ':id_persona' => $id_persona
    ]);
    
    if ($success) {
        echo json_encode(['success' => true, 'mensaje' => 'Perfil actualizado correctamente']);
    } else {
        echo json_encode(['error' => 'Error al actualizar perfil']);
    }
    break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}