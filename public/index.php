<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Panel de Control UBER APP</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #111; /* fondo oscuro */
      color: #e0e0e0; /* texto gris claro */
    }

    .container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    nav {
      width: 250px;
      background-color: #121212;
      border-right: 1px solid #2a2a2a;
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
    }

    nav h3 {
      color: #e0e0e0;
      border-bottom: 1px solid #444;
      padding-bottom: 6px;
      margin-top: 30px;
      font-size: 1rem;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    nav h3:first-child {
      margin-top: 0;
    }

    nav a {
      display: block;
      color: #ccc;
      text-decoration: none;
      margin: 10px 0;
      font-weight: 500;
      font-size: 0.95rem;
      padding: 6px 4px;
      border-radius: 4px;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    nav a:hover {
      background-color: #1f1f1f;
      color: #ffffff;
    }

    main {
      flex-grow: 1;
      background-color: #181818;
      padding: 0;
      box-sizing: border-box;
      overflow-y: auto;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <h3>Registrar</h3>
      <a href="../views/PasajerosFormulario.php" target="contentFrame">Registrar Pasajero</a>
      <a href="../views/ConductoresFormulario.php" target="contentFrame">Registrar Conductor y Vehículo</a>
      <a href="../views/BarriosFormulario.php" target="contentFrame">Registrar Barrio</a>
      <a href="../views/TarifasFormularioRegistrar.php" target="contentFrame">Registrar Tarifa</a>
      <a href="../views/MetodoPagoFormulario.php" target="contentFrame">Registrar Método de Pago</a>
      <a href="../views/EstadoFormulario.php" target="contentFrame">Registrar Estado</a>

      <h3>Visualizar</h3>
      <a href="../views/list/ViajesList.php" target="contentFrame">Visualizar Viajes</a>
      <a href="../views/list/TarifasList.php" target="contentFrame">Visualizar Tarifas</a>
      <a href="../views/list/BaseDatos.php" target="contentFrame">Visualizar Base de Datos</a>

      <h3>Gestionar</h3>
      <a href="../views/manage/PasajerosManage.php" target="contentFrame">Gestionar Pasajero</a>
      <a href="../views/manage/ConductoresManage.php" target="contentFrame">Gestionar Conductor</a>
      <a href="../views/manage/VehiculosManage.php" target="contentFrame">Gestionar Vehículo</a>
      <a href="../views/manage/BarriosManage.php" target="contentFrame">Gestionar Barrios</a>
      <a href="../views/manage/TarifaManage.php" target="contentFrame">Gestionar Tarifas</a>
      <a href="../views/manage/MetodoPagoManage.php" target="contentFrame">Gestionar Metodos de pago</a>
      <a href="../views/manage/EstadoManage.php" target="contentFrame">Gestionar Estados</a>


    </nav>
    <main>
      <iframe src="../views/Inicio.php" name="contentFrame" title="Contenido"></iframe>
    </main>
  </div>
</body>
</html>
