<?php
require_once '../../config/database.php';

$tabla = $_GET['tabla'] ?? '';
if (!$tabla) {
    echo "⚠️ Tabla no especificada.";
    exit;
}

$db = (new Database())->conectar();

// Verificar que la tabla existe y es una tabla real
$check = $db->prepare("
    SELECT COUNT(*) 
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = :tabla
");
$check->execute(['tabla' => $tabla]);

if ($check->fetchColumn() == 0) {
    echo "⚠️ Tabla no válida o no existe.";
    exit;
}

// Obtener los datos
$sql = "SELECT * FROM \"$tabla\" ORDER BY 1 LIMIT 100"; // LIMIT para evitar tablas muy grandes
$stmt = $db->query($sql);
$datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
$columnas = array_keys($datos[0] ?? []);
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Tabla: <?= htmlspecialchars($tabla) ?></title>
<style>   
  body {
    background-color: #111;
    color: #e0e0e0;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    margin: 20px;
  }
  h1 {
    text-align: center;
    color: #f5f5f5;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    background-color: #1a1a1a;
    color: #f0f0f0;
    font-size: 0.9rem;
    margin-top: 20px;
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
    background-color: #2a2a2a;
  }
  .volver {
    display: inline-block;
    margin-top: 20px;
    text-decoration: none;
    color: #ccc;
    background-color: #222;
    padding: 10px 15px;
    border-radius: 5px;
    border: 1px solid #333;
    transition: background 0.3s;
  }
  .volver:hover {
    background-color: #333;
    color: #fff;
  }
</style>
</head>
<body>

<h1>Contenido de la tabla: <?= htmlspecialchars($tabla) ?></h1>

<?php if (count($columnas) === 0): ?>
    <p>No hay datos en esta tabla.</p>
<?php else: ?>
<table>
  <thead>
    <tr>
      <?php foreach ($columnas as $col): ?>
        <th><?= htmlspecialchars($col) ?></th>
      <?php endforeach; ?>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($datos as $fila): ?>
      <tr>
        <?php foreach ($fila as $valor): ?>
          <td><?= htmlspecialchars($valor) ?></td>
        <?php endforeach; ?>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php endif; ?>

<a href="BaseDatos.php" class="volver">← Volver al listado de tablas</a>

</body>
</html>
