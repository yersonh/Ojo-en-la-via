<?php
require_once '../../config/database.php';

$db = (new Database())->conectar();

// Obtener todos los pasajeros únicos
$pasajeros = $db->query("
  SELECT DISTINCT nombre_pasajero, apellido_pasajero, correo_pasajero 
  FROM vista_detalle_viajes 
  ORDER BY nombre_pasajero
")->fetchAll(PDO::FETCH_ASSOC);

$nombreSeleccionado = $_GET['nombre_pasajero'] ?? '';
$fechaInicio = $_GET['fecha_inicio'] ?? '';
$fechaFin = $_GET['fecha_fin'] ?? '';
$viajes = [];

if ($nombreSeleccionado) {
    list($nombre, $apellido, $correo) = explode('|', $nombreSeleccionado);

    $query = "
        SELECT * FROM vista_detalle_viajes 
        WHERE nombre_pasajero = :nombre 
          AND apellido_pasajero = :apellido 
          AND correo_pasajero = :correo
    ";

    $params = [
        'nombre' => $nombre,
        'apellido' => $apellido,
        'correo' => $correo
    ];

    if (!empty($fechaInicio) && !empty($fechaFin)) {
        $query .= " AND fecha_hora_solicitud BETWEEN :inicio AND :fin";
        $params['inicio'] = $fechaInicio;
        $params['fin'] = $fechaFin;
    } elseif (!empty($fechaInicio)) {
        $query .= " AND fecha_hora_solicitud >= :inicio";
        $params['inicio'] = $fechaInicio;
    } elseif (!empty($fechaFin)) {
        $query .= " AND fecha_hora_solicitud <= :fin";
        $params['fin'] = $fechaFin;
    }

    $query .= " ORDER BY fecha_hora_solicitud DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $viajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Consulta de Viajes por Pasajero</title>
  <style>
    body {
      background-color: #111;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, sans-serif;
      padding: 20px;
    }
    form {
      background-color: #1a1a1a;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    select, input[type="date"], button {
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #444;
      background-color: #222;
      color: #f0f0f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: #1a1a1a;
    }
    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #222;
    }
    .mensaje-vacio {
      text-align: center;
      padding: 16px;
      color: #ccc;
    }
  </style>
</head>
<body>

<h2>Consulta de Viajes por Pasajero</h2>

<form method="GET">
  <label>Pasajero:
    <select name="nombre_pasajero" required>
      <option value="">-- Seleccione --</option>
      <?php foreach ($pasajeros as $p): ?>
        <?php $valor = "{$p['nombre_pasajero']}|{$p['apellido_pasajero']}|{$p['correo_pasajero']}"; ?>
        <option value="<?= htmlspecialchars($valor) ?>" <?= ($valor === $nombreSeleccionado ? 'selected' : '') ?>>
          <?= htmlspecialchars("{$p['nombre_pasajero']} {$p['apellido_pasajero']} - {$p['correo_pasajero']}") ?>
        </option>
      <?php endforeach; ?>
    </select>
  </label>
  <label>Desde:
    <input type="date" name="fecha_inicio" value="<?= htmlspecialchars($fechaInicio) ?>">
  </label>
  <label>Hasta:
    <input type="date" name="fecha_fin" value="<?= htmlspecialchars($fechaFin) ?>">
  </label>
  <button type="submit">Consultar</button>
</form>

<?php if ($viajes): ?>
  <table>
    <thead>
      <tr>
        <th>Fecha Solicitud</th>
        <th>Pasajero</th>
        <th>Apellido</th>
        <th>Origen</th>
        <th>Destino</th>
        <th>Distancia</th>
        <th>Monto</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($viajes as $v): ?>
        <tr>
          <td><?= htmlspecialchars($v['fecha_hora_solicitud']) ?></td>
          <td><?= htmlspecialchars($v['nombre_pasajero']) ?></td>
          <td><?= htmlspecialchars($v['apellido_pasajero']) ?></td>
          <td><?= htmlspecialchars($v['barrio_origen']) ?></td>
          <td><?= htmlspecialchars($v['barrio_destino']) ?></td>
          <td><?= htmlspecialchars($v['distancia_km']) ?> km</td>
          <td>$<?= number_format($v['monto_real'], 2) ?></td>
          <td><?= htmlspecialchars($v['estado']) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php elseif ($_GET && $nombreSeleccionado): ?>
  <p class="mensaje-vacio">No se encontraron viajes para ese pasajero en ese rango de fechas.</p>
<?php endif; ?>

</body>
</html>
