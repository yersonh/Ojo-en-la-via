<?php
require_once '../../config/database.php';
$db = (new Database())->conectar();

$stmt = $db->query("SELECT * FROM metodo_pago ORDER BY nombre");
$metodos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$idSeleccionado = $_GET['id_metodopago'] ?? null;
$datos = null;

if ($idSeleccionado) {
    $stmt = $db->prepare("SELECT * FROM metodo_pago WHERE id_metodopago = ?");
    $stmt->execute([$idSeleccionado]);
    $datos = $stmt->fetch(PDO::FETCH_ASSOC);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Gestionar Métodos de Pago</title>
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
      width: 350px;
      margin-top: 20px;
    }
    .titulo-formulario {
        text-align: center;
        color:rgb(255, 255, 255);
        font-size: 1.4rem;
        margin-bottom: 20px;
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
    button {
      padding: 10px;
      font-weight: bold;
      border: none;
      cursor: pointer;
      border-radius: 6px;
      flex: 1;
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
    .acciones {
      display: flex;
      gap: 10px;
    }
    .actualizar { background-color: #333; color: #fff; }
    .actualizar:hover { background-color: #444; }
    .eliminar { background-color: #660000; color: #fff; }
    .eliminar:hover { background-color: #990000; }
    .mensaje { margin-top: 12px; text-align: center; font-weight: bold; }
    .mensaje.error { color: #ff4c4c; }
    .mensaje.exito { color: #66ffcc; }
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
<h2>Gestionar Métodos de Pago</h2>
  <label for="id_metodopago">Seleccionar método:</label>
  <select name="id_metodopago" id="id_metodopago" onchange="this.form.submit()">
    <option value="">-- Seleccione --</option>
    <?php foreach ($metodos as $m): ?>
      <option value="<?= $m['id_metodopago'] ?>" <?= ($m['id_metodopago'] == $idSeleccionado ? 'selected' : '') ?>>
        <?= htmlspecialchars($m['nombre']) ?>
      </option>
    <?php endforeach; ?>
  </select>
</form>

<?php if ($datos): ?>
<form method="post" action="../../controllers/MetodoPagoController.php" id="formPago">
  <input type="hidden" name="id_metodopago" value="<?= htmlspecialchars($datos['id_metodopago']) ?>">
  <label>Nombre del método:</label>
  <input type="text" name="nombre" value="<?= htmlspecialchars($datos['nombre']) ?>" required>

  <div class="acciones">
    <button type="submit" name="accion" value="actualizar" class="actualizar">Actualizar</button>
    <button type="submit" name="accion" value="eliminar" class="eliminar" onclick="return confirm('¿Eliminar este método de pago?')">Eliminar</button>
  </div>
  <div id="mensaje" class="mensaje"></div>
</form>
<?php endif; ?>

<script>
  const form = document.getElementById('formPago');
  const mensaje = document.getElementById('mensaje');
  let accionPresionada = null;

  document.querySelectorAll("button[name='accion']").forEach(boton => {
    boton.addEventListener("click", () => {
      accionPresionada = boton.value;
    });
  });

  form?.addEventListener("submit", async e => {
    e.preventDefault();
    mensaje.textContent = "Procesando...";
    mensaje.className = "mensaje";

    const formData = new FormData(form);
    if (accionPresionada) {
      formData.set("accion", accionPresionada);
    }

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: formData
      });
      const text = await res.text();
      mensaje.textContent = text;

      if (text.includes("❌") || text.toLowerCase().includes("error")) {
        mensaje.className = "mensaje error";
      } else {
        mensaje.className = "mensaje exito";
        if (accionPresionada === "eliminar") {
          setTimeout(() => location.href = "GestionarMetodosPago.php", 1500);
        } else {
          setTimeout(() => location.reload(), 1500);
        }
      }
    } catch {
      mensaje.textContent = "❌ Error de red.";
      mensaje.className = "mensaje error";
    }
  });
</script>

<a class="volver" href="../Inicio.php">← Volver al inicio</a>

</body>
</html>
