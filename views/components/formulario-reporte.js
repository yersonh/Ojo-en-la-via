// Módulo para gestionar el formulario de reportes
const FormularioManager = {
    inicializar() {
        this.configurarEventos();
    },

    configurarEventos() {
        // Previsualizar imagen
        document.getElementById('foto').addEventListener('change', (e) => {
            this.previsualizarImagen(e);
        });

        // Enviar formulario
        document.getElementById('formReporte').addEventListener('submit', (e) => {
            this.enviarFormulario(e);
        });
    },

    previsualizarImagen(e) {
        const file = e.target.files[0];
        const previewImg = document.getElementById('previewImg');
        
        if (file) {
            // Validar tamaño de archivo (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                MapaManager.mostrarAlerta('La imagen no debe superar los 5MB', 'error');
                e.target.value = '';
                previewImg.style.display = 'none';
                previewImg.src = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewImg.src = ev.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.style.display = 'none';
            previewImg.src = '';
        }
    },

    actualizarCoordenadas(lat, lng) {
        document.getElementById('latitud').value = lat;
        document.getElementById('longitud').value = lng;
        document.getElementById('latDisplay').textContent = lat.toFixed(6);
        document.getElementById('lngDisplay').textContent = lng.toFixed(6);
    },

    validarFormulario() {
        const lat = document.getElementById('latitud').value;
        const lng = document.getElementById('longitud').value;
        const tipo = document.getElementById('tipo').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        
        if (!tipo) {
            MapaManager.mostrarAlerta('Seleccione un tipo de incidente', 'error');
            return false;
        }
        
        if (!descripcion) {
            MapaManager.mostrarAlerta('Ingrese una descripción del incidente', 'error');
            return false;
        }
        
        if (descripcion.length < 10) {
            MapaManager.mostrarAlerta('La descripción debe tener al menos 10 caracteres', 'error');
            return false;
        }
        
        if (!lat || !lng) {
            MapaManager.mostrarAlerta('Debe seleccionar una ubicación en el mapa', 'error');
            return false;
        }
        
        return true;
    },

    async enviarFormulario(e) {
    e.preventDefault();

    if (!this.validarFormulario()) {
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');

    submitBtn.disabled = true;
    loading.style.display = 'block';

    try {
        // ✅ CORREGIR RUTA - misma lógica que arriba
        const posiblesRutas = [
            '../../controllers/reportecontrolador.php',
            '../controllers/reportecontrolador.php',
            'controllers/reportecontrolador.php',
            '/controllers/reportecontrolador.php'
        ];

        let result = null;
        let responseText = '';

        for (let ruta of posiblesRutas) {
            try {
                const url = `${ruta}?action=registrar`;
                console.log(`🔍 Probando ruta para registrar: ${url}`);
                
                const resp = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                
                responseText = await resp.text();
                console.log(`📋 Respuesta cruda de ${ruta}:`, responseText);
                
                if (resp.ok) {
                    result = JSON.parse(responseText);
                    console.log(`✅ Ruta funcionó: ${ruta}`);
                    break;
                }
            } catch (err) {
                console.log(`❌ Ruta falló: ${ruta}`, err);
            }
        }

        if (result && result.success) {
            MapaManager.mostrarAlerta('✅ ' + result.mensaje);
            this.limpiarFormulario();
            MapaManager.limpiarMarcadorTemporal();
            await MapaManager.cargarReportes();
        } else {
            // Si ninguna ruta funcionó, mostrar el último error
            try {
                const errorResult = JSON.parse(responseText);
                MapaManager.mostrarAlerta('❌ ' + (errorResult.mensaje || errorResult.error || 'Error desconocido'), 'error');
            } catch {
                MapaManager.mostrarAlerta('❌ Error del servidor. Revisa la consola para detalles.', 'error');
            }
        }

    } catch (error) {
        console.error('Error de red:', error);
        MapaManager.mostrarAlerta('❌ Error de conexión: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
}
};