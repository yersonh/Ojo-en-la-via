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
    // Primero obtener los reportes
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
    
    // Obtener TODAS las imágenes para cada reporte
    foreach ($reportes as &$reporte) {
        $queryImg = "SELECT url_imagen FROM imagen_reporte WHERE id_reporte = :id_reporte ORDER BY id_imagen";
        $stmtImg = $db->prepare($queryImg);
        $stmtImg->execute([':id_reporte' => $reporte['id_reporte']]);
        $imagenes = $stmtImg->fetchAll(PDO::FETCH_ASSOC);
        
        $reporte['imagenes'] = array_column($imagenes, 'url_imagen');
    }
    unset($reporte);
    
    $unexpected_output = ob_get_contents();
    if (!empty($unexpected_output)) {
        error_log("⚠️ Output inesperado en listar: " . $unexpected_output);
        ob_clean();
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

                // Iniciar transacción para asegurar consistencia
                $db->beginTransaction();

                try {
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
                    error_log("✅ Reporte insertado con ID: " . $id_reporte);

                    // Manejo de imagen - CÓDIGO CORREGIDO
                    $imagen_subida = false;
                    $id_imagen = null;
                    
                    if (!empty($_FILES['imagen']['name']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
                        error_log("📸 Iniciando procesamiento de imagen...");
                        
                        // Directorio para imágenes (usando documento raíz)
                        $directorio = $_SERVER['DOCUMENT_ROOT'] . '/imagenes/reportes/';
                        
                        // Crear directorio si no existe
                        if (!is_dir($directorio)) {
                            if (!mkdir($directorio, 0755, true)) {
                                throw new Exception("No se pudo crear el directorio para imágenes");
                            }
                            error_log("📁 Directorio creado: " . $directorio);
                        }

                        // ✅ Validación robusta de tipo de archivo
                        $finfo = finfo_open(FILEINFO_MIME_TYPE);
                        $mime_type = finfo_file($finfo, $_FILES['imagen']['tmp_name']);
                        finfo_close($finfo);

                        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                        
                        if (!in_array($mime_type, $allowed_types)) {
                            throw new Exception("Solo se permiten imágenes JPEG, PNG, GIF o WebP. Tipo recibido: " . $mime_type);
                        }

                        // ✅ Validar que sea una imagen real
                        $image_info = getimagesize($_FILES['imagen']['tmp_name']);
                        if (!$image_info) {
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
                        
                        // ✅ CORREGIDO: Crear URL absoluta para la BD
                        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
                        $host = $_SERVER['HTTP_HOST'];
                        $urlImagen = $protocol . '://' . $host . '/imagenes/reportes/' . $nombreArchivo;

                        error_log("🖼️ Ruta destino: " . $rutaDestino);
                        error_log("🌐 URL para BD: " . $urlImagen);
                        error_log("📊 Tamaño archivo: " . $_FILES['imagen']['size'] . " bytes");

                        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino)) {
                            error_log("✅ Imagen guardada físicamente en: " . $rutaDestino);
                            
                            // Verificar que el archivo existe después de moverlo
                            if (file_exists($rutaDestino)) {
                                error_log("✅ Archivo verificado en servidor, tamaño: " . filesize($rutaDestino) . " bytes");
                            } else {
                                throw new Exception("Error: La imagen no se guardó correctamente en el servidor");
                            }

                            // ✅ Insertar en base de datos con URL absoluta
                            $queryImg = "INSERT INTO imagen_reporte (id_reporte, url_imagen) VALUES (:id_reporte, :url_imagen)";
                            $stmtImg = $db->prepare($queryImg);
                            $resultado = $stmtImg->execute([
                                ':id_reporte' => $id_reporte,
                                ':url_imagen' => $urlImagen
                            ]);

                            if ($resultado) {
                                $id_imagen = $db->lastInsertId();
                                $imagen_subida = true;
                                error_log("✅ Imagen insertada en BD con ID: " . $id_imagen . ", URL: " . $urlImagen);
                            } else {
                                error_log("❌ Error al insertar imagen en BD");
                                // Eliminar archivo físico si falla la BD
                                unlink($rutaDestino);
                                throw new Exception("Error al guardar la imagen en la base de datos");
                            }
                        } else {
                            $error = error_get_last();
                            throw new Exception("Error al subir la imagen: " . ($error['message'] ?? 'Error desconocido'));
                        }
                    } else {
                        $upload_error = $_FILES['imagen']['error'] ?? 'No file';
                        error_log("📸 Información de imagen - Error: " . $upload_error . ", Nombre: " . ($_FILES['imagen']['name'] ?? 'No name'));
                        
                        if ($upload_error !== UPLOAD_ERR_NO_FILE) {
                            $upload_errors = [
                                UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido',
                                UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo del formulario',
                                UPLOAD_ERR_PARTIAL => 'El archivo fue solo parcialmente subido',
                                UPLOAD_ERR_NO_FILE => 'No se seleccionó ningún archivo',
                                UPLOAD_ERR_NO_TMP_DIR => 'Falta el directorio temporal',
                                UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo en el disco',
                                UPLOAD_ERR_EXTENSION => 'Una extensión de PHP detuvo la subida del archivo'
                            ];
                            throw new Exception("Error al subir imagen: " . ($upload_errors[$upload_error] ?? 'Error desconocido'));
                        }
                    }

                    // Confirmar transacción
                    $db->commit();

                    // Verificar output accidental antes de enviar respuesta
                    $unexpected_output = ob_get_contents();
                    if (!empty($unexpected_output)) {
                        error_log("⚠️ Output inesperado en registrar: " . $unexpected_output);
                        ob_clean(); // Limpiar solo el output accidental
                    }

                    $respuesta = [
                        "success" => true,
                        "mensaje" => "Reporte registrado correctamente" . ($imagen_subida ? " con imagen" : ""),
                        "id_reporte" => $id_reporte
                    ];
                    
                    if ($imagen_subida) {
                        $respuesta["id_imagen"] = $id_imagen;
                        $respuesta["url_imagen"] = $urlImagen;
                    }
                    
                    echo json_encode($respuesta);

                } catch (Exception $e) {
                    // Revertir transacción en caso de error
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