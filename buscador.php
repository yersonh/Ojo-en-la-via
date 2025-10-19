<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscador de Direcciones - Proyecto Universitario</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"/>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .search-container {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            width: 350px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        h1 {
            font-size: 1.2em;
            margin-bottom: 15px;
            color: #333;
            text-align: center;
        }
        
        #searchInput {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 10px;
            transition: border-color 0.3s;
        }
        
        #searchInput:focus {
            outline: none;
            border-color: #4264fb;
        }
        
        .search-button {
            width: 100%;
            padding: 12px;
            background: #4264fb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .search-button:hover {
            background: #3151e0;
        }
        
        .results-container {
            margin-top: 15px;
        }
        
        .result-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .result-item:hover {
            background: #f5f7ff;
        }
        
        .result-item:last-child {
            border-bottom: none;
        }
        
        .result-name {
            font-weight: bold;
            color: #333;
        }
        
        .result-address {
            font-size: 0.9em;
            color: #666;
            margin-top: 3px;
        }
        
        #map {
            height: 100vh;
            width: 100%;
        }
        
        .info-panel {
            background: rgba(255,255,255,0.95);
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            font-size: 0.8em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="search-container">
        <h1>🔍 Buscador de Direcciones</h1>
        <input type="text" id="searchInput" placeholder="Ej: Calle Gran Vía, Madrid...">
        <button class="search-button" onclick="searchAddress()">Buscar Dirección</button>
        
        <div class="results-container" id="results"></div>
        
        <div class="info-panel">
            <strong>Proyecto Universitario - Sistemas Distribuidos</strong><br>
            Usando Mapbox Geocoding API<br>
            Búsquedas restantes: <span id="usageCounter">-</span>
        </div>
    </div>
    
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script>
        // Configuración - REEMPLAZA con tu token de Mapbox
        const MAPBOX_TOKEN = 'pk.tu_token_aqui_mapbox';
        
        // Inicializar mapa
        const map = L.map('map').setView([40.4168, -3.7038], 6); // Centro en España
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Geocoding by <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 19
        }).addTo(map);

        let currentMarkers = [];
        let searchCount = 0;

        // Función principal de búsqueda
        async function searchAddress() {
            const address = document.getElementById('searchInput').value.trim();
            if (!address) {
                alert('Por favor, introduce una dirección');
                return;
            }

            // Limpiar resultados anteriores
            clearPreviousResults();

            try {
                const results = await searchWithMapbox(address);
                displayResults(results);
                updateUsageCounter();
                
            } catch (error) {
                console.error('Error en la búsqueda:', error);
                showError('Error al buscar la dirección. Inténtalo de nuevo.');
            }
        }

        // API Call a Mapbox
        async function searchWithMapbox(address) {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
                `access_token=${MAPBOX_TOKEN}&` +
                `limit=8&` +
                `country=es&` +
                `language=es&` +
                `types=address,place,poi`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            searchCount++;
            return data.features;
        }

        // Mostrar resultados
        function displayResults(results) {
            const resultsDiv = document.getElementById('results');
            
            if (results.length === 0) {
                resultsDiv.innerHTML = '<div class="result-item">No se encontraron resultados</div>';
                return;
            }

            resultsDiv.innerHTML = '<div class="result-item" style="color:#666; font-style:italic;">' + 
                                 results.length + ' resultados encontrados:</div>';

            results.forEach((result, index) => {
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `
                    <div class="result-name">${result.place_name_es || result.place_name}</div>
                    <div class="result-address">${result.properties?.address || ''}</div>
                `;
                
                div.onclick = () => selectResult(result, index);
                resultsDiv.appendChild(div);
            });
        }

        // Seleccionar un resultado
        function selectResult(result, index) {
            const [lng, lat] = result.center;
            
            // Mover mapa a la ubicación
            map.setView([lat, lng], 16);
            
            // Limpiar marcadores anteriores y añadir nuevo
            clearMarkers();
            
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 200px;">
                        <strong>${result.place_name_es || result.place_name}</strong><br>
                        <em>${result.properties?.category || 'Ubicación'}</em><br>
                        <small>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                    </div>
                `)
                .openPopup();
            
            currentMarkers.push(marker);
            
            // Resaltar resultado seleccionado
            document.querySelectorAll('.result-item').forEach((item, i) => {
                item.style.background = i === index + 1 ? '#e8f4ff' : '';
            });
        }

        // Utilidades
        function clearPreviousResults() {
            clearMarkers();
        }

        function clearMarkers() {
            currentMarkers.forEach(marker => map.removeLayer(marker));
            currentMarkers = [];
        }

        function updateUsageCounter() {
            document.getElementById('usageCounter').textContent = 
                `${searchCount} (${50000 - searchCount} restantes)`;
        }

        function showError(message) {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `<div class="result-item" style="color:red;">${message}</div>`;
        }

        // Event Listeners
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchAddress();
        });

        // Contador de uso inicial
        updateUsageCounter();

        // Ejemplo de uso para demostración
        setTimeout(() => {
            document.getElementById('searchInput').value = 'Plaza Mayor Madrid';
        }, 1000);
    </script>
</body>
</html>