// Módulo para gestionar el formulario de reportes - VERSIÓN MEJORADA
const FormularioManager = {
    streamCamara: null,

    inicializar() {
        this.configurarEventos();
        this.mejorarUIFormulario();
    },

    mejorarUIFormulario() {
        console.log('🎨 Mejorando UI del formulario...');
        
        // Agregar clases CSS para los nuevos estilos
        const form = document.getElementById('formReporte');
        form.classList.add('formulario-moderno');
        
        // Mejorar el select de tipo de incidente
        const selectTipo = document.getElementById('tipo');
        if (selectTipo) {
            selectTipo.classList.add('select-moderno');
        }
        
        // Mejorar el textarea de descripción
        const textareaDesc = document.getElementById('descripcion');
        if (textareaDesc) {
            textareaDesc.classList.add('textarea-moderno');
            textareaDesc.setAttribute('placeholder', 'Describe detalladamente el incidente...');
        }
        
        // Agregar contador de caracteres a la descripción
        this.agregarContadorCaracteres();
        
        // Mejorar botones
        this.mejorarBotones();
        
        console.log('✅ UI del formulario mejorada');
    },

    agregarContadorCaracteres() {
        const descripcion = document.getElementById('descripcion');
        const contador = document.createElement('div');
        contador.className = 'contador-caracteres';
        contador.innerHTML = '<span class="contador-actual">0</span>/<span class="contador-maximo">500</span> caracteres';
        contador.style.cssText = 'font-size: 12px; color: #6b7280; text-align: right; margin-top: 4px;';
        
        descripcion.parentNode.insertBefore(contador, descripcion.nextSibling);
        
        descripcion.addEventListener('input', (e) => {
            const actual = e.target.value.length;
            const maximo = 500;
            const contadorActual = contador.querySelector('.contador-actual');
            const contadorMaximo = contador.querySelector('.contador-maximo');
            
            contadorActual.textContent = actual;
            contadorMaximo.textContent = maximo;
            
            // Cambiar color según el número de caracteres
            if (actual < 10) {
                contador.style.color = '#ef4444';
            } else if (actual < 50) {
                contador.style.color = '#f59e0b';
            } else {
                contador.style.color = '#10b981';
            }
            
            if (actual > maximo) {
                contador.style.color = '#ef4444';
                contadorActual.style.fontWeight = 'bold';
            } else {
                contadorActual.style.fontWeight = 'normal';
            }
        });
    },

    mejorarBotones() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <span class="btn-text">📝 Registrar Reporte</span>
                <span class="btn-loading" style="display: none;">
                    <div class="spinner-mini"></div> Procesando...
                </span>
            `;
        }
    },

    configurarEventos() {
        console.log('⚙️ Configurando eventos del formulario...');
        
        // Previsualizar imagen cuando se selecciona archivo
        document.getElementById('foto').addEventListener('change', (e) => {
            this.previsualizarImagen(e);
        });

        // Enviar formulario
        document.getElementById('formReporte').addEventListener('submit', (e) => {
            this.enviarFormulario(e);
        });
        
        // Eventos para cámara con mejoras visuales
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
        
        // Validación en tiempo real
        this.configurarValidacionTiempoReal();
        
        // Efectos visuales para campos
        this.configurarEfectosVisuales();
        
        console.log('✅ Eventos del formulario configurados');
    },

    configurarValidacionTiempoReal() {
        const campos = ['tipo', 'descripcion'];
        
        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.addEventListener('blur', () => {
                    this.validarCampo(campoId);
                });
                
                campo.addEventListener('input', () => {
                    this.limpiarErrorCampo(campoId);
                });
            }
        });
    },

    mostrarErrorCampo(campoId, mensaje) {
        const campo = document.getElementById(campoId);
        const grupo = campo.closest('.form-group') || campo.parentElement;
        
        // Remover mensajes anteriores
        this.limpiarErrorCampo(campoId);
        
        // Agregar clase de error
        campo.classList.add('campo-error');
        
        // Crear mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mensaje-error';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px; font-weight: 500;';
        errorDiv.textContent = mensaje;
        
        grupo.appendChild(errorDiv);
    },

    mostrarExitoCampo(campoId) {
        const campo = document.getElementById(campoId);
        campo.classList.remove('campo-error');
        campo.classList.add('campo-exito');
        
        setTimeout(() => {
            campo.classList.remove('campo-exito');
        }, 2000);
    },

    limpiarErrorCampo(campoId) {
        const campo = document.getElementById(campoId);
        const grupo = campo.closest('.form-group') || campo.parentElement;
        const mensajeError = grupo.querySelector('.mensaje-error');
        
        if (mensajeError) {
            mensajeError.remove();
        }
        
        campo.classList.remove('campo-error');
    },

    configurarEfectosVisuales() {
        // Efecto de focus para todos los campos
        const campos = document.querySelectorAll('#formReporte select, #formReporte textarea, #formReporte input');
        
        campos.forEach(campo => {
            campo.addEventListener('focus', function() {
                this.parentElement.classList.add('campo-focus');
            });
            
            campo.addEventListener('blur', function() {
                this.parentElement.classList.remove('campo-focus');
            });
        });
    },

    async activarCamara() {
        try {
            console.log('📸 Activando cámara...');
            
            // Efecto visual al activar cámara
            const btnCamara = document.getElementById('btnTomarFoto');
            btnCamara.style.background = '#3b82f6';
            btnCamara.style.color = 'white';
            
            // Ocultar elementos no necesarios
            document.getElementById('sinImagen').style.display = 'none';
            document.getElementById('previewImg').style.display = 'none';
            
            // Mostrar video y controles con animación
            const video = document.getElementById('videoCamara');
            const controles = document.getElementById('controlesCamara');
            
            video.style.display = 'block';
            controles.style.display = 'flex';
            
            // Animación de entrada
            setTimeout(() => {
                video.style.opacity = '1';
                video.style.transform = 'scale(1)';
            }, 10);
            
            // Configurar cámara
            const constraints = {
                video: { 
                    facingMode: 'environment',
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
            this.mostrarErrorCamara('No se pudo acceder a la cámara. Verifica los permisos.');
            this.desactivarCamara();
        }
    },

    mostrarErrorCamara(mensaje) {
        MapaManager.mostrarAlerta(mensaje, 'error');
        
        // Efecto visual de error en el botón de cámara
        const btnCamara = document.getElementById('btnTomarFoto');
        btnCamara.style.background = '#ef4444';
        btnCamara.style.color = 'white';
        
        setTimeout(() => {
            btnCamara.style.background = '';
            btnCamara.style.color = '';
        }, 2000);
    },

    capturarFoto() {
        try {
            const video = document.getElementById('videoCamara');
            const canvas = document.getElementById('canvasCaptura');
            const previewImg = document.getElementById('previewImg');
            
            // Efecto de captura
            video.style.opacity = '0.7';
            setTimeout(() => {
                video.style.opacity = '1';
            }, 200);
            
            // Configurar canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar frame actual
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir a blob
            canvas.toBlob((blob) => {
                // Crear archivo
                const archivo = new File([blob], `foto_${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                
                // Asignar al input file
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(archivo);
                const inputFile = document.getElementById('foto');
                inputFile.files = dataTransfer.files;
                
                // Mostrar previsualización con efecto
                previewImg.src = URL.createObjectURL(blob);
                previewImg.style.display = 'block';
                previewImg.style.opacity = '0';
                previewImg.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    previewImg.style.opacity = '1';
                    previewImg.style.transform = 'scale(1)';
                }, 10);
                
                document.getElementById('sinImagen').style.display = 'none';
                
                // Limpiar cámara
                this.desactivarCamara();
                
                // Mostrar confirmación
                this.mostrarConfirmacionFoto();
                
            }, 'image/jpeg', 0.8);
            
        } catch (error) {
            console.error('❌ Error al capturar foto:', error);
            MapaManager.mostrarAlerta('Error al capturar la foto', 'error');
        }
    },

    mostrarConfirmacionFoto() {
        const previewContainer = document.querySelector('.preview');
        const confirmacion = document.createElement('div');
        confirmacion.className = 'confirmacion-foto';
        confirmacion.innerHTML = '✅ Foto capturada';
        confirmacion.style.cssText = `
            position: absolute; top: 10px; right: 10px; background: #10b981; 
            color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;
            font-weight: 600; z-index: 10; animation: fadeInOut 2s ease-in-out;
        `;
        
        document.querySelector('.preview').style.position = 'relative';
        document.querySelector('.preview').appendChild(confirmacion);
        
        setTimeout(() => {
            confirmacion.remove();
        }, 2000);
    },

    desactivarCamara() {
        // Detener stream
        if (this.streamCamara) {
            this.streamCamara.getTracks().forEach(track => track.stop());
            this.streamCamara = null;
        }
        
        // Ocultar elementos con animación
        const video = document.getElementById('videoCamara');
        const controles = document.getElementById('controlesCamara');
        
        video.style.opacity = '0';
        video.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            video.style.display = 'none';
            controles.style.display = 'none';
            video.srcObject = null;
        }, 300);
    },

    // 🆕 FUNCIÓN MEJORADA PARA PREVISUALIZAR MÚLTIPLES IMÁGENES
