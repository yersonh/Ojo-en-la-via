<?php
require_once 'database.php';

$db = new Database();
$conn = $db->conectar();

if ($conn) {
    echo "✅ Conexión establecida con la clase Database";
} else {
    echo "❌ No se pudo conectar";
}
