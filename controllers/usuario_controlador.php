<?php
header('Content-Type: application/json; charset=utf-8');
require_once _DIR_ . '/../config/database.php';

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
            $query = "SELECT u.id_usuario, u.correo, p.nombres, p.apellidos, p.telefono, p.biografia, p.foto_perfil, p.ubicacion FROM usuario u JOIN persona p ON u.id_persona = p.id_persona WHERE u.id_usuario = :id";
            $stmt = $db->prepare($query);
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($user ?: []);
            break;

        case 'actualizar':
            session_start();
            if (!isset($_SESSION['usuario_id'])) {
                echo json_encode(['success' => false, 'mensaje' => 'No autenticado']);
                exit();
            }

            $id = $_SESSION['usuario_id'];

            // Permitimos multipart/form-data para foto
            $nombres = $_POST['nombres'] ?? '';
            $apellidos = $_POST['apellidos'] ?? '';
            $telefono = $_POST['telefono'] ?? '';
            $ubicacion = $_POST['ubicacion'] ?? '';
            $biografia = $_POST['biografia'] ?? '';

            // Actualizar persona
            $query = "UPDATE persona SET nombres = :nombres, apellidos = :apellidos, telefono = :telefono, ubicacion = :ubicacion, biografia = :biografia WHERE id_persona = (SELECT id_persona FROM usuario WHERE id_usuario = :id)";
            $stmt = $db->prepare($query);
            $stmt->execute([
                ':nombres' => $nombres,
                ':apellidos' => $apellidos,
                ':telefono' => $telefono,
                ':ubicacion' => $ubicacion,
                ':biografia' => $biografia,
                ':id' => $id
            ]);

            // Manejo de foto de perfil si viene
            if (!empty($_FILES['foto']['name']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
                $directorio = $_SERVER['DOCUMENT_ROOT'] . '/../imagenes/usuarios/';
                if (!is_dir($directorio)) mkdir($directorio, 0755, true);

                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime_type = finfo_file($finfo, $_FILES['foto']['tmp_name']);
                finfo_close($finfo);
                $allowed = ['image/jpeg','image/png','image/webp','image/gif'];
                if (in_array($mime_type, $allowed) && getimagesize($_FILES['foto']['tmp_name'])) {
                    $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
                    $name = uniqid('user_') . '.' . $ext;
                    $dest = $directorio . $name;
                    if (move_uploaded_file($_FILES['foto']['tmp_name'], $dest)) {
                        $ruta = '/../imagenes/usuarios/' . $name;
                        $q = "UPDATE persona SET foto_perfil = :ruta WHERE id_persona = (SELECT id_persona FROM usuario WHERE id_usuario = :id)";
                        $s = $db->prepare($q);
                        $s->execute([':ruta' => $ruta, ':id' => $id]);
                    }
                }
            }

            echo json_encode(['success' => true, 'mensaje' => 'Perfil actualizado']);
            break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}