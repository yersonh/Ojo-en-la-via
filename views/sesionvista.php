<?php
require_once '../config/database.php';
require_once '../controllers/sesioncontrolador.php';

// Crear conexión
$database = new Database();
$db = $database->conectar();

// Instanciar controlador
$controller = new SesionControlador($db);

// Manejo de login y logout
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['login'])) {
        if ($controller->login($_POST['correo'], $_POST['password'])) {
            echo "✅ Sesión iniciada correctamente.";
        } else {
            echo "❌ Correo o contraseña incorrectos.";
        }
    } elseif (isset($_POST['logout'])) {
        $controller->logout();
        echo "👋 Sesión cerrada.";
    }
}

$usuario = $controller->estaLogueado() ? $_SESSION['usuario'] : null;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Iniciar Sesión - UBER APP</title>
    <style>
        body { font-family: Arial, sans-serif; background:#111; color:#fff; text-align:center; padding:40px; }
        .form-box { background:#222; padding:20px; border-radius:10px; width:350px; margin:auto; }
        input { display:block; width:90%; margin:10px auto; padding:10px; border:none; border-radius:5px; }
        button { background:#28a745; color:#fff; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; }
        button:hover { background:#1e7e34; }
        a { color:#0af; text-decoration:none; display:block; margin-top:15px; }
    </style>
</head>
<body>
    <h2>🔑 Iniciar Sesión</h2>

    <?php if ($usuario): ?>
        <div class="form-box">
            <p>Bienvenido <b><?= htmlspecialchars($usuario) ?></b></p>
            <form method="POST">
                <button type="submit" name="logout">Cerrar Sesión</button>
            </form>
            <a href="../index.php">⬅ Volver al inicio</a>
        </div>
    <?php else: ?>
        <div class="form-box">
            <form method="POST">
                <input type="email" name="correo" placeholder="Correo" required>
                <input type="password" name="password" placeholder="Contraseña" required>
                <button type="submit" name="login">Iniciar Sesión</button>
            </form>
            <a href="../views/usuarioregistrar.php">📝 Registrarse</a>
        </div>
    <?php endif; ?>
</body>
</html>
