<?php
require_once '../../config/database.php';
require_once '../../models/Estado.php';

$db = (new Database())->conectar();
$estadoModel = new Estado($db);

$estados = $estadoModel->obtenerTodos();
$idSeleccionado = $_GET['id_estado'] ?? null;
$datos = null;

if ($idSeleccionado) {
    $datos = $estadoModel->obtenerPorId($idSeleccionado);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestionar Estados</title>
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
    h2 {
      text-align: center;
      color: #fff;
    }
    label {
      display: block;
      margin-bottom: 6px;
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
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
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
    body::before {
      content: "";
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-image: url("../../public/mapa.png");
      background-size: cover;
      background-position: center;
      filter: brightness(0.4);
      z-index: -1;
    }
    .volver {
      background-color: #222;
      color: #ddd;
      border: 1px solid #444;
      width: 320px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
    }
    .volver:hover {
      background-color: #333;
      color: #fff;
    }
  </style>
</head>
<body>

<form method="get">
  <h2>Gestionar Estados</h2>
  <label for="id_estado">Seleccionar estado:</label>
  <select name="id_estado" id="id_estado" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($estados as $e): ?>
      <option value="<?= $e['id_estado'] ?>" <?= ($e['id_estado'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars($e['nombre']) ?>
      </option>
    <?php endforeach; ?>
  </select>
</form>
<?php if ($datos): ?>
<form method="post" action="../../controllers/EstadoController.php" id="formEstado">
  <?php if ($datos): ?>
    <input type="hidden" name="id_estado" value="<?= htmlspecialchars($datos['id_estado']) ?>">
    <label>Nombre del estado:</label>
    <input type="text" name="nombre" value="<?= htmlspecialchars($datos['nombre']) ?>" required>
    <div class="acciones">
      <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
      <button type="submit" name="accion" value="eliminar" class="eliminar">Eliminar</button>
    </div>
  <?php else: ?>
    <label>Nombre del nuevo estado:</label>
    <input type="text" name="nombre" placeholder="Ej: Finalizado" required>
    <div class="acciones">
      <button type="submit" name="accion" value="registrar" class="actualizar">Registrar</button>
    </div>
  <?php endif; ?>
  <div id="mensajeEstado" class="mensaje"></div>
</form>
<?php endif; ?>
<script>
  const form = document.getElementById('formEstado');
  const mensaje = document.getElementById('mensajeEstado');
  let accionPresionada = null;

  document.querySelectorAll("#formEstado button[name='accion']").forEach(btn => {
    btn.addEventListener("click", () => {
      accionPresionada = btn.value;
    });
  });

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (accionPresionada === "eliminar" && !confirm("¿Seguro que deseas eliminar este estado?")) {
      mensaje.textContent = "Eliminación cancelada.";
      mensaje.className = "mensaje error";
      return;
    }

    mensaje.textContent = "Procesando...";
    mensaje.className = "mensaje";

    const formData = new FormData(form);
    if (accionPresionada) formData.set("accion", accionPresionada);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData
      });

      const text = await response.text();
      mensaje.textContent = text;

      if (text.toLowerCase().includes("error") || text.includes("❌")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";

        if (accionPresionada === "eliminar") {
          setTimeout(() => location.href = "GestionarEstado.php", 1500);
        } else {
          setTimeout(() => location.reload(), 1500);
        }
      }
    } catch (err) {
      mensaje.textContent = "❌ Error de comunicación con el servidor.";
      mensaje.className = "mensaje error";
    }
  });
</script>

<a href="Inicio.php" class="volver">Volver al Inicio</a>
</body>
</html>
