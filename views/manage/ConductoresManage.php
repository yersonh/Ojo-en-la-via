<?php
require_once '../../config/database.php';
require_once '../../models/Conductores.php';
require_once '../../models/Vehiculos.php';
require_once '../../models/Maneja.php';

$db = (new Database())->conectar();

$conductorModel = new Conductores($db);
$vehiculoModel = new Vehiculos($db);
$manejaModel = new Maneja($db);

$conductores = $conductorModel->obtenerTodos();
$datosConductor = null;
$idSeleccionado = $_GET['id_conductor'] ?? null;
$vehiculoAsignado = [];

if ($idSeleccionado) {
    $stmt = $db->prepare("SELECT * FROM conductores WHERE id_conductores = ?");
    $stmt->execute([$idSeleccionado]);
    $datosConductor = $stmt->fetch(PDO::FETCH_ASSOC);

    $vehiculoAsignado = $vehiculoModel->obtenerPorConductor($idSeleccionado);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Modificar o Eliminar Conductor</title>
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
    .actualizar {
      background-color: #333;
      color: #fff;
    }
    .actualizar:hover {
      background-color: #444;
    }
    .eliminar {
      background-color: #660000;
      color: #fff;
    }
    .eliminar:hover {
      background-color: #990000;
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
<h2>Modificar o Eliminar Conductor</h2>
  <label for="id_conductor">Seleccionar conductor:</label>
  <select name="id_conductor" id="id_conductor" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($conductores as $c): ?>
      <option value="<?= $c['id_conductores'] ?>" <?= ($c['id_conductores'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars("{$c['nombre']} {$c['apellido']}" . ' - ' . $c['correo']) ?>
      </option>
    <?php endforeach; ?>
  </select>
</form>

<?php if ($datosConductor): ?>
<form method="post" action="../../controllers/ConductoresController.php" id="formGestionar">
  <input type="hidden" name="id_conductor" value="<?= htmlspecialchars($datosConductor['id_conductores']) ?>">

  <label>Nombre:</label>
  <input type="text" name="nombre" value="<?= htmlspecialchars($datosConductor['nombre']) ?>" required>

  <label>Apellido:</label>
  <input type="text" name="apellido" value="<?= htmlspecialchars($datosConductor['apellido']) ?>" required>

  <label>Correo:</label>
  <input type="email" name="correo" value="<?= htmlspecialchars($datosConductor['correo']) ?>" required>

  <label>Teléfono:</label>
  <input type="text" name="telefono" value="<?= htmlspecialchars($datosConductor['telefono']) ?>" required>

  <div class="acciones">
    <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
    <button type="submit" name="accion" value="eliminar" class="eliminar" >Eliminar</button>
  </div>
  <div id="mensajeGestion" class="mensaje"></div>
</form>
<?php endif; ?>

<a class="volver" href="../Inicio.php">← Volver al inicio</a>

<script>
  const form = document.getElementById('formGestionar');
  const mensaje = document.getElementById('mensajeGestion');
  let accionPresionada = null;

  // Detectar qué botón fue presionado
  document.querySelectorAll("#formGestionar button[name='accion']").forEach(boton => {
    boton.addEventListener("click", () => {
      accionPresionada = boton.value;
    });
  });

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Confirmación controlada SOLO una vez y dentro del flujo
    if (accionPresionada === "eliminar") {
      const confirmar = confirm("¿Seguro que deseas eliminar este conductor?");
      if (!confirmar) {
        mensaje.textContent = "Eliminación cancelada.";
        mensaje.className = "mensaje error";
        return;
      }
    }

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

      if (text.toLowerCase().includes("error") || text.toLowerCase().includes("fallo") || text.includes("❌")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";

        if (accionPresionada === "actualizar") {
          setTimeout(() => location.reload(), 2000);
        } else if (accionPresionada === "eliminar") {
          setTimeout(() => {
            const idEliminado = form.elements["id_conductor"].value;

            // Eliminar opción del select
            const select = document.getElementById('id_conductor');
            const opcion = select.querySelector(`option[value='${idEliminado}']`);
            if (opcion) opcion.remove();

            // Reiniciar selección y ocultar formulario
            select.value = "";
            form.remove();
            mensaje.textContent = "Conductor eliminado correctamente.";
            mensaje.className = "mensaje exito";

            history.replaceState(null, "", "GestionarConductores.php");
          }, 1000);
        }
      }
    } catch (err) {
      mensaje.textContent = "Error de comunicación con el servidor.";
      mensaje.className = "mensaje error";
    }
  });
</script>



</body>
</html>