previsualizarImagen(e) {
    const files = e.target.files;
    const previewContainer = document.querySelector('.preview');
    const sinImagen = document.getElementById('sinImagen');
    
    // Limpiar previsualizaciones anteriores
    previewContainer.querySelectorAll('.imagen-previa').forEach(img => img.remove());
    document.getElementById('previewImg').style.display = 'none';
    
    if (files && files.length > 0) {
        sinImagen.style.display = 'none';
        
        let archivosValidos = 0;
        const maxArchivos = 10; // Límite máximo de imágenes
        
        // Validar número de archivos
        if (files.length > maxArchivos) {
            this.mostrarErrorArchivo(`Máximo ${maxArchivos} imágenes permitidas`);
            e.target.value = '';
            sinImagen.style.display = 'block';
            return;
        }
        
        // Procesar cada archivo
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validar tamaño
            if (file.size > 5 * 1024 * 1024) {
                this.mostrarErrorArchivo(`La imagen "${file.name}" supera los 5MB`);
                continue;
            }
            
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                this.mostrarErrorArchivo(`"${file.name}" no es una imagen válida`);
                continue;
            }
            
            archivosValidos++;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'imagen-previa';
                imgContainer.style.cssText = `
                    position: relative;
                    display: inline-block;
                    margin: 5px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 2px solid #e5e7eb;
                    transition: all 0.3s ease;
                `;
                
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.style.cssText = `
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    display: block;
                `;
                
                // Botón para eliminar imagen
                const btnEliminar = document.createElement('button');
                btnEliminar.innerHTML = '×';
                btnEliminar.style.cssText = `
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                    border: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                btnEliminar.addEventListener('click', (event) => {
                    event.stopPropagation();
                    imgContainer.remove();
                    this.actualizarInputArchivos();
                    
                    // Mostrar "sin imagen" si no quedan imágenes
                    if (previewContainer.querySelectorAll('.imagen-previa').length === 0) {
                        sinImagen.style.display = 'block';
                    }
                });
                
                imgContainer.addEventListener('mouseenter', () => {
                    btnEliminar.style.opacity = '1';
                    imgContainer.style.borderColor = '#3b82f6';
                    imgContainer.style.transform = 'scale(1.05)';
                });
                
                imgContainer.addEventListener('mouseleave', () => {
                    btnEliminar.style.opacity = '0';
                    imgContainer.style.borderColor = '#e5e7eb';
                    imgContainer.style.transform = 'scale(1)';
                });
                
                imgContainer.appendChild(img);
                imgContainer.appendChild(btnEliminar);
                previewContainer.insertBefore(imgContainer, sinImagen);
                
                // Animación de entrada
                imgContainer.style.opacity = '0';
                imgContainer.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    imgContainer.style.opacity = '1';
                    imgContainer.style.transform = 'scale(1)';
                }, 10);
            };
            reader.readAsDataURL(file);
        }
        
        if (archivosValidos > 0) {
            this.mostrarConfirmacionArchivo(archivosValidos);
        } else {
            sinImagen.style.display = 'block';
        }
        
    } else {
        sinImagen.style.display = 'block';
    }
},

// 🆕 FUNCIÓN PARA ACTUALIZAR EL INPUT DE ARCHIVOS AL ELIMINAR
actualizarInputArchivos() {
    const inputFile = document.getElementById('foto');
    const files = inputFile.files;
    const dataTransfer = new DataTransfer();
    
    // Mantener solo los archivos que aún están en previsualización
    const previewContainer = document.querySelector('.preview');
    const imagenesPrevia = Array.from(previewContainer.querySelectorAll('.imagen-previa img'));
    
    Array.from(files).forEach(file => {
        // Verificar si esta imagen todavía está en previsualización
        const sigueEnPrevia = imagenesPrevia.some(img => 
            img.src.startsWith('data:') && img.src.includes(btoa(file.name).slice(0, 20))
        );
        
        if (sigueEnPrevia) {
            dataTransfer.items.add(file);
        }
    });
    
    inputFile.files = dataTransfer.files;
},

// 🆕 FUNCIÓN MEJORADA PARA CAPTURAR FOTO (agregar a las existentes)
capturarFoto() {
    try {
        const video = document.getElementById('videoCamara');
        const canvas = document.getElementById('canvasCaptura');
        const previewContainer = document.querySelector('.preview');
        const sinImagen = document.getElementById('sinImagen');
        
        // Efecto de captura
        video.style.opacity = '0.7';
        setTimeout(() => {
            video.style.opacity = '1';
        }, 200);
        
        // Configurar canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dibujar frame actual
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir a blob
        canvas.toBlob((blob) => {
            // Crear archivo
            const archivo = new File([blob], `foto_${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
            
            // Agregar al input file existente (no reemplazar)
            const inputFile = document.getElementById('foto');
            const dataTransfer = new DataTransfer();
            
            // Mantener archivos existentes
            for (let i = 0; i < inputFile.files.length; i++) {
                dataTransfer.items.add(inputFile.files[i]);
            }
            
            // Agregar nuevo archivo
            dataTransfer.items.add(archivo);
            inputFile.files = dataTransfer.files;
            
            // Disparar evento change para previsualizar
            const event = new Event('change', { bubbles: true });
            inputFile.dispatchEvent(event);
            
            // Limpiar cámara
            this.desactivarCamara();
            
            // Mostrar confirmación
            this.mostrarConfirmacionFoto();
            
        }, 'image/jpeg', 0.8);
        
    } catch (error) {
        console.error('❌ Error al capturar foto:', error);
        MapaManager.mostrarAlerta('Error al capturar la foto', 'error');
    }
},

