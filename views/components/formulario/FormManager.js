import { FormConstants } from './utils/Constants.js';
import { ValidationManager } from './ValidationManager.js';
import { UIManager } from './UIManager.js';
import { ImageManager } from './ImageManager.js';
import { CameraManager } from './CameraManager.js';

export class FormManager {
    constructor() {
        this.validationManager = new ValidationManager(this);
        this.uiManager = new UIManager(this);
        this.imageManager = new ImageManager(this);
        this.cameraManager = new CameraManager(this, this.imageManager);
        
        this.initialized = false;
    }

    initialize() {
    if (this.initialized) return;
    
    console.log('⚙️ Inicializando FormManager...');
    
    // Inicializar todos los managers
    this.uiManager.initialize();
    this.validationManager.initialize();
    this.imageManager.initialize();
    this.cameraManager.initialize();
    
    this.setupFormSubmit();
    this.validationManager.setupCharacterCounter();
    
    // REGISTRARSE PARA CAMBIOS DE CONEXIÓN (SOLO UNA VEZ)
    if (window.connectionManager) {
        window.connectionManager.addListener((online) => {
            this.handleConnectionChange(online);
        });
    }
    
    this.initialized = true;
    console.log('✅ FormManager inicializado correctamente');
}

    setupFormSubmit() {
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        if (form) {
            form.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }
    }
   async handleFormSubmit(e) {
    e.preventDefault();

    // Validación básica del formulario
    if (!this.validationManager.validateForm()) {
        console.log('❌ Validación de formulario falló');
        return;
    }

    // Verificación de coordenadas
    if (!this.verificarCoordenadas()) {
        this.handleSubmitError('Por favor, selecciona una ubicación en el mapa');
        return;
    }

    this.uiManager.showLoadingState();

    try {
        console.log('📤 Procesando reporte...');
        
        const formData = new FormData(e.target);
        
        // 🆕 DELEGAR TODO AL OFFLINE MANAGER
        const resultado = await OfflineManager.procesarReporteConResiliencia(formData);
        
        if (resultado.modo === 'online') {
            this.handleSubmitSuccess(resultado.data.mensaje);
        } else {
            this.handleSubmitOfflineSuccess(resultado.idOffline);
        }

    } catch (error) {
        console.error('💥 Error en envío:', error);
        this.handleSubmitError(error.message || 'Error al procesar el reporte');
    } finally {
        this.uiManager.hideLoadingState();
    }
}

verificarCoordenadas() {
    const latInput = document.getElementById('latitud');
    const lngInput = document.getElementById('longitud');
    
    if (!latInput || !lngInput) {
        console.error('❌ No se encontraron inputs de coordenadas');
        return false;
    }
    
    const lat = latInput.value;
    const lng = lngInput.value;
    
    if (!lat || !lng || lat === '' || lng === '') {
        console.error('❌ Coordenadas vacías:', { lat, lng });
        return false;
    }
    
    if (lat === 'No seleccionada' || lng === 'No seleccionada') {
        console.error('❌ Coordenadas no seleccionadas');
        return false;
    }
    
    console.log('✅ Coordenadas válidas:', lat, lng);
    return true;
}
    // 🆕 MANEJADOR DE ÉXITO OFFLINE
   handleSubmitOfflineSuccess(idOffline) {
    const mensaje = `✅ Reporte guardado localmente (ID: ${idOffline}). Se enviará automáticamente cuando recuperes conexión.`;
    
    console.log('💾 Reporte offline guardado exitosamente');

    this.showAlert(mensaje, 'success');
    
    // Limpiar formulario
    setTimeout(() => {
        this.clearForm();
    }, 2000);
}

// 🆕 MÉTODO PARA AGREGAR SOLO EL NUEVO REPORTE OFFLINE
async agregarMarkerOfflineAlMapa(idOffline) {
    if (!window.mapaSistema || !window.mapaSistema.markerManager) {
        console.log('❌ No se puede agregar marker - mapa o markerManager no disponible');
        return;
    }
    
    try {
        console.log('📍 Intentando agregar marker offline al mapa:', idOffline);
        
        // Obtener el reporte recién guardado
        const reportes = await OfflineManager.obtenerReportesPendientes();
        const nuevoReporte = reportes.find(r => r.id === idOffline);
        
        if (nuevoReporte) {
            console.log('✅ Encontrado reporte para agregar como marker:', nuevoReporte);
            
            // Agregar solo este marker al mapa
            const lat = parseFloat(nuevoReporte.datos.latitud);
            const lng = parseFloat(nuevoReporte.datos.longitud);
            
            // Usar el MarkerManager para agregar el marker
            window.mapaSistema.markerManager.agregarMarkerOffline({
                id: idOffline,
                latitud: lat,
                longitud: lng,
                tipo_incidente: nuevoReporte.datos.id_tipo_incidente,
                descripcion: nuevoReporte.datos.descripcion,
                fecha: nuevoReporte.fecha
            });
            
        } else {
            console.log('❌ No se encontró el reporte recién guardado');
        }
    } catch (error) {
        console.error('❌ Error agregando marker offline:', error);
    }
}
    // 🆕 RECARGAR MAPA SOLO SI ES NECESARIO
    async recargarMapa() {
    if (window.mapaSistema && typeof window.mapaSistema.recargarReportes === 'function') {
        try {
            console.log('🗺️ Recargando mapa después de envío online...');
            await window.mapaSistema.recargarReportes();
        } catch (error) {
            console.error('❌ Error recargando mapa:', error);
        }
    }
}
actualizarMapaOffline() {
    console.log('📍 Actualizando mapa para modo offline (sin recargar todo)');
    
    // No recargar todos los reportes, solo manejar el nuevo
    if (window.mapaSistema && window.mapaSistema.markerManager) {
        // Opcional: limpiar solo markers offline si es necesario
        // window.mapaSistema.markerManager.limpiarMarkersOffline();
    }
}
    handleSubmitSuccess(message) {
        this.showAlert('✅ ' + message);
        this.clearForm();
        this.clearTemporaryMarker();
        this.reloadMapReports();
        this.uiManager.showSuccessAnimation();
    }

