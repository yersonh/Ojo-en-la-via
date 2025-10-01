<?php
/*require_once __DIR__ . '/database.php'; // archivo donde está la clase Database
require __DIR__ . '/../phpmailer/PHPMailer.php';
require __DIR__ . '/../phpmailer/SMTP.php';
require __DIR__ . '/../phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

session_start();

// Crear conexión con la BD
$database = new Database();
$db = $database->conectar(); // ahora sí tienes la variable $db (PDO)

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correoUsuario = $_POST['email']; // correo ingresado en el formulario

    // 🔎 Verificar si el correo existe en la BD
   $stmt = $db->prepare("SELECT * FROM usuario WHERE correo = :correo LIMIT 1");
    $stmt->bindParam(':correo', $correoUsuario);
    $stmt->execute();
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        // ✅ Si el correo existe, enviamos el email
        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor SMTP
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'lauren.sofiaog@gmail.com'; // tu correo Gmail
            $mail->Password   = 'rsbz pumzpvdpdgka';        // contraseña de aplicación (App Password)
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Remitente
            $mail->setFrom('lauren.sofiaog@gmail.com', 'Soporte');

            // Destinatario
            $mail->addAddress($correoUsuario);

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = 'Recuperación de contraseña';
            $mail->Body    = "Hola, <br><br>Haz clic en este enlace para restablecer tu contraseña:<br>
                              <a href='http://localhost:8080/views/manage/verificar_correoManage.php?email=$correoUsuario'>
                              Restablecer contraseña</a>";

            $mail->send();
            echo "✅ Se ha enviado un enlace de recuperación al correo: $correoUsuario";
        } catch (Exception $e) {
            echo "❌ No se pudo enviar el correo. Error: {$mail->ErrorInfo}";
        }
    } else {
        // ❌ Si el correo no existe, no enviamos nada
        echo "⚠️ El correo ingresado no está registrado en el sistema.";
    }
}*/
// esto envia el gmail
require_once __DIR__ . '/database.php';
require __DIR__ . '/../phpmailer/PHPMailer.php';
require __DIR__ . '/../phpmailer/SMTP.php';
require __DIR__ . '/../phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

session_start();

$database = new Database();
$db = $database->conectar();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correoUsuario = $_POST['email'];

    // Verificar si el correo existe
    $stmt = $db->prepare("SELECT * FROM usuario WHERE correo = :correo LIMIT 1");
    $stmt->bindParam(':correo', $correoUsuario);
    $stmt->execute();
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        // Crear token único y expiración
        $token = bin2hex(random_bytes(32));
        $expiracion = date("Y-m-d H:i:s", strtotime("+1 hour"));

        // Guardar token en la base de datos
        $stmtToken = $db->prepare("INSERT INTO recovery_tokens (id_usuario, token, expiracion) VALUES (:id_usuario, :token, :expiracion)");
        $stmtToken->bindParam(':id_usuario', $usuario['id_usuario']);
        $stmtToken->bindParam(':token', $token);
        $stmtToken->bindParam(':expiracion', $expiracion);
        $stmtToken->execute();

        // Enviar correo
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
             $mail->Username   = 'lauren.sofiaog@gmail.com'; // tu correo Gmail
            $mail->Password   = 'rsbz pumzpvdpdgka';        // contraseña de aplicación (App Password)
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

              $mail->setFrom('lauren.sofiaog@gmail.com', 'Soporte');
            $mail->addAddress($correoUsuario);

            $mail->isHTML(true);
            $mail->Subject = 'Recuperación de contraseña';
            $mail->Body    = "Hola,<br><br>Haz clic en este enlace para restablecer tu contraseña:<br>
                              <a href='http://localhost:8080/views/manage/reset_password.php?token=$token'>
                              Restablecer contraseña</a><br><br>El enlace expira en 1 hora.";

            $mail->send();
            echo "Se ha enviado un enlace de recuperación al correo: $correoUsuario";
        } catch (Exception $e) {
            echo "No se pudo enviar el correo. Error: {$mail->ErrorInfo}";
        }

    } else {
        echo "El correo ingresado no está registrado.";
    }
}
