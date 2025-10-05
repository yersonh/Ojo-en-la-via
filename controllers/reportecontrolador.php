<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';

try {
    $database = new Database();
    $db = $database->conectar();

    switch ($action) {

        // ✅ Listar todos los reportes (para el mapa)
        case 'listar':
            $query = "
                SELECT 
                    r.id_reporte,
                    t.nombre AS tipo_incidente,
                    r.descripcion,
                    r.latitud,
                    r.longitud,
                    r.fecha_reporte,
                    u.correo AS usuario,
                    r.estado
                FROM reporte r
                INNER JOIN tipo_incidente t ON r.id_tipo_incidente = t.id_tipo_incidente
                INNER JOIN usuario u ON r.id_usuario = u.id_usuario
                ORDER BY r.fecha_reporte DESC
            ";
            $stmt = $db->query($query);
            $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($reportes);
            break;

        // 📌 Registrar un nuevo reporte
        case 'registrar':
            // Si viene con formulario (multipart/form-data)
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Sanitizar y validar datos
                $id_usuario = filter_var($_POST['id_usuario'], FILTER_VALIDATE_INT);
                $id_tipo_incidente = filter_var($_POST['id_tipo_incidente'], FILTER_VALIDATE_INT);
                $descripcion = filter_var($_POST['descripcion'], FILTER_SANITIZE_STRING);
                $latitud = filter_var($_POST['latitud'], FILTER_VALIDATE_FLOAT);
                $longitud = filter_var($_POST['longitud'], FILTER_VALIDATE_FLOAT);

                // Validar datos requeridos
                if (empty($id_usuario) || empty($id_tipo_incidente) || empty($descripcion) || empty($latitud) || empty($longitud)) {
                    throw new Exception("Todos los campos son obligatorios");
                }

                // Validar coordenadas
                if ($latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180) {
                    throw new Exception("Coordenadas no válidas");
                }

                // ✅ Validar que el usuario existe y está activo
                $queryUser = "SELECT id_usuario FROM usuario WHERE id_usuario = :id_usuario";
                $stmtUser = $db->prepare($queryUser);
                $stmtUser->execute([':id_usuario' => $id_usuario]);
                
                if (!$stmtUser->fetch()) {
                    throw new Exception("Usuario no válido");
                }

                // 📌 Insertar reporte
                $query = "
                    INSERT INTO reporte (id_usuario, id_tipo_incidente, descripcion, latitud, longitud)
                    VALUES (:id_usuario, :id_tipo_incidente, :descripcion, :latitud, :longitud)
                ";
                $stmt = $db->prepare($query);
                $stmt->execute([
                    ':id_usuario' => $id_usuario,
                    ':id_tipo_incidente' => $id_tipo_incidente,
                    ':descripcion' => $descripcion,
                    ':latitud' => $latitud,
                    ':longitud' => $longitud
                ]);

                $id_reporte = $db->lastInsertId();

                // 📸 Manejo de imagen
                if (!empty($_FILES['imagen']['name']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
                    // Directorio para imágenes (usando documento raíz)
                    $directorio = $_SERVER['DOCUMENT_ROOT'] . '/imagenes/reportes/';
                    
                    // Crear directorio si no existe
                    if (!is_dir($directorio)) {
                        mkdir($directorio, 0755, true);
                    }

                    // ✅ Validación robusta de tipo de archivo
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mime_type = finfo_file($finfo, $_FILES['imagen']['tmp_name']);
                    finfo_close($finfo);

                    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    
                    if (!in_array($mime_type, $allowed_types)) {
                        throw new Exception("Solo se permiten imágenes JPEG, PNG, GIF o WebP");
                    }

                    // ✅ Validar que sea una imagen real
                    if (!getimagesize($_FILES['imagen']['tmp_name'])) {
                        throw new Exception("El archivo no es una imagen válida");
                    }

                    // Validar tamaño (máximo 5MB)
                    if ($_FILES['imagen']['size'] > 5 * 1024 * 1024) {
                        throw new Exception("La imagen no debe superar los 5MB");
                    }

                    // Generar nombre seguro
                    $extension = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
                    $nombreArchivo = uniqid('reporte_') . '.' . $extension;
                    
                    // Ruta para guardar en servidor
                    $rutaDestino = $directorio . $nombreArchivo;
                    
                    // Ruta para guardar en BD (relativa al sitio web)
                    $rutaRelativa = '/imagenes/reportes/' . $nombreArchivo;

                    if (move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino)) {
                        // ✅ Corregido: usar url_imagen en lugar de ruta_imagen
                        $queryImg = "INSERT INTO imagen_reporte (id_reporte, url_imagen) VALUES (:id_reporte, :url_imagen)";
                        $stmtImg = $db->prepare($queryImg);
                        $stmtImg->execute([
                            ':id_reporte' => $id_reporte,
                            ':url_imagen' => $rutaRelativa
                        ]);
                    } else {
                        throw new Exception("Error al subir la imagen");
                    }
                }

                echo json_encode([
                    "success" => true,
                    "mensaje" => "Reporte registrado correctamente",
                    "id_reporte" => $id_reporte
                ]);
            } else {
                throw new Exception("Método no permitido");
            }
            break;

        default:
            echo json_encode(["error" => "Acción no válida"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error interno del servidor",
        "mensaje" => $e->getMessage()
    ]);
}
?>