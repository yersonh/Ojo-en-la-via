<?php
require_once __DIR__ . '/../../config/database.php';
session_start();

// Conexión a la base de datos
$database = new Database();
$db = $database->conectar();

// Variable para mensajes
$mensaje = "";

// Validar que haya un token por GET
if (!isset($_GET['token'])) {
    die("Token no proporcionado.");
}

$token = $_GET['token'];

// Verificar token válido (solo si es GET o POST)
$stmt = $db->prepare("SELECT * FROM public.recovery_tokens WHERE token = :token AND expiracion > NOW() AND usado = FALSE LIMIT 1");
$stmt->bindParam(':token', $token);
$stmt->execute();
$tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tokenData) {
    die("Token inválido o expirado.");
}

// Procesar el cambio de contraseña
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nuevaContrasena = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Actualizar contraseña del usuario
    $stmtUpdate = $db->prepare("UPDATE usuario SET contrasena = :contrasena WHERE id_usuario = :id_usuario");
    $stmtUpdate->bindParam(':contrasena', $nuevaContrasena);
    $stmtUpdate->bindParam(':id_usuario', $tokenData['id_usuario']);
    $stmtUpdate->execute();

    // Marcar token como usado
    $stmtUsed = $db->prepare("UPDATE public.recovery_tokens SET usado = TRUE WHERE id = :id");
    $stmtUsed->bindParam(':id', $tokenData['id']);
    $stmtUsed->execute();

    $mensaje = "Contraseña cambiada correctamente. Ahora puedes iniciar sesión.";
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        input, button { padding: 0.5rem; margin: 0.5rem 0; }
        button { cursor: pointer; }
        p { font-weight: bold; color: green; }
    </style>
</head>
<body>
    <?php if($mensaje): ?>
        <p><?php echo $mensaje; ?></p>
    <?php else: ?>
        <h2>Restablecer Contraseña</h2>
        <form method="POST" action="">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
            <label>Nueva contraseña:</label><br>
            <input type="password" name="password" required><br>
            <button type="submit">Cambiar contraseña</button>
        </form>
    <?php endif; ?>
</body>
</html>
