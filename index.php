<?php
session_start();
require_once 'config/database.php';
require_once 'controllers/sesioncontrolador.php';
require_once 'models/persona.php';
require_once 'models/usuario.php';

$database = new Database();
$db = $database->conectar(); // ← Cambiado de connect() a conectar()
$sesionControlador = new SesionControlador($db);

// Manejo del login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
    $correo = trim($_POST['email']);
    $password = $_POST['password'];

    $usuario = $sesionControlador->login($correo, $password);

    if ($usuario) {
        $_SESSION['usuario_id'] = $usuario['id_usuario'];
        $_SESSION['rol'] = $usuario['id_rol'];
        $_SESSION['nombres'] = $usuario['nombres'];
        $_SESSION['correo'] = $usuario['correo'];
        
        header("Location: manage/Inicio.php");
        exit();
    } else {
        $error_message = "Credenciales incorrectas o cuenta inactiva.";
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ojo en la vía</title>
  <link rel="shortcut icon" href="./imagenes/fiveicon.png" type="image/x-icon">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    body {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: url("./imagenes/login3.jpg") no-repeat center center/cover;
    }

    .container {
      width: 80%;
      max-width: 1000px;
      height: 600px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 0 25px rgba(0, 0, 0, 0.6);
    }

    /* Lado izquierdo */
    .left {
      background: rgba(59, 57, 57, 0.5);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
    }

    .left h1 {
      font-size: 40px;
      margin-bottom: 20px;
    }

    .left p {
      margin-bottom: 20px;
      color: #ddd;
      line-height: 1.5;
    }

    .icons i {
      margin: 0 10px;
      cursor: pointer;
      font-size: 20px;
      transition: color 0.3s;
    }

    .icons i:hover {
      color: #1e8ee9;
    }

    /* Lado derecho */
    .right {
      background: rgba(40, 38, 38, 0.1);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
      color: white;
    }

    .right h2 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 28px;
    }

    .input-box {
      position: relative;
      margin-bottom: 25px;
    }

    .input-box input {
      width: 100%;
      padding: 12px 40px;
      border: none;
      border-bottom: 2px solid #fff;
      background: transparent;
      outline: none;
      color: white;
      font-size: 16px;
      transition: border-color 0.3s;
    }

    .input-box input:focus {
      border-bottom-color: #1e8ee9;
    }

    .input-box i {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      color: white;
    }

    .options {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 25px;
      align-items: center;
    }

    .options label {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .options a {
      color: #1e8ee9;
      text-decoration: none;
      transition: color 0.3s;
    }

    .options a:hover {
      text-decoration: underline;
    }

    .btn {
      background: #1e8ee9;
      border: none;
      padding: 12px;
      width: 100%;
      color: white;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
      transition: background 0.3s;
      font-weight: bold;
    }

    .btn:hover {
      background: #1865c2;
    }

    .signup {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
    }
    
    .signup a {
      color: #1e8ee9;
      text-decoration: none;
      font-weight: bold;
      transition: color 0.3s;
    }

    .signup a:hover {
      text-decoration: underline;
    }

    /* Mensaje de error */
    .alert-error {
      background: rgba(255, 68, 68, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 20px;
      text-align: center;
      display: <?php echo isset($error_message) ? 'block' : 'none'; ?>;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
        height: auto;
        margin: 20px;
      }
      
      .left, .right {
        padding: 30px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Lado izquierdo -->
    <div class="left">
      <h1>Bienvenido!</h1>
      <p>Explora nuestra plataforma "Ojo en la vía", donde podrás reportar y consultar el estado de las calles de Villavicencio.</p>
      <div class="icons">
        <i class="fab fa-facebook"></i>
        <i class="fab fa-twitter"></i>
        <i class="fab fa-instagram"></i>
      </div>
    </div>

    <!-- Lado derecho -->
    <div class="right">
      <h2>Iniciar Sesión</h2>
      
      <?php if (isset($error_message)): ?>
        <div class="alert-error"><?php echo $error_message; ?></div>
      <?php endif; ?>

      <form method="POST" action="">
        <div class="input-box">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" name="email" placeholder="Email" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
        </div>
        
        <div class="input-box">
          <i class="fa-solid fa-lock"></i>
          <input type="password" name="password" placeholder="Contraseña" required>
        </div>

        <div class="options">
          <label>
            <input type="checkbox" name="remember"> Recuérdame
          </label>
         <a href="views/manage/olvidecontraseña.php">¿Olvidaste tu contraseña?</a>

        </div>

        <button class="btn" type="submit">Ingresar</button>

        <div class="signup">
          ¿No tienes cuenta? <a href="views/usuarioRegistrar.php">Regístrate</a>
        </div>
      </form>
    </div>
  </div>

  <script>
    // Validación básica del formulario
    document.querySelector('form').addEventListener('submit', function(e) {
      const email = document.querySelector('input[name="email"]').value;
      const password = document.querySelector('input[name="password"]').value;
      
      if (!email || !password) {
        e.preventDefault();
        alert('Por favor, completa todos los campos.');
        return false;
      }
      
      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        e.preventDefault();
        alert('Por favor, ingresa un email válido.');
        return false;
      }
      
      return true;
    });
  </script>
</body>
</html>