<?php
require_once '../config/database.php';
require_once '../controllers/sesioncontrolador.php';

$database = new Database();
$db = $database->conectar();

$sesion = new SesionControlador($db);


?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Panel</title>
</head>
<body>
    <h1>Bienvenido <?= $_SESSION['usuario'] ?></h1>
    <a href="logout.php">Cerrar sesión</a>
</body>
</html>
