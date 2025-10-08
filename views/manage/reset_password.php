<?php
require_once _DIR_ . '/../../config/database.php';
session_start();

// 🔌 Conexión a la base de datos
$database = new Database();
$db = $database->conectar();

// Variable para mensajes
$mensaje = "";

// 🧩 Validar token en la URL
if (!isset($_GET['token']) || empty($_GET['token'])) {
    die("Token no proporcionado o inválido.");
}

$token = $_GET['token'];

// 🔍 Verificar token válido (no expirado y no usado)
$stmt = $db->prepare("
    SELECT * 
    FROM public.recovery_tokens 
    WHERE token = :token 
      AND expiracion > NOW() 
      AND usado = FALSE 
    LIMIT 1
");
$stmt->bindParam(':token', $token);
$stmt->execute();
$tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tokenData) {
    die("Token inválido o expirado.");
}

// 🔐 Procesar el formulario (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';

    // Validaciones básicas
    if (empty($password)) {
        $mensaje = "Por favor ingresa una nueva contraseña.";
    } elseif (strlen($password) < 8) {
        $mensaje = "La contraseña debe tener al menos 8 caracteres.";
    } else {
        // Hashear la nueva contraseña
        $nuevaContrasena = password_hash($password, PASSWORD_DEFAULT);

        // Actualizar contraseña del usuario
        $stmtUpdate = $db->prepare("
            UPDATE usuario 
            SET contrasena = :contrasena 
            WHERE id_usuario = :id_usuario
        ");
        $stmtUpdate->bindParam(':contrasena', $nuevaContrasena);
        $stmtUpdate->bindParam(':id_usuario', $tokenData['id_usuario']);
        $stmtUpdate->execute();

        // Marcar token como usado
        $stmtUsed = $db->prepare("
            UPDATE public.recovery_tokens 
            SET usado = TRUE 
            WHERE id = :id
        ");
        $stmtUsed->bindParam(':id', $tokenData['id']);
        $stmtUsed->execute();

        // Mostrar mensaje y redirigir después de 3 segundos
        $mensaje = "✅ Contraseña cambiada correctamente. Serás redirigido al inicio de sesión...";
        header("refresh:3;url=/views/login.php");
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background: #fff;
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            width: 350px;
            text-align: center;
        }
        input[type="password"] {
            width: 100%;
            padding: 0.5rem;
            margin: 0.8rem 0;
            border: 1px solid #ccc;
            border-radius: 6px;
        }
        button {
            width: 100%;
            background-color: #007BFF;
            color: white;
            border: none;
            padding: 0.7rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        button:hover {
            background-color: #0056b3;
        }
        p {
            color: green;
            font-weight: bold;
            margin-top: 1rem;
        }
        .error {
            color: red;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($mensaje): ?>
            <p class="<?php echo strpos($mensaje, '✅') !== false ? '' : 'error'; ?>">
                <?php echo $mensaje; ?>
            </p>
        <?php else: ?>
            <h2>Restablecer Contraseña</h2>
            <form method="POST" action="">
                <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                <label>Nueva contraseña:</label><br>
                <input type="password" name="password" required minlength="8"><br>
                <button type="submit">Cambiar contraseña</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>