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
        console.log('📤 Enviando formulario a:', '../../controllers/reportecontrolador.php?action=registrar');
        
        const resp = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
            method: 'POST',
            body: formData
        });

        console.log('📥 Respuesta status:', resp.status, resp.statusText);
        
        // VER QUÉ ESTÁ DEVOLVIENDO REALMENTE EL SERVIDOR
        const responseText = await resp.text();
        console.log('📄 Respuesta completa:', responseText);

        // Intentar parsear como JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ No es JSON válido. El servidor devolvió:', responseText.substring(0, 200));
            MapaManager.mostrarAlerta('❌ Error del servidor: Respuesta no válida', 'error');
            return;
        }
        
        if (result.success) {
            MapaManager.mostrarAlerta('✅ ' + result.mensaje);
            this.limpiarFormulario();
            MapaManager.limpiarMarcadorTemporal();
            await MapaManager.cargarReportes();
        } else {
            MapaManager.mostrarAlerta('❌ ' + (result.mensaje || result.error || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error('💥 Error de conexión:', error);
        MapaManager.mostrarAlerta('❌ Error de conexión: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
}
};