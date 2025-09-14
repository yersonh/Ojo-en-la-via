<?php
require_once '../../config/database.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$db = (new Database())->conectar();

// Obtener todos los viajes (vista_detalle_viajes)
$sqlViajes = "SELECT * FROM vista_detalle_viajes ORDER BY estado, nombre_pasajero";
$stmtViajes = $db->prepare($sqlViajes);
$stmtViajes->execute();
$viajes = $stmtViajes->fetchAll(PDO::FETCH_ASSOC);

// Obtener todos los conductores aceptados para viajes (vista_conductor_viaje)
$sqlConductores = "SELECT * FROM vista_conductor_viaje";
$stmtConductores = $db->prepare($sqlConductores);
$stmtConductores->execute();
$conductores = $stmtConductores->fetchAll(PDO::FETCH_ASSOC);

// Indexar conductores por id_viajes para acceso rápido
$conductoresPorViaje = [];
foreach ($conductores as $conductor) {
    $conductoresPorViaje[$conductor['id_viajes']] = $conductor;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Listado de Viajes y Conductores</title>
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
  .vacío {
    font-style: italic;
    color: #888;
  }
</style>
</head>
<body>

<h1>Listado de Viajes con Conductores</h1>

<table>
  <caption></caption>
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <a href="PasajerosConsulta.php" 
       style="background-color: #222; color: #ccc; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; border: 1px solid #444;">
       Realizar Consulta De Pasajeros
    </a>

    <span style="font-size: 1.5rem; font-weight: 700; color: #66ffcc;">Viajes y Conductores Asignados</span>

    <a href="ConductoresConsulta.php" 
       style="background-color: #222; color: #ccc; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 500; border: 1px solid #444;">
       Realizar Consulta De Conductores
    </a>
  </div>
  <thead>
    <tr>
      <th>Nombre Pasajero</th>
      <th>Apellido Pasajero</th>
      <th>Origen</th>
      <th>Destino</th>
      <th>Distancia (km)</th>
      <th>Monto</th>
      <th>Tipo Vehículo</th>
      <th>Estado</th>
      <th>Método Pago</th>


      <th>Nombre Conductor</th>
      <th>Apellido Conductor</th>
      <th>Placa</th>
      <th>Tipo Vehículo</th>
      <th>Modelo</th>
      <th>Color</th>
      <th>Tiempo Espera (min)</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($viajes as $viaje):
        $idViaje = $viaje['id_viajes'] ?? null;
        $conductor = $conductoresPorViaje[$idViaje] ?? null;
    ?>
    <tr>
      <td><?= htmlspecialchars($viaje['nombre_pasajero']) ?></td>
      <td><?= htmlspecialchars($viaje['apellido_pasajero']) ?></td>
      <td><?= htmlspecialchars($viaje['barrio_origen']) ?></td>
      <td><?= htmlspecialchars($viaje['barrio_destino']) ?></td>
      <td><?= htmlspecialchars($viaje['distancia_km']) ?></td>
      <td>$<?= number_format($viaje['monto_real'], 2) ?></td>
      <td><?= htmlspecialchars(ucfirst($viaje['tipo_vehiculo'])) ?></td>
      <td><?= htmlspecialchars($viaje['estado']) ?></td>
      <td><?= htmlspecialchars($viaje['metodo_pago']) ?></td>


      <?php if ($conductor): ?>
        <td><?= htmlspecialchars($conductor['nombre_conductor']) ?></td>
        <td><?= htmlspecialchars($conductor['apellido_conductor']) ?></td>
        <td><?= htmlspecialchars($conductor['placa_vehiculo']) ?></td>
        <td><?= htmlspecialchars(ucfirst($conductor['tipo_vehiculo'])) ?></td>
        <td><?= htmlspecialchars($conductor['modelo_vehiculo']) ?></td>
        <td><?= htmlspecialchars($conductor['color_vehiculo']) ?></td>
        <td><?= htmlspecialchars($conductor['tiempo_espera']) ?></td>
      <?php else: ?>
        <td colspan="7" class="vacío">No asignado</td>
      <?php endif; ?>
    </tr>
    <?php endforeach; ?>
  </tbody>
</table>

</body>
</html>
