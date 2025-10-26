<?php
// test_sse.php - Crear notificación manual
$archivoNotificacion = __DIR__ . '/temp/ultima_notificacion.json';

$notificacionData = [
    'id_reporte' => 999,
    'mensaje' => "🚨 TEST: Notificación manual de prueba",
    'tipo_incidente' => 'Prueba',
    'usuario' => 'Sistema',
    'timestamp' => time()
];

if (file_put_contents($archivoNotificacion, json_encode($notificacionData))) {
    echo "✅ Notificación TEST creada en: " . $archivoNotificacion . "\n";
    echo "📄 Contenido: " . json_encode($notificacionData) . "\n";
} else {
    echo "❌ Error creando notificación TEST\n";
}
?>