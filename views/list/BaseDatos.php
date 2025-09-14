<?php
require_once '../../config/database.php';

$db = (new Database())->conectar();

$sql = "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
";

$stmt = $db->query($sql);
$tablas = $stmt->fetchAll(PDO::FETCH_COLUMN);
?> 

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Tablas de la Base de Datos</title>
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
    margin-bottom: 30px;
  }
  ul {
    list-style: none;
    padding: 0;
    max-width: 500px;
    margin: 0 auto;
  }
  li {
  background-color: #1a1a1a;
  margin: 10px 0;
  border-radius: 6px;
  border: 1px solid #333;
  transition: background 0.2s;
}

li:hover {
  background-color: #2a2a2a;
}

li a {
  display: block; /* 👈 hace que el link ocupe todo el botón */
  padding: 12px 16px;
  color: #f5f5f5;
  text-decoration: none;
  font-weight: 600;
  width: 100%;
  height: 100%;
}

li a:hover {
  color: #ccc;
}

  a {
    color: #f5f5f5;
    text-decoration: none;
    font-weight: 600;
  }
  a:hover {
    color: #ccc;
  }
</style>
</head>
<body>

<h1>Tablas de la Base de Datos</h1>

<ul>
  <?php foreach ($tablas as $tabla): ?>
    <li><a href="VerTabla.php?tabla=<?= urlencode($tabla) ?>"><?= htmlspecialchars($tabla) ?></a></li>
  <?php endforeach; ?>
</ul>

</body>
</html>