// 🆕 FUNCIÓN MEJORADA PARA LIMPIAR FORMULARIO
limpiarFormulario() {
    document.getElementById('formReporte').reset();
    
    // Limpiar previsualizaciones de imágenes
    const previewContainer = document.querySelector('.preview');
    previewContainer.querySelectorAll('.imagen-previa').forEach(img => img.remove());
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('sinImagen').style.display = 'block';
    
    document.getElementById('latDisplay').textContent = 'No seleccionada';
    document.getElementById('lngDisplay').textContent = 'No seleccionada';
    document.getElementById('latitud').value = '';
    document.getElementById('longitud').value = '';
    
    // Limpiar contador de caracteres
    const contador = document.querySelector('.contador-caracteres');
    if (contador) {
        contador.querySelector('.contador-actual').textContent = '0';
        contador.style.color = '#6b7280';
    }
    
    // Limpiar cámara
    this.desactivarCamara();
    
    // Limpiar errores
    this.limpiarErrores();
    
    console.log('🧹 Formulario limpiado (múltiples imágenes)');
},

// 🆕 FUNCIÓN MEJORADA PARA CONFIRMACIÓN DE ARCHIVOS
mostrarConfirmacionArchivo(cantidad) {
    const mensaje = cantidad === 1 ? '✅ Imagen cargada correctamente' : `✅ ${cantidad} imágenes cargadas correctamente`;
    MapaManager.mostrarAlerta(mensaje);
    
    // Actualizar texto del botón de selección de archivo
    const btnArchivo = document.getElementById('btnSeleccionarArchivo');
    if (cantidad > 1) {
        btnArchivo.innerHTML = `📁 ${cantidad} archivos seleccionados`;
        btnArchivo.style.background = '#10b981';
        btnArchivo.style.color = 'white';
        
        setTimeout(() => {
            btnArchivo.innerHTML = '📁 Seleccionar Archivos';
            btnArchivo.style.background = '';
            btnArchivo.style.color = '';
        }, 3000);
    }
},

