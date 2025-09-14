<?php
require_once '../../config/database.php';
require_once '../../models/Tarifas.php';
require_once '../../models/Barrios.php';

$db = (new Database())->conectar();
$tarifaModel = new Tarifas($db);
$barrioModel = new Barrios($db);

$tarifas = $tarifaModel->obtenerTodas();
$barrios = $barrioModel->obtenerTodos();

$idSeleccionado = $_GET['id_tarifas'] ?? null;
$datos = null;

if ($idSeleccionado) {
    $datos = $tarifaModel->obtenerPorId($idSeleccionado);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestionar Tarifas</title>
  <style>
    body {
      background-color: #111;
      color: #e0e0e0;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    form {
      background-color: #1a1a1a;
      padding: 24px 32px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(255,255,255,0.05);
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
    select, input {
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
      font-weight: bold;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .actualizar { background-color: #333; color: #fff; }
    .eliminar { background-color: #660000; color: #fff; }
    .mensaje {
      margin-top: 12px;
      text-align: center;
      font-weight: bold;
    }
    .mensaje.exito { color: #66ffcc; }
    .mensaje.error { color: #ff4c4c; }
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
      padding: 10px 0;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
      text-decoration: none;
    }
    .volver:hover {
      background-color: #333;
      color: #fff;
    }
  </style>
</head>
<body>

<form method="get">
  <h2>Gestionar Tarifas</h2>
  <label for="id_tarifas">Seleccionar tarifa:</label>
  <select name="id_tarifas" id="id_tarifas" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($tarifas as $t): ?>
        <option value="<?= $t['id_tarifas'] ?>" <?= ($t['id_tarifas'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars($t['origen'] . ' → ' . $t['destino']) ?>
        </option>
    <?php endforeach; ?>
  </select>
</form>

<?php if ($datos): ?>
<form method="post" action="../../controllers/TarifasControllerRegistrar.php" id="formTarifa">
  <input type="hidden" name="id_tarifas" value="<?= htmlspecialchars($datos['id_tarifas']) ?>">

  <label>Barrio de Origen:</label>
  <select name="id_origen" required>
    <option value="">-- Seleccione --</option>
    <?php foreach ($barrios as $b): ?>
      <option value="<?= $b['id_barrios'] ?>" <?= $b['id_barrios'] == $datos['id_origen'] ? 'selected' : '' ?>>
        <?= htmlspecialchars($b['nombre']) ?>
      </option>
    <?php endforeach; ?>
  </select>

  <label>Barrio de Destino:</label>
  <select name="id_destino" required>
    <option value="">-- Seleccione --</option>
    <?php foreach ($barrios as $b): ?>
      <option value="<?= $b['id_barrios'] ?>" <?= $b['id_barrios'] == $datos['id_destino'] ? 'selected' : '' ?>>
        <?= htmlspecialchars($b['nombre']) ?>
      </option>
    <?php endforeach; ?>
  </select>

  <label>Distancia (km):</label>
  <input type="number" step="any" name="distancia" value="<?= htmlspecialchars($datos['distancia (km)']) ?>" required>

  <label>Precio ($):</label>
  <input type="number" step="any" name="precio" value="<?= htmlspecialchars($datos['precio']) ?>" required>

  <div class="acciones">
    <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
    <button type="submit" name="accion" value="eliminar" class="eliminar">Eliminar</button>
  </div>

  <div id="mensajeTarifa" class="mensaje"></div>
</form>
<?php endif; ?>


<script>
  const form = document.getElementById('formTarifa');
  const mensaje = document.getElementById('mensajeTarifa');
  let accionPresionada = null;

  document.querySelectorAll("#formTarifa button[name='accion']").forEach(btn => {
    btn.addEventListener("click", () => {
      accionPresionada = btn.value;
    });
  });

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (accionPresionada === "eliminar" && !confirm("¿Seguro que deseas eliminar esta tarifa?")) {
      mensaje.textContent = "Eliminación cancelada.";
      mensaje.className = "mensaje error";
      return;
    }

    mensaje.textContent = "Procesando...";
    mensaje.className = "mensaje";

    const formData = new FormData(form);
    if (accionPresionada) formData.set("accion", accionPresionada);

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const text = await res.text();
      mensaje.textContent = text;

      if (text.toLowerCase().includes("error") || text.includes("❌")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";
        if (accionPresionada === "eliminar") {
          setTimeout(() => location.href = "GestionarTarifas.php", 1500);
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

<a href="../Inicio.php" class="volver">← Volver al inicio</a>

</body>
</html>
