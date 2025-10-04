<?php
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

echo "<h1>🧪 Test Brevo SMTP</h1>";

// Mostrar configuración (ocultar contraseña)
echo "<h2>Configuración SMTP:</h2>";
echo "Host: " . getenv('SMTP_HOST') . "<br>";
echo "Usuario: " . getenv('SMTP_USER') . "<br>";
echo "Puerto: " . getenv('SMTP_PORT') . "<br>";
echo "From: " . getenv('SMTP_FROM') . "<br>";

// Probar conexión SMTP
try {
    $mail = new PHPMailer(true);
    
    // Configuración Brevo
    $mail->isSMTP();
    $mail->Host       = getenv('SMTP_HOST');
    $mail->SMTPAuth   = true;
    $mail->Username   = getenv('SMTP_USER');
    $mail->Password   = getenv('SMTP_PASS');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = getenv('SMTP_PORT');
    
    // Debug
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = 'html';
    
    $mail->setFrom(getenv('SMTP_FROM'), getenv('SMTP_FROM_NAME'));
    $mail->addAddress('test@example.com'); // Cambia por tu email real
    
    $mail->isHTML(true);
    $mail->Subject = 'Test Brevo desde Railway';
    $mail->Body    = '<h1>✅ Test Exitoso</h1><p>Este es un email de prueba desde Brevo.</p>';
    
    if ($mail->send()) {
        echo "<p style='color: green;'>✅ Email enviado exitosamente!</p>";
    } else {
        echo "<p style='color: red;'>❌ Error al enviar email</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Exception: " . $e->getMessage() . "</p>";
}
?>