// 🆕 ACTUALIZAR MEJORARUIFormulario PARA MÚLTIPLES ARCHIVOS
mejorarUIFormulario() {
    console.log('🎨 Mejorando UI del formulario...');
    
    // Agregar clases CSS para los nuevos estilos
    const form = document.getElementById('formReporte');
    form.classList.add('formulario-moderno');
    
    // Mejorar el select de tipo de incidente
    const selectTipo = document.getElementById('tipo');
    if (selectTipo) {
        selectTipo.classList.add('select-moderno');
    }
    
    // Mejorar el textarea de descripción
    const textareaDesc = document.getElementById('descripcion');
    if (textareaDesc) {
        textareaDesc.classList.add('textarea-moderno');
        textareaDesc.setAttribute('placeholder', 'Describe detalladamente el incidente...');
    }
    
    // 🆕 Actualizar texto del botón de archivo para múltiples
    const btnArchivo = document.getElementById('btnSeleccionarArchivo');
    if (btnArchivo) {
        btnArchivo.innerHTML = '📁 Seleccionar Archivos';
    }
    
    // Agregar contador de caracteres a la descripción
    this.agregarContadorCaracteres();
    
    // Mejorar botones
    this.mejorarBotones();
    
    console.log('✅ UI del formulario mejorada (soporte múltiples imágenes)');
},

    mostrarErrorArchivo(mensaje) {
        MapaManager.mostrarAlerta(mensaje, 'error');
        
        // Efecto visual en el área de imagen
        const campoImagen = document.querySelector('.campo-imagen');
        campoImagen.style.borderColor = '#ef4444';
        campoImagen.style.background = '#fef2f2';
        
        setTimeout(() => {
            campoImagen.style.borderColor = '';
            campoImagen.style.background = '';
        }, 2000);
    },

    mostrarConfirmacionArchivo() {
        MapaManager.mostrarAlerta('✅ Imagen cargada correctamente');
    },

    actualizarCoordenadas(lat, lng) {
        document.getElementById('latitud').value = lat;
        document.getElementById('longitud').value = lng;
        
        const latDisplay = document.getElementById('latDisplay');
        const lngDisplay = document.getElementById('lngDisplay');
        
        latDisplay.textContent = lat.toFixed(6);
        lngDisplay.textContent = lng.toFixed(6);
        
        // Efecto visual al actualizar coordenadas
        latDisplay.style.color = '#10b981';
        lngDisplay.style.color = '#10b981';
        latDisplay.style.fontWeight = '600';
        lngDisplay.style.fontWeight = '600';
        
        setTimeout(() => {
            latDisplay.style.color = '';
            lngDisplay.style.color = '';
            latDisplay.style.fontWeight = '';
            lngDisplay.style.fontWeight = '';
        }, 2000);
    },

    validarFormulario() {
        const campos = ['tipo', 'descripcion'];
        let esValido = true;
        
        // Validar cada campo
        campos.forEach(campoId => {
            if (!this.validarCampo(campoId)) {
                esValido = false;
            }
        });
        
        // Validar ubicación
        const lat = document.getElementById('latitud').value;
        const lng = document.getElementById('longitud').value;
        if (!lat || !lng) {
            MapaManager.mostrarAlerta('Debe seleccionar una ubicación en el mapa', 'error');
            esValido = false;
        }
        
        return esValido;
    }, limpiarErrorCampo(campoId) {
        const campo = document.getElementById(campoId);
        const grupo = campo.closest('.form-group') || campo.parentElement;
        const mensajeError = grupo.querySelector('.mensaje-error');
        
        if (mensajeError) {
            mensajeError.remove();
        }
        
        campo.classList.remove('campo-error');
    },

    // 🆕 AGREGAR ESTA FUNCIÓN FALTANTE
    validarCampo(campoId) {
        const campo = document.getElementById(campoId);
        if (!campo) return false;
        
        let esValido = true;
        let mensajeError = '';
        
        switch(campoId) {
            case 'tipo':
                if (!campo.value) {
                    mensajeError = 'Por favor selecciona un tipo de incidente';
                    esValido = false;
                }
                break;
                
            case 'descripcion':
                const descripcion = campo.value.trim();
                if (!descripcion) {
                    mensajeError = 'La descripción es obligatoria';
                    esValido = false;
                } else if (descripcion.length < 10) {
                    mensajeError = 'La descripción debe tener al menos 10 caracteres';
                    esValido = false;
                } else if (descripcion.length > 500) {
                    mensajeError = 'La descripción no puede exceder 500 caracteres';
                    esValido = false;
                }
                break;
        }
        
        if (!esValido) {
            this.mostrarErrorCampo(campoId, mensajeError);
        } else {
            this.mostrarExitoCampo(campoId);
        }
        
        return esValido;
    },

    configurarEfectosVisuales() {
        // ... el resto de tu código ...
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
        
        // Limpiar contador de caracteres
        const contador = document.querySelector('.contador-caracteres');
        if (contador) {
            contador.querySelector('.contador-actual').textContent = '0';
            contador.style.color = '#6b7280';
        }
        
        // Limpiar cámara
        this.desactivarCamara();
        
        // Limpiar errores
        this.limpiarErrores();
        
        console.log('🧹 Formulario limpiado');
    },

    limpiarErrores() {
        const errores = document.querySelectorAll('.mensaje-error');
        errores.forEach(error => error.remove());
        
        const campos = document.querySelectorAll('.campo-error, .campo-exito');
        campos.forEach(campo => {
            campo.classList.remove('campo-error', 'campo-exito');
        });
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

        // Efecto visual de envío
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.querySelector('.btn-text').style.display = 'none';
        submitBtn.querySelector('.btn-loading').style.display = 'block';
        
        loading.style.display = 'flex';

        try {
            console.log('📤 Enviando formulario...');
            
            const resp = await fetch('../../controllers/reportecontrolador.php?action=registrar', {
                method: 'POST',
                body: formData
            });

            const responseText = await resp.text();
            console.log('📥 Respuesta del servidor:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Error parseando respuesta:', parseError);
                throw new Error('Respuesta del servidor no válida');
            }
            
            if (result.success) {
                this.mostrarExitoEnvio(result.mensaje);
                this.limpiarFormulario();
                MapaManager.limpiarMarcadorTemporal();
                await MapaManager.cargarReportes();
            } else {
                throw new Error(result.mensaje || result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('💥 Error:', error);
            this.mostrarErrorEnvio(error.message);
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.querySelector('.btn-text').style.display = 'block';
            submitBtn.querySelector('.btn-loading').style.display = 'none';
            loading.style.display = 'none';
        }
    },

    mostrarExitoEnvio(mensaje) {
        MapaManager.mostrarAlerta('✅ ' + mensaje);
        
        // Efecto visual adicional
        const form = document.getElementById('formReporte');
        form.style.transform = 'scale(0.98)';
        setTimeout(() => {
            form.style.transform = 'scale(1)';
        }, 300);
    },

    mostrarErrorEnvio(mensaje) {
        MapaManager.mostrarAlerta('❌ ' + mensaje, 'error');
        
        // Efecto visual de error
        const form = document.getElementById('formReporte');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }
};

// Animación CSS para el efecto shake
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateY(-10px); }
        50% { opacity: 1; transform: translateY(0); }
    }
    
    .spinner-mini {
        width: 16px; height: 16px; border: 2px solid transparent;
        border-top: 2px solid white; border-radius: 50%;
        animation: spin 1s linear infinite; display: inline-block;
        margin-right: 8px;
    }
`;
document.head.appendChild(style);

// Función auxiliar independiente como respaldo
function limpiarFormularioGlobal() {
    FormularioManager.limpiarFormulario();
}   