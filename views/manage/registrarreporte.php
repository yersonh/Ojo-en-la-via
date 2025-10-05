<?php
// Conexión para traer tipos de incidente
require_once __DIR__ . '/../../config/database.php';
$database = new Database();
$db = $database->conectar();

$query = "SELECT id_tipo_incidente, nombre FROM tipo_incidente ORDER BY nombre";
$stmt = $db->query($query);
$tipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registrar Reporte - Ojo en la Vía</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            margin: 0;
            padding: 20px;
        }
        h2 {
            text-align: center;
        }
        form {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        label {
            font-weight: bold;
            display: block;
            margin-top: 15px;
        }
        input, select, textarea, button {
            width: 100%;
            padding: 10px;
            margin-top: 5px;
            border-radius: 5px;
            border: 1px solid #ccc;
        }
        #map {
            height: 300px;
            margin-top: 10px;
            border-radius: 10px;
        }
        .preview {
            margin-top: 10px;
            text-align: center;
        }
        .preview img {
            max-width: 100%;
            border-radius: 10px;
        }
        button {
            background: #007bff;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>

<h2>Registrar Incidente Vial</h2>

<form id="formReporte" enctype="multipart/form-data">
    <label for="tipo">Tipo de incidente:</label>
    <select id="tipo" name="id_tipo_incidente" required>
        <option value="">Seleccione...</option>
        <?php foreach ($tipos as $t): ?>
            <option value="<?= $t['id_tipo_incidente'] ?>"><?= htmlspecialchars($t['nombre']) ?></option>
        <?php endforeach; ?>
    </select>

    <label for="descripcion">Descripción:</label>
    <textarea id="descripcion" name="descripcion" rows="4" placeholder="Ejemplo: Hueco grande frente al parque principal" required></textarea>

    <label for="foto">Fotografía:</label>
    <input type="file" id="foto" accept="image/*">

    <div class="preview">
        <img id="previewImg" src="" alt="">
    </div>

    <label>Seleccione ubicación en el mapa:</label>
    <div id="map"></div>

    <input type="hidden" id="latitud" name="latitud">
    <input type="hidden" id="longitud" name="longitud">

    <button type="submit">Registrar Reporte</button>
</form>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script>
const map = L.map('map').setView([4.142, -73.626], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker;

// Capturar coordenadas al hacer clic
map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    document.getElementById('latitud').value = lat.toFixed(8);
    document.getElementById('longitud').value = lng.toFixed(8);
});

// Previsualizar foto
document.getElementById('foto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => document.getElementById('previewImg').src = ev.target.result;
        reader.readAsDataURL(file);
    }
});

// Enviar datos del formulario
document.getElementById('formReporte').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id_usuario = 1; // Por ahora se deja fijo (ajustar luego con sesión)
    const data = {
        id_usuario,
        id_tipo_incidente: document.getElementById('tipo').value,
        descripcion: document.getElementById('descripcion').value,
        latitud: document.getElementById('latitud').value,
        longitud: document.getElementById('longitud').value
    };

    if (!data.latitud || !data.longitud) {
        alert('Debe seleccionar una ubicación en el mapa.');
        return;
    }

    const resp = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await resp.json();
    alert(result.mensaje || result.error || 'Error desconocido');
});
</script>

</body>
</html>
