<?php
// LO PRIMERO EN EL ARCHIVO - Sin espacios/blancos antes!
ob_start(); // Capturar cualquier output accidental
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

session_start();
$currentUserId = $_SESSION['usuario_id'] ?? null;
$action = $_GET['action'] ?? '';

try {
    require_once __DIR__ . '/../config/database.php';

    $database = new Database();
    $db = $database->conectar();

    switch ($action) {

        // Listar los reportes
        case 'listar':
            $usuarioId = $currentUserId ? (int) $currentUserId : null;
            $userLikedSelect = $usuarioId ? 'COALESCE(ul.user_liked, 0)' : '0';
            $userLikedJoin = '';
            if ($usuarioId) {
                $userLikedJoin = "LEFT JOIN (
                    SELECT id_reporte, 1 AS user_liked
                    FROM like_reporte
                    WHERE id_usuario = :usuario_id
                ) ul ON ul.id_reporte = r.id_reporte";
            }

            $query = "
                SELECT 
                    r.id_reporte,
                    r.descripcion,
                    r.latitud,
                    r.longitud,
                    r.fecha_reporte,
                    r.estado,
                    t.nombre AS tipo_incidente,
                    u.correo AS usuario_correo,
                    p.nombres,
                    p.apellidos,
                    p.foto_perfil,
                    COALESCE(l.total_likes, 0) AS total_likes,
                    $userLikedSelect AS user_liked
                FROM reporte r
                INNER JOIN tipo_incidente t ON r.id_tipo_incidente = t.id_tipo_incidente
                INNER JOIN usuario u ON r.id_usuario = u.id_usuario
                INNER JOIN persona p ON u.id_persona = p.id_persona
                LEFT JOIN (
                    SELECT id_reporte, COUNT(*) AS total_likes
                    FROM like_reporte
                    GROUP BY id_reporte
                ) l ON l.id_reporte = r.id_reporte
                {$userLikedJoin}
                ORDER BY r.fecha_reporte DESC
            ";

            $stmt = $db->prepare($query);
            if ($usuarioId) {
                $stmt->bindValue(':usuario_id', $usuarioId, PDO::PARAM_INT);
            }
            $stmt->execute();
            $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($reportes as &$reporte) {
                $stmtImg = $db->prepare("SELECT url_imagen FROM imagen_reporte WHERE id_reporte = :id_reporte ORDER BY id_imagen");
                $stmtImg->execute([':id_reporte' => $reporte['id_reporte']]);
                $imagenes = $stmtImg->fetchAll(PDO::FETCH_ASSOC);
                $reporte['imagenes'] = array_column($imagenes, 'url_imagen');
                $reporte['total_likes'] = isset($reporte['total_likes']) ? (int) $reporte['total_likes'] : 0;
                $reporte['user_liked'] = isset($reporte['user_liked']) ? (int) $reporte['user_liked'] : 0;
                $reporte['usuario'] = $reporte['usuario_correo'] ?? '';
            }
            unset($reporte);

            $unexpected_output = ob_get_contents();
            if (!empty($unexpected_output)) {
                error_log("⚠️ Output inesperado en listar: " . $unexpected_output);
                ob_clean();
            }

            echo json_encode($reportes);
            break;

        case 'toggle_like':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'mensaje' => 'Método no permitido']);
                break;
            }

            if (!$currentUserId) {
                http_response_code(401);
                echo json_encode(['success' => false, 'mensaje' => 'No autenticado']);
                break;
            }

            $idReporte = filter_input(INPUT_POST, 'id_reporte', FILTER_VALIDATE_INT);
            if (!$idReporte) {
                http_response_code(400);
                echo json_encode(['success' => false, 'mensaje' => 'ID de reporte inválido']);
                break;
            }

            try {
                $db->beginTransaction();

                $stmtOwner = $db->prepare('SELECT id_usuario FROM reporte WHERE id_reporte = :id');
                $stmtOwner->execute([':id' => $idReporte]);
                $idPropietario = $stmtOwner->fetchColumn();

                if (!$idPropietario) {
                    throw new Exception('Reporte no encontrado');
                }

                $stmtLike = $db->prepare('SELECT id_like FROM like_reporte WHERE id_reporte = :id_reporte AND id_usuario = :id_usuario');
                $stmtLike->execute([
                    ':id_reporte' => $idReporte,
                    ':id_usuario' => $currentUserId
                ]);
                $likeExistente = $stmtLike->fetchColumn();

                $accion = 'liked';
                if ($likeExistente) {
                    $stmtDelete = $db->prepare('DELETE FROM like_reporte WHERE id_reporte = :id_reporte AND id_usuario = :id_usuario');
                    $stmtDelete->execute([
                        ':id_reporte' => $idReporte,
                        ':id_usuario' => $currentUserId
                    ]);
                    $accion = 'unliked';
                } else {
                    $stmtInsert = $db->prepare('INSERT INTO like_reporte (id_reporte, id_usuario) VALUES (:id_reporte, :id_usuario)');
                    $stmtInsert->execute([
                        ':id_reporte' => $idReporte,
                        ':id_usuario' => $currentUserId
                    ]);

                    if ((int) $idPropietario !== (int) $currentUserId) {
                        $stmtNombre = $db->prepare('SELECT p.nombres, p.apellidos FROM usuario u INNER JOIN persona p ON u.id_persona = p.id_persona WHERE u.id_usuario = :id');
                        $stmtNombre->execute([':id' => $currentUserId]);
                        $persona = $stmtNombre->fetch(PDO::FETCH_ASSOC);
                        $autorNombre = trim(($persona['nombres'] ?? '') . ' ' . ($persona['apellidos'] ?? ''));
                        $mensaje = $autorNombre ? $autorNombre . ' dio me gusta a tu reporte.' : 'Un usuario dio me gusta a tu reporte.';

                        $stmtNotif = $db->prepare('INSERT INTO notificacion (id_usuario_destino, id_usuario_origen, id_reporte, tipo, mensaje) VALUES (:destino, :origen, :reporte, :tipo, :mensaje)');
                        $stmtNotif->execute([
                            ':destino' => $idPropietario,
                            ':origen' => $currentUserId,
                            ':reporte' => $idReporte,
                            ':tipo' => 'like',
                            ':mensaje' => $mensaje
                        ]);
                    }
                }

                $stmtTotal = $db->prepare('SELECT COUNT(*) FROM like_reporte WHERE id_reporte = :id_reporte');
                $stmtTotal->execute([':id_reporte' => $idReporte]);
                $totalLikes = (int) $stmtTotal->fetchColumn();

                $db->commit();

                echo json_encode([
                    'success' => true,
                    'action' => $accion,
                    'total_likes' => $totalLikes
                ]);
            } catch (Exception $ex) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'mensaje' => $ex->getMessage()
                ]);
            }
            break;

        // Registrar reporte 
        // Registrar reporte 
        case 'registrar':
    // Si viene con formulario (multipart/form-data)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Sanitizar y validar datos (tu código igual)
        $id_usuario = filter_var($_POST['id_usuario'], FILTER_VALIDATE_INT);
        $id_tipo_incidente = filter_var($_POST['id_tipo_incidente'], FILTER_VALIDATE_INT);
        $descripcion = filter_var($_POST['descripcion'], FILTER_SANITIZE_STRING);
        $latitud = filter_var($_POST['latitud'], FILTER_VALIDATE_FLOAT);
        $longitud = filter_var($_POST['longitud'], FILTER_VALIDATE_FLOAT);

        // Validar datos requeridos (tu código igual)
        if (empty($id_usuario) || empty($id_tipo_incidente) || empty($descripcion) || empty($latitud) || empty($longitud)) {
            throw new Exception("Todos los campos son obligatorios");
        }

        // Validar coordenadas (tu código igual)
        if ($latitud < -90 || $latitud > 90 || $longitud < -180 || $longitud > 180) {
            throw new Exception("Coordenadas no válidas");
        }

        // Validar que el usuario existe (tu código igual)
        $queryUser = "SELECT id_usuario FROM usuario WHERE id_usuario = :id_usuario";
        $stmtUser = $db->prepare($queryUser);
        $stmtUser->execute([':id_usuario' => $id_usuario]);
        
        if (!$stmtUser->fetch()) {
            throw new Exception("Usuario no válido");
        }

        // Iniciar transacción
        $db->beginTransaction();

        try {
            // Insertar reporte (tu código igual)
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
            error_log("✅ Reporte insertado con ID: " . $id_reporte);

            // 🆕 CORRECCIÓN COMPLETA: Manejo de MÚLTIPLES IMÁGENES
            $imagenes_subidas = 0;
            $urls_imagenes = [];
            
            // Verificar si hay imágenes (con soporte para múltiples)
            if (!empty($_FILES['imagen']['name'][0])) {
                error_log("📸 Procesando " . count($_FILES['imagen']['name']) . " imágenes...");
                
                $directorio = $_SERVER['DOCUMENT_ROOT'] . '/imagenes/reportes/';
                
                // Crear directorio si no existe
                if (!is_dir($directorio)) {
                    if (!mkdir($directorio, 0755, true)) {
                        throw new Exception("No se pudo crear el directorio para imágenes");
                    }
                    error_log("📁 Directorio creado: " . $directorio);
                }

                // Procesar cada imagen
                for ($i = 0; $i < count($_FILES['imagen']['name']); $i++) {
                    // Verificar que no hay error en este archivo específico
                    if ($_FILES['imagen']['error'][$i] !== UPLOAD_ERR_OK) {
                        if ($_FILES['imagen']['error'][$i] !== UPLOAD_ERR_NO_FILE) {
                            error_log("⚠️ Error en archivo $i: " . $_FILES['imagen']['error'][$i]);
                        }
                        continue; // Saltar este archivo pero continuar con los demás
                    }

                    // ✅ Validación de tipo de archivo (CON ÍNDICE [$i])
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mime_type = finfo_file($finfo, $_FILES['imagen']['tmp_name'][$i]); // ← CORREGIDO
                    finfo_close($finfo);

                    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    
                    if (!in_array($mime_type, $allowed_types)) {
                        error_log("❌ Tipo de archivo no permitido: " . $mime_type);
                        continue; // Saltar este archivo pero continuar
                    }

                    // ✅ Validar que sea una imagen real (CON ÍNDICE [$i])
                    $image_info = getimagesize($_FILES['imagen']['tmp_name'][$i]); // ← CORREGIDO
                    if (!$image_info) {
                        error_log("❌ Archivo no es imagen válida: " . $_FILES['imagen']['name'][$i]);
                        continue;
                    }

                    // Validar tamaño (máximo 5MB) (CON ÍNDICE [$i])
                    if ($_FILES['imagen']['size'][$i] > 5 * 1024 * 1024) { // ← CORREGIDO
                        error_log("❌ Imagen muy grande: " . $_FILES['imagen']['name'][$i]);
                        continue;
                    }

                    // Generar nombre seguro (CON ÍNDICE [$i])
                    $extension = pathinfo($_FILES['imagen']['name'][$i], PATHINFO_EXTENSION); // ← CORREGIDO
                    $nombreArchivo = uniqid('reporte_') . '.' . $extension;
                    
                    // Ruta para guardar en servidor
                    $rutaDestino = $directorio . $nombreArchivo;
                    
                    // Crear URL absoluta
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'];
                    $urlImagen = $protocol . '://' . $host . '/imagenes/reportes/' . $nombreArchivo;

                    error_log("🖼️ Procesando imagen $i: " . $_FILES['imagen']['name'][$i] . " -> " . $rutaDestino);

                    // Mover archivo (CON ÍNDICE [$i])
                    if (move_uploaded_file($_FILES['imagen']['tmp_name'][$i], $rutaDestino)) { // ← CORREGIDO
                        error_log("✅ Imagen $i guardada físicamente");
                        
                        // Verificar que el archivo existe
                        if (file_exists($rutaDestino)) {
                            // Insertar en base de datos
                            $queryImg = "INSERT INTO imagen_reporte (id_reporte, url_imagen) VALUES (:id_reporte, :url_imagen)";
                            $stmtImg = $db->prepare($queryImg);
                            $resultado = $stmtImg->execute([
                                ':id_reporte' => $id_reporte,
                                ':url_imagen' => $urlImagen
                            ]);

                            if ($resultado) {
                                $imagenes_subidas++;
                                $urls_imagenes[] = $urlImagen;
                                error_log("✅ Imagen $i insertada en BD: " . $urlImagen);
                            } else {
                                error_log("❌ Error al insertar imagen $i en BD");
                                unlink($rutaDestino); // Limpiar archivo físico
                            }
                        } else {
                            error_log("❌ Archivo no encontrado después de mover: " . $rutaDestino);
                        }
                    } else {
                        $error = error_get_last();
                        error_log("❌ Error al mover imagen $i: " . ($error['message'] ?? 'Error desconocido'));
                    }
                }
            } else {
                error_log("📸 No se recibieron imágenes o array vacío");
            }

            // Confirmar transacción
            $db->commit();

            // Limpiar output accidental
            $unexpected_output = ob_get_contents();
            if (!empty($unexpected_output)) {
                error_log("⚠️ Output inesperado: " . $unexpected_output);
                ob_clean();
            }

            $respuesta = [
                "success" => true,
                "mensaje" => "Reporte registrado correctamente" . 
                ($imagenes_subidas > 0 ? " con $imagenes_subidas imagen(es)" : ""),
                "id_reporte" => $id_reporte
            ];
            
            if ($imagenes_subidas > 0) {
                $respuesta["imagenes"] = $urls_imagenes;
                $respuesta["total_imagenes"] = $imagenes_subidas;
            }
            
            echo json_encode($respuesta);

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
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

        // Acción de diagnóstico para verificar imágenes
        case 'diagnostico_imagenes':
            $directorio = $_SERVER['DOCUMENT_ROOT'] . '/imagenes/reportes/';
            $archivos = is_dir($directorio) ? array_diff(scandir($directorio), ['.', '..']) : ['Directorio no existe'];
            
            // Verificar últimas imágenes en BD
            $query = "SELECT * FROM imagen_reporte ORDER BY id_imagen DESC LIMIT 5";
            $stmt = $db->query($query);
            $ultimas_imagenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Verificar permisos
            $permisos = is_dir($directorio) ? substr(sprintf('%o', fileperms($directorio)), -4) : 'No existe';
            
            echo json_encode([
                'directorio' => $directorio,
                'existe_directorio' => is_dir($directorio),
                'archivos_en_directorio' => array_values($archivos),
                'ultimas_imagenes_bd' => $ultimas_imagenes,
                'permisos_directorio' => $permisos,
                'escribible' => is_dir($directorio) ? is_writable($directorio) : false
            ]);
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