<?php
require_once '../../config/database.php';
require_once '../../models/Vehiculos.php';

$db = (new Database())->conectar();
$vehiculoModel = new Vehiculos($db);

$vehiculos = $vehiculoModel->obtenerTodos();
$idSeleccionado = $_GET['id_vehiculo'] ?? null;
$datos = null;

if ($idSeleccionado) {
    $datos = $vehiculoModel->obtenerPorId($idSeleccionado);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestionar Vehículos</title>
  <style>
    body {
      background-color: #111;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    form {
      background-color: #1a1a1a;
      padding: 24px 32px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
      width: 400px;
      margin-top: 20px;
    }
    .titulo-formulario {
        text-align: center;
        color:rgb(255, 255, 255);
        font-size: 1.4rem;
        margin-bottom: 20px;
    }

    h2 {
      color:rgb(255, 255, 255);
      text-align: center;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #ccc;
    }
    input, select {
      width: 100%;
      padding: 10px;
      margin-bottom: 16px;
      background-color: #111;
      color: #f0f0f0;
      border: 1px solid #444;
      border-radius: 6px;
    }
    .acciones {
      display: flex;
      gap: 10px;
    }
    button {
      padding: 10px;
      font-weight: bold;
      border: none;
      cursor: pointer;
      border-radius: 6px;
      flex: 1;
      transition: 0.3s;
    }
    .actualizar {
      background-color: #333;
      color: #fff;
    }
    .eliminar {
      background-color: #660000;
      color: #fff;
    }
    .mensaje {
      margin-top: 12px;
      text-align: center;
      font-weight: bold;
    }
    .mensaje.error {
      color: #ff4c4c;
    }
    .mensaje.exito {
      color: #66ffcc;
    }
    .volver {
    margin-top: 15px;
    display: inline-block;
    color: #aaa;
    text-decoration: none;
    font-size: 0.9rem;
    text-align: center;
  }
  .volver:hover {
    color: #fff;
  }
    body::before {
            content: "";
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image: url("../../public/mapa.png"); /* Imagen tipo Google Maps oscura */
            background-size: cover;
            background-position: center;
            filter: brightness(0.4); /* Oscurecer el mapa */
            z-index: -1;
        }
        .volver {
      background-color: #222;
      color: #ddd;
      border: 1px solid #444;
      margin-top: 10px;
      width: 320px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      border-radius: 6px;
      font-weight: 500;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .volver:hover {
      background-color: #333;
      color: #fff;
      text-decoration: none;
    }
  </style>
</head>
<body>


<form method="get">
<h2>Gestionar Vehículos</h2>
  <label for="id_vehiculo">Seleccionar vehículo:</label>
  <select name="id_vehiculo" id="id_vehiculo" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($vehiculos as $v): ?>
      <option value="<?= $v['id_vehiculos'] ?>" <?= ($v['id_vehiculos'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars($v['placa'] . ' - ' . $v['tipo']) ?>
      </option>
    <?php endforeach; ?>
  </select>
</form>

<?php if ($datos): ?>
<form method="post" action="../../controllers/VehiculosController.php" id="formGestionarVehiculo">
  <input type="hidden" name="id_vehiculo" value="<?= htmlspecialchars($datos['id_vehiculos']) ?>">

  <label>Placa:</label>
  <input type="text" name="placa" value="<?= htmlspecialchars($datos['placa']) ?>" required>

  <label>Marca:</label>
  <input type="text" name="marca" value="<?= htmlspecialchars($datos['marca']) ?>" required>

  <label>Modelo:</label>
  <input type="text" name="modelo" value="<?= htmlspecialchars($datos['modelo']) ?>" required>

  <label>Color:</label>
  <input type="text" name="color" value="<?= htmlspecialchars($datos['color']) ?>" required>

  <label>Tipo:</label>
  <select name="tipo" required>
    <option value="">-- Seleccione --</option>
    <option value="Carro" <?= $datos['tipo'] == 'Carro' ? 'selected' : '' ?>>Carro</option>
    <option value="Moto" <?= $datos['tipo'] == 'Moto' ? 'selected' : '' ?>>Moto</option>
  </select>

  <div class="acciones">
    <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
    <button type="submit" name="accion" value="eliminar" class="eliminar" onclick="return confirm('¿Seguro que deseas eliminar este vehículo?')">Eliminar</button>
  </div>

  <div id="mensajeGestion" class="mensaje"></div>
</form>
<?php endif; ?>
<a class="volver" href="../Inicio.php">← Volver al inicio</a>

<script>
  const form = document.getElementById('formGestionarVehiculo');
  const mensaje = document.getElementById('mensajeGestion');
  let accionPresionada = null;

  document.querySelectorAll("#formGestionarVehiculo button[name='accion']").forEach(boton => {
    boton.addEventListener("click", () => {
      accionPresionada = boton.value;
    });
  });

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();
    mensaje.textContent = "Procesando...";
    mensaje.className = "mensaje";

    const formData = new FormData(form);
    if (accionPresionada) {
      formData.set("accion", accionPresionada);
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData
      });
      const text = await response.text();
      mensaje.textContent = text;

      if (text.toLowerCase().includes("error") || text.toLowerCase().includes("❌")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";

        if (accionPresionada === "eliminar") {
          setTimeout(() => {
            const select = document.getElementById('id_vehiculo');
            const idEliminado = form.elements["id_vehiculo"].value;
            const opcion = select.querySelector(`option[value='${idEliminado}']`);
            if (opcion) opcion.remove();
            select.value = "";
            form.remove();
            history.replaceState(null, "", "GestionarVehiculos.php");
          }, 1200);
        }

        if (accionPresionada === "actualizar") {
          setTimeout(() => location.reload(), 1500);
        }
      }
    } catch (err) {
      mensaje.textContent = "❌ Error de comunicación con el servidor.";
      mensaje.className = "mensaje error";
    }
  });
</script>

</body>
</html>
