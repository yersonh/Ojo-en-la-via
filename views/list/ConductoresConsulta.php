<?php
require_once '../../config/database.php';

$db = (new Database())->conectar();

// Obtener lista de conductores distintos
$conductores = $db->query("
    SELECT DISTINCT c.nombre, c.apellido, c.correo
    FROM conductores c
    JOIN acepta a ON c.id_conductores = a.id_conductores
    ORDER BY c.nombre
")->fetchAll(PDO::FETCH_ASSOC);

$seleccion = $_GET['conductor'] ?? '';
$fechaInicio = $_GET['fecha_inicio'] ?? '';
$fechaFin = $_GET['fecha_fin'] ?? '';
$viajes = [];

if ($seleccion) {
    [$nombre, $apellido, $correo] = explode('|', $seleccion);

    $query = "
        SELECT * FROM vista_conductor_viaje
        WHERE nombre_conductor = :nombre
          AND apellido_conductor = :apellido
          AND correo_conductor = :correo
    ";

    $params = [
        'nombre' => $nombre,
        'apellido' => $apellido,
        'correo' => $correo
    ];

    if ($fechaInicio && $fechaFin) {
        $query .= " AND fecha_hora_aceptada BETWEEN :inicio AND :fin";
        $params['inicio'] = $fechaInicio;
        $params['fin'] = $fechaFin;
    } elseif ($fechaInicio) {
        $query .= " AND fecha_hora_aceptada >= :inicio";
        $params['inicio'] = $fechaInicio;
    } elseif ($fechaFin) {
        $query .= " AND fecha_hora_aceptada <= :fin";
        $params['fin'] = $fechaFin;
    }

    $query .= " ORDER BY fecha_hora_aceptada DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $viajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Consulta de Viajes por Conductor</title>
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
  </style>
</head>
<body>

<h2>Consulta de Viajes por Conductor</h2>

<form method="GET">
  <label>Conductor:
    <select name="conductor" required>
      <option value="">-- Seleccione --</option>
      <?php foreach ($conductores as $c): ?>
        <?php $valor = "{$c['nombre']}|{$c['apellido']}|{$c['correo']}"; ?>
        <option value="<?= htmlspecialchars($valor) ?>" <?= ($valor === $seleccion ? 'selected' : '') ?>>
          <?= htmlspecialchars("{$c['nombre']} {$c['apellido']} - {$c['correo']}") ?>
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
        <th>Fecha Aceptada</th>
        <th>Nombre</th>
        <th>Apellido</th>
        <th>Correo</th>
        <th>Placa</th>
        <th>Tipo</th>
        <th>Modelo</th>
        <th>Color</th>
        <th>Tiempo Espera</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($viajes as $v): ?>
        <tr>
          <td><?= htmlspecialchars($v['fecha_hora_aceptada']) ?></td>
          <td><?= htmlspecialchars($v['nombre_conductor']) ?></td>
          <td><?= htmlspecialchars($v['apellido_conductor']) ?></td>
          <td><?= htmlspecialchars($v['correo_conductor']) ?></td>
          <td><?= htmlspecialchars($v['placa_vehiculo']) ?></td>
          <td><?= htmlspecialchars($v['tipo_vehiculo']) ?></td>
          <td><?= htmlspecialchars($v['modelo_vehiculo']) ?></td>
          <td><?= htmlspecialchars($v['color_vehiculo']) ?></td>
          <td><?= htmlspecialchars($v['tiempo_espera']) ?> min</td>
          <td><?= htmlspecialchars($v['estado_viaje']) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php elseif ($_GET): ?>
  <p>No se encontraron viajes para ese conductor en ese rango de fechas.</p>
<?php endif; ?>

</body>
</html>
