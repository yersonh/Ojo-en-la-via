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
    }

    .icons i {
      margin: 0 10px;
      cursor: pointer;
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
    }

    .input-box {
      position: relative;
      margin-bottom: 20px;
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
      margin-bottom: 20px;
    }

    .btn {
      background: #1e8ee9ff;
      border: none;
      padding: 12px;
      width: 100%;
      color: white;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
    }

    .btn:hover {
      background: #1865c2ff;
    }

    .signup {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
    }
    .signup a {
      color: #1e76e9ff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Lado izquierdo -->
    <div class="left">
      <h1>Bienvenido!</h1>
      <p>Explora nuestra plataforma "Ojo en la vía",donde podrás reportar y consultar el estado de las calles de Villavicencio.</p>
      <div class="icons">
        <i class="fab fa-facebook"></i>
        <i class="fab fa-twitter"></i>
        <i class="fab fa-instagram"></i>
      </div>
    </div>

    <!-- Lado derecho -->
    <div class="right">
      <h2>Iniciar Sesión</h2>
      <form>
        <div class="input-box">
          <i class="fa-solid fa-envelope"></i>
          <input type="email" placeholder="Email" required>
        </div>
        <div class="input-box">
          <i class="fa-solid fa-lock"></i>
          <input type="password" placeholder="Contraseña" required>
        </div>

        <div class="options">
          <label><input type="checkbox"> Recuérdame</label>
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>

        <button class="btn" type="submit">Ingresar</button>

        <div class="signup">
          ¿No tienes cuenta? <a href="#">Regístrate</a>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
