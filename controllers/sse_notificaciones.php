<?php
// controllers/sse_notificaciones.php

session_start(); // ✅ Debe ir antes de cualquier header

// Validar que el usuario sea admin
if (!isset($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? 0) != 1) {
    header('Content-Type: text/event-stream; charset=utf-8');
    echo "data: " . json_encode(['error' => 'No autorizado']) . "\n\n";
    flush();
    exit();
}

// ---- Encabezados SSE ----
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // desactiva buffering en nginx/proxy

// ---- Configuración del entorno ----
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', '0');
while (ob_get_level() > 0) ob_end_flush();
flush();

ignore_user_abort(true);
set_time_limit(0);

// ---- Función para enviar eventos SSE ----
function sendSSE($event, $data) {
    echo "event: $event\n";
    echo "data: " . json_encode($data) . "\n\n";
    @ob_flush();
    @flush();
}

// ---- Archivo donde se guardan notificaciones ----
$archivoNotificacion = __DIR__ . '/../temp/ultima_notificacion.json';

// Crear carpeta si no existe
if (!is_dir(dirname($archivoNotificacion))) {
    mkdir(dirname($archivoNotificacion), 0755, true);
}

// Enviar ping inicial
sendSSE('ping', ['message' => 'Conectado', 'timestamp' => time()]);
$ultimoCheck = time();

try {
    while (true) {
        if (connection_aborted()) break;

        // Revisar si hay nueva notificación
        if (file_exists($archivoNotificacion)) {
            $data = json_decode(file_get_contents($archivoNotificacion), true);
            if ($data && isset($data['timestamp']) && $data['timestamp'] > $ultimoCheck) {
                sendSSE('nuevo_reporte', $data);
                $ultimoCheck = $data['timestamp'];
                unlink($archivoNotificacion);
            }
        }

        // Enviar "ping" cada 25 segundos para mantener la conexión viva
        if ((time() - $ultimoCheck) >= 25) {
            sendSSE('ping', ['timestamp' => time()]);
            $ultimoCheck = time();
        }

        sleep(2);
    }
} catch (Exception $e) {
    sendSSE('error', ['message' => $e->getMessage()]);
}
?>
