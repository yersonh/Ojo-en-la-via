<?php
require_once '../../config/database.php';

$db = (new Database())->conectar();

// Obtener todos los barrios
$stmt = $db->query("SELECT * FROM barrios ORDER BY nombre");
$barrios = $stmt->fetchAll(PDO::FETCH_ASSOC);

$idSeleccionado = $_GET['id_barrios'] ?? null;
$datos = null;

if ($idSeleccionado) {
    $stmt = $db->prepare("SELECT * FROM barrios WHERE id_barrios = ?");
    $stmt->execute([$idSeleccionado]);
    $datos = $stmt->fetch(PDO::FETCH_ASSOC);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestionar Barrios</title>
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
      color: #fff;
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
    }
  </style>
</head>
<body>

<form method="get">
  <h2>Gestionar Barrios</h2>
  <label for="id_barrios">Seleccionar barrio:</label>
  <select name="id_barrios" id="id_barrios" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($barrios as $b): ?>
      <option value="<?= $b['id_barrios'] ?>" <?= ($b['id_barrios'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars($b['nombre']) ?>
      </option>
    <?php endforeach; ?>
  </select>
</form>

<?php if ($datos): ?>
<form method="post" action="../../controllers/BarriosController.php" id="formBarrios">
  <input type="hidden" name="id_barrios" value="<?= $datos['id_barrios'] ?>">

  <label>Nombre:</label>
  <input type="text" name="nombre" value="<?= htmlspecialchars($datos['nombre']) ?>" required>

  <div class="acciones">
    <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
    <button type="submit" name="accion" value="eliminar" class="eliminar">Eliminar</button>
  </div>
  <div id="mensajeGestion" class="mensaje"></div>
</form>
<?php endif; ?>

<a href="../Inicio.php" class="volver">← Volver al inicio</a>

<script>
  const form = document.getElementById('formBarrios');
  const mensaje = document.getElementById('mensajeGestion');
  let accionPresionada = null;

  document.querySelectorAll("#formBarrios button[name='accion']").forEach(boton => {
    boton.addEventListener("click", () => {
      accionPresionada = boton.value;
    });
  });

  form?.addEventListener("submit", async function (e) {
    e.preventDefault();
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
    formData.set("accion", accionPresionada);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: formData
      });

      const text = await res.text();
      mensaje.textContent = text;

      if (text.toLowerCase().includes("error") || text.toLowerCase().includes("❌")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";

        if (accionPresionada === "eliminar") {
          setTimeout(() => location.href = "GestionarBarrios.php", 1200);
        } else {
          setTimeout(() => location.reload(), 1500);
        }
      }
    } catch {
      mensaje.textContent = "❌ Error de comunicación con el servidor.";
      mensaje.className = "mensaje error";
    }
  });
</script>

</body>
</html>
