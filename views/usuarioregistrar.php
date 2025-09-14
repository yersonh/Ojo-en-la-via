<?php
require_once '../config/database.php';
require_once '../controllers/sesioncontrolador.php';

// Crear conexión
$database = new Database();
$db = $database->conectar();

// Instanciar controlador
$controller = new SesionControlador($db);

// Manejo de registro
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['registrar'])) {
    $controller->registrar(
        $_POST['nombre'],
        $_POST['apellido'],
        $_POST['telefono'],
        $_POST['cedula'],   // ✅ cedula agregada
        $_POST['correo'],
        $_POST['password']
    );
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registrar Usuario - UBER APP</title>
    <style>
        body { font-family: Arial, sans-serif; background:#111; color:#fff; text-align:center; padding:40px; }
        .form-box { background:#222; padding:20px; border-radius:10px; width:350px; margin:auto; }
        input { display:block; width:90%; margin:10px auto; padding:10px; border:none; border-radius:5px; }
        button { background:#007bff; color:#fff; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; }
        button:hover { background:#0056b3; }
        a { color:#0af; text-decoration:none; display:block; margin-top:15px; }
    </style>
</head>
<body>
    <h2>📝 Registrar Usuario</h2>
    <div class="form-box">
        <form method="POST">
            <input type="text" name="nombre" placeholder="Nombre" required>
            <input type="text" name="apellido" placeholder="Apellido" required>
            <input type="text" name="telefono" placeholder="Teléfono" required>
            <input type="text" name="cedula" placeholder="Cédula" required> <!-- ✅ Nuevo campo -->
            <input type="email" name="correo" placeholder="Correo" required>
            <input type="password" name="password" placeholder="Contraseña" required>
            <button type="submit" name="registrar">Registrar</button>
        </form>
        <a href="../index.php">⬅ Volver al inicio</a>
    </div>
</body>
</html>