    handleSubmitError(message) {
        this.showAlert('❌ ' + message, 'error');
        this.uiManager.showErrorAnimation();
    }

    clearForm() {
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        if (form) form.reset();
        
        this.imageManager.clearImages();
        
        const latDisplay = document.querySelector(FormConstants.SELECTORS.LAT_DISPLAY);
        const lngDisplay = document.querySelector(FormConstants.SELECTORS.LNG_DISPLAY);
        
        if (latDisplay) latDisplay.textContent = 'No seleccionada';
        if (lngDisplay) lngDisplay.textContent = 'No seleccionada';
        
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        
        this.validationManager.clearAllErrors();
        this.cameraManager.deactivateCamera();
        
        console.log('🧹 Formulario limpiado');
    }

    clearTemporaryMarker() {
        if (window.mapaSistema && window.mapaSistema.mapaManager) {
            window.mapaSistema.mapaManager.limpiarMarcadorTemporal();
        }
    }

    async reloadMapReports() {
        if (window.mapaSistema && typeof window.mapaSistema.recargarReportes === 'function') {
            await window.mapaSistema.recargarReportes();
        }
    }

    showAlert(message, type = 'success') {
        // 🆕 USAR EL UIMANGER PARA MOSTRAR ALERTAS
        this.uiManager.showAlert(message, type);
    }

    updateCoordinates(lat, lng) {
        this.uiManager.updateCoordinates(lat, lng);
    }

    // 🆕 MÉTODO ÚNICO PARA CAMBIOS DE CONEXIÓN
    handleConnectionChange(online) {
        if (online) {
            this.updateOnlineUI();
        } else {
            this.updateOfflineUI();
        }
        
        const searchBtn = document.getElementById('btnBuscar');
        if (searchBtn) {
            searchBtn.disabled = !online;
            if (!online) {
                searchBtn.innerHTML = '🔍 Offline';
                searchBtn.title = 'La búsqueda no está disponible sin conexión';
            } else {
                searchBtn.innerHTML = 'Buscar';
                searchBtn.title = '';
            }
        }
        
        // Aplicar clase CSS para modo offline
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        if (form) {
            if (!online) {
                form.classList.add('offline-mode');
            } else {
                form.classList.remove('offline-mode');
            }
        }
    }

    // 🆕 MÉTODO PARA ACTUALIZAR INTERFAZ OFFLINE
    updateOfflineUI() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false; // 🆕 IMPORTANTE: NO DESHABILITAR
            submitBtn.innerHTML = '<span class="btn-text">💾 Guardar Localmente</span><span class="btn-loading" style="display: none;"><div class="spinner-mini"></div> Guardando...</span>';
            submitBtn.title = 'El reporte se guardará localmente y se enviará automáticamente cuando recuperes conexión';
            submitBtn.classList.add('offline-submit');
        }
    }

    // 🆕 MÉTODO PARA ACTUALIZAR INTERFAZ ONLINE
    updateOnlineUI() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">📝 Registrar Reporte</span><span class="btn-loading" style="display: none;"><div class="spinner-mini"></div> Procesando...</span>';
            submitBtn.title = '';
            submitBtn.classList.remove('offline-submit');
        }
    }

    // Método para limpieza global
    limpiarFormulario() {
        this.clearForm();
    }
}

export default FormManager;