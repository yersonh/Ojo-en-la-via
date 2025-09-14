<?php
require_once '../../config/database.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$db = (new Database())->conectar();

$sql = "SELECT * FROM vista_tarifas_detalle ORDER BY id_tarifas";
$stmt = $db->prepare($sql);
$stmt->execute();
$registros = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Listado de Tarifas</title>
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #111;
    color: #e0e0e0;
    margin: 20px;
  }
  h1 {
    text-align: center;
    margin-bottom: 30px;
  }
  table {
    border-collapse: collapse;
    background-color: #1a1a1a;
    border-radius: 8px;
    box-shadow: 0 0 12px rgba(255,255,255,0.1);
    width: 100%;
    max-width: 100%;
    font-size: 0.9rem;
  }
  th, td {
    border: 1px solid #333;
    padding: 8px 10px;
    text-align: left;
  }
  th {
    background-color: #222;
    font-weight: 600;
  }
  tr:hover {
    background-color: #333;
  }
  caption {
    font-size: 1.5rem;
    font-weight: 700;
    padding: 10px;
    color: #66ffcc;
  }
</style>
</head>
<body>

<h1>Listado de Tarifas</h1>

<table>
  <caption>Vista Detallada de Tarifas</caption>
  <thead>
    <tr>
      <th>id_tarifas</th>
      <th>barrio_origen</th>
      <th>barrio_destino</th>
      <th>precio</th>
      <th>distancia_km</th>
    </tr>
  </thead>
  <tbody>
<?php foreach ($registros as $registro): ?>
    <tr>
      <td><?= htmlspecialchars($registro['id_tarifas']) ?></td>
      <td><?= htmlspecialchars($registro['barrio_origen']) ?></td>
      <td><?= htmlspecialchars($registro['barrio_destino']) ?></td>
      <td><?= htmlspecialchars($registro['precio']) ?></td>
      <td><?= htmlspecialchars($registro['distancia_km']) ?></td>
    </tr>
<?php endforeach; ?>
  </tbody>
</table>

</body>
</html>
