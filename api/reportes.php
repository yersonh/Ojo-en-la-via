<?php
// Mostrar errores solo en desarrollo
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Cargar config usando ruta relativa segura
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
$db = $database->conectar();

    // Consulta de reportes con su tipo, usuario y ubicación
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
        ORDER BY r.fecha_reporte DESC;
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reportes);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Error interno del servidor",
        "mensaje" => $e->getMessage()
    ]);
}
?>
