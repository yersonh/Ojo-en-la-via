<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';
session_start();
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['error' => 'No autenticado']);
    exit();
}

$user = $_SESSION['usuario_id'];

try {
    $database = new Database();
    $db = $database->conectar();

    switch ($action) {
        case 'listar':
            $q = "SELECT n.*, p.nombres AS origen_nombres, p.apellidos AS origen_apellidos FROM notificacion n LEFT JOIN usuario u ON n.id_usuario_origen = u.id_usuario LEFT JOIN persona p ON u.id_persona = p.id_persona WHERE n.id_usuario_destino = :u ORDER BY n.fecha DESC";
            $s = $db->prepare($q);
            $s->execute([':u' => $user]);
            $rows = $s->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($rows);
            break;

        case 'marcar_leida':
            $id = $_POST['id_notificacion'] ?? '';
            if (!$id) { echo json_encode(['success'=>false]); exit(); }
            $q = "UPDATE notificacion SET leida = TRUE WHERE id_notificacion = :id AND id_usuario_destino = :u";
            $s = $db->prepare($q);
            $s->execute([':id'=>$id, ':u'=>$user]);
            echo json_encode(['success'=>true]);
            break;

        case 'eliminar':
            $id = $_POST['id_notificacion'] ?? '';
            if (!$id) { echo json_encode(['success'=>false]); exit(); }
            $q = "DELETE FROM notificacion WHERE id_notificacion = :id AND id_usuario_destino = :u";
            $s = $db->prepare($q);
            $s->execute([':id'=>$id, ':u'=>$user]);
            echo json_encode(['success'=>true]);
            break;

        default:
            echo json_encode(['error'=>'Acción no válida']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}