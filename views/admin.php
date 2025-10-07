<?php
session_start();

// Verificar que el usuario esté logueado y sea administrador
if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] != 1) {
    header("Location: ../index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Ojo en la Vía</title>
</head>
<body>
    <h1>Bienvenido al Panel de Administración</h1>
    <p>Hola, <?php echo $_SESSION['nombres']; ?> (Administrador)</p>
    <!-- Aquí va el contenido del panel admin -->
</body>
</html>