<?php
// LO PRIMERO EN EL ARCHIVO - Sin espacios/blancos antes!
ob_start(); // Capturar cualquier output accidental
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';

try {
    require_once __DIR__ . '/../config/database.php';

    $database = new Database();
    $db = $database->conectar();

    switch ($action) {

        // Listar los reportes
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
            
            // Verificar si hay output accidental antes del JSON
            $unexpected_output = ob_get_contents();
            if (!empty($unexpected_output)) {
                error_log("⚠️ Output inesperado en listar: " . $unexpected_output);
                ob_clean(); // Limpiar solo el output accidental
            }
            
            echo json_encode($reportes);
            break;

        // Registrar reporte 
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

                // Validar que el usuario existe y está activo
                $queryUser = "SELECT id_usuario FROM usuario WHERE id_usuario = :id_usuario";
                $stmtUser = $db->prepare($queryUser);
                $stmtUser->execute([':id_usuario' => $id_usuario]);
                
                if (!$stmtUser->fetch()) {
                    throw new Exception("Usuario no válido");
                }

                // Insertar reporte
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

                // Manejo de imagen
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

                // Verificar output accidental antes de enviar respuesta
                $unexpected_output = ob_get_contents();
                if (!empty($unexpected_output)) {
                    error_log("⚠️ Output inesperado en registrar: " . $unexpected_output);
                    ob_clean(); // Limpiar solo el output accidental
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

        case 'listar_comentarios':
            $id_reporte = $_GET['id_reporte'] ?? '';
            if (empty($id_reporte)) {
                throw new Exception("ID de reporte requerido");
            }
            
            $query = "
                SELECT 
                    c.id_comentario,
                    c.comentario,
                    c.fecha_comentario,
                    u.correo AS usuario,
                    p.nombres,
                    p.apellidos
                FROM comentario_reporte c
                INNER JOIN usuario u ON c.id_usuario = u.id_usuario
                INNER JOIN persona p ON u.id_persona = p.id_persona
                WHERE c.id_reporte = :id_reporte
                ORDER BY c.fecha_comentario ASC
            ";
            $stmt = $db->prepare($query);
            $stmt->execute([':id_reporte' => $id_reporte]);
            $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Verificar output accidental
            $unexpected_output = ob_get_contents();
            if (!empty($unexpected_output)) {
                error_log("⚠️ Output inesperado en listar_comentarios: " . $unexpected_output);
                ob_clean();
            }
            
            echo json_encode($comentarios);
            break;

        case 'agregar_comentario':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id_reporte = $_POST['id_reporte'];
                $id_usuario = $_POST['id_usuario'];
                $comentario = filter_var($_POST['comentario'], FILTER_SANITIZE_STRING);
                
                if (empty($id_reporte) || empty($id_usuario) || empty($comentario)) {
                    throw new Exception("Todos los campos son obligatorios");
                }
                
                // Verificar que el reporte existe
                $queryCheck = "SELECT id_reporte FROM reporte WHERE id_reporte = :id_reporte";
                $stmtCheck = $db->prepare($queryCheck);
                $stmtCheck->execute([':id_reporte' => $id_reporte]);
                
                if (!$stmtCheck->fetch()) {
                    throw new Exception("El reporte no existe");
                }
                
                $query = "INSERT INTO comentario_reporte (id_reporte, id_usuario, comentario) 
                        VALUES (:id_reporte, :id_usuario, :comentario)";
                $stmt = $db->prepare($query);
                $stmt->execute([
                    ':id_reporte' => $id_reporte,
                    ':id_usuario' => $id_usuario,
                    ':comentario' => $comentario
                ]);
                
                // Verificar output accidental
                $unexpected_output = ob_get_contents();
                if (!empty($unexpected_output)) {
                    error_log("⚠️ Output inesperado en agregar_comentario: " . $unexpected_output);
                    ob_clean();
                }
                
                echo json_encode([
                    "success" => true,
                    "mensaje" => "Comentario agregado correctamente",
                    "id_comentario" => $db->lastInsertId()
                ]);
            }
            break;
        default:
            // Verificar output accidental
            $unexpected_output = ob_get_contents();
            if (!empty($unexpected_output)) {
                error_log("⚠️ Output inesperado en default: " . $unexpected_output);
                ob_clean();
            }
            
            echo json_encode(["error" => "Acción no válida"]);
            break;
    }
} catch (Exception $e) {
    // Verificar output accidental antes del error
    $unexpected_output = ob_get_contents();
    if (!empty($unexpected_output)) {
        error_log("⚠️ Output inesperado en catch: " . $unexpected_output);
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error interno del servidor",
        "mensaje" => $e->getMessage()
    ]);
}

// Finalizar el buffer sin limpiar (ya limpiamos solo lo accidental)
ob_end_flush();
?>