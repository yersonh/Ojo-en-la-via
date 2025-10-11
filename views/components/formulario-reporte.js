// Módulo para gestionar el formulario de reportes
const FormularioManager = {
    streamCamara: null,

    inicializar() {
        this.configurarEventos();
    },

    configurarEventos() {
        // Previsualizar imagen cuando se selecciona archivo
        document.getElementById('foto').addEventListener('change', (e) => {
            this.previsualizarImagen(e);
        });

        // Enviar formulario
        document.getElementById('formReporte').addEventListener('submit', (e) => {
            this.enviarFormulario(e);
        });
        
        // Nuevos eventos para cámara
        document.getElementById('btnTomarFoto').addEventListener('click', () => {
            this.activarCamara();
        });
        
        document.getElementById('btnSeleccionarArchivo').addEventListener('click', () => {
            document.getElementById('foto').click();
        });
        
        document.getElementById('btnCapturar').addEventListener('click', () => {
            this.capturarFoto();
        });
        
        document.getElementById('btnCancelarCamara').addEventListener('click', () => {
            this.desactivarCamara();
        });
    },

    async activarCamara() {
        try {
            console.log('📸 Activando cámara...');
            
            // Ocultar elementos no necesarios
            document.getElementById('sinImagen').style.display = 'none';
            document.getElementById('previewImg').style.display = 'none';
            
            // Mostrar video y controles
            const video = document.getElementById('videoCamara');
            const controles = document.getElementById('controlesCamara');
            
            video.style.display = 'block';
            controles.style.display = 'block';
            
            // Configurar cámara
            const constraints = {
                video: { 
                    facingMode: 'environment', // Cámara trasera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }, 
                audio: false 
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.streamCamara = stream;
            video.srcObject = stream;
            
            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            console.log('✅ Cámara activada correctamente');
            
        } catch (error) {
            console.error('❌ Error al acceder a la cámara:', error);
            MapaManager.mostrarAlerta('No se pudo acceder a la cámara. Verifica los permisos.', 'error');
            this.desactivarCamara();
        }
    },

    capturarFoto() {
        try {
            const video = document.getElementById('videoCamara');
            const canvas = document.getElementById('canvasCaptura');
            const previewImg = document.getElementById('previewImg');
            
            // Configurar canvas con las dimensiones del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar el frame actual del video en el canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir canvas a blob y crear archivo
            canvas.toBlob((blob) => {
                // Crear archivo a partir del blob
                const archivo = new File([blob], `foto_${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                
                // Crear DataTransfer y asignar el archivo
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(archivo);
                
                // Asignar al input file
                const inputFile = document.getElementById('foto');
                inputFile.files = dataTransfer.files;
                
                // Mostrar previsualización
                previewImg.src = URL.createObjectURL(blob);
                previewImg.style.display = 'block';
                document.getElementById('sinImagen').style.display = 'none';
                
                // Limpiar y desactivar cámara
                this.desactivarCamara();
                
                MapaManager.mostrarAlerta('✅ Foto capturada correctamente');
                
            }, 'image/jpeg', 0.8); // Calidad del 80%
            
        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            MapaManager.mostrarAlerta('Error al capturar la foto', 'error');
        }
    },

    desactivarCamara() {
        // Detener stream de cámara
        if (this.streamCamara) {
            this.streamCamara.getTracks().forEach(track => track.stop());
            this.streamCamara = null;
        }
        
        // Ocultar elementos de cámara
        document.getElementById('videoCamara').style.display = 'none';
        document.getElementById('controlesCamara').style.display = 'none';
        document.getElementById('videoCamara').srcObject = null;
    },

    previsualizarImagen(e) {
        const file = e.target.files[0];
        const previewImg = document.getElementById('previewImg');
        const sinImagen = document.getElementById('sinImagen');
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                MapaManager.mostrarAlerta('La imagen no debe superar los 5MB', 'error');
                e.target.value = '';
                previewImg.style.display = 'none';
                sinImagen.style.display = 'block';
                previewImg.src = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewImg.src = ev.target.result;
                previewImg.style.display = 'block';
                sinImagen.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.style.display = 'none';
            sinImagen.style.display = 'block';
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

    limpiarFormulario() {
        document.getElementById('formReporte').reset();
        document.getElementById('previewImg').style.display = 'none';
        document.getElementById('previewImg').src = '';
        document.getElementById('sinImagen').style.display = 'block';
        document.getElementById('latDisplay').textContent = 'No seleccionada';
        document.getElementById('lngDisplay').textContent = 'No seleccionada';
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        
        // Limpiar cámara si está activa
        this.desactivarCamara();
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
            
            const responseText = await resp.text();
            console.log('📄 Respuesta completa:', responseText);

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

// Función auxiliar independiente como respaldo
function limpiarFormularioGlobal() {
    document.getElementById('formReporte').reset();
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('sinImagen').style.display = 'block';
    document.getElementById('latDisplay').textContent = 'No seleccionada';
    document.getElementById('lngDisplay').textContent = 'No seleccionada';
    document.getElementById('latitud').value = '';
    document.getElementById('longitud').value = '';
}w