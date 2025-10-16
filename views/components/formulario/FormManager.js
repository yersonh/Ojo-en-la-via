import { FormConstants } from './utils/Constants.js';
import { ValidationManager } from './ValidationManager.js';
import { UIManager } from './UIManager.js';
import { ImageManager } from './ImageManager.js';
import { CameraManager } from './CameraManager.js';

// Asegúrate de que la clase esté exportada correctamente
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

        // Validar formulario
        if (!this.validationManager.validateForm()) {
            return;
        }

        this.uiManager.showLoadingState();

        try {
            console.log('📤 Enviando formulario...');
            
            const formData = new FormData(e.target);
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
                this.handleSubmitSuccess(result.mensaje);
            } else {
                throw new Error(result.mensaje || result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('💥 Error:', error);
            this.handleSubmitError(error.message);
        } finally {
            this.uiManager.hideLoadingState();
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
        // Limpiar campos del formulario
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        if (form) form.reset();
        
        // Limpiar imágenes
        this.imageManager.clearImages();
        
        // Limpiar coordenadas
        const latDisplay = document.querySelector(FormConstants.SELECTORS.LAT_DISPLAY);
        const lngDisplay = document.querySelector(FormConstants.SELECTORS.LNG_DISPLAY);
        
        if (latDisplay) latDisplay.textContent = 'No seleccionada';
        if (lngDisplay) lngDisplay.textContent = 'No seleccionada';
        
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        
        // Limpiar validaciones
        this.validationManager.clearAllErrors();
        
        // Limpiar cámara
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
        const alertSuccess = document.getElementById('alertSuccess');
        const alertError = document.getElementById('alertError');
        
        if (!alertSuccess || !alertError) return;
        
        if (type === 'success') {
            alertSuccess.textContent = message;
            alertSuccess.style.display = 'block';
            alertError.style.display = 'none';
            
            setTimeout(() => {
                alertSuccess.style.display = 'none';
            }, 5000);
        } else {
            alertError.textContent = message;
            alertError.style.display = 'block';
            alertSuccess.style.display = 'none';
        }
    }

    updateCoordinates(lat, lng) {
        this.uiManager.updateCoordinates(lat, lng);
    }

    // Métodos públicos para integración externa
    handleConnectionChange(online) {
        const submitBtn = document.querySelector(FormConstants.SELECTORS.SUBMIT_BTN);
        const searchBtn = document.getElementById('btnBuscar');
        
        if (submitBtn) {
            submitBtn.disabled = !online;
            if (!online) {
                submitBtn.innerHTML = '📶 Sin Conexión';
                submitBtn.title = 'No se puede enviar reportes sin conexión a Internet';
            } else {
                submitBtn.innerHTML = '<span class="btn-text">📝 Registrar Reporte</span><span class="btn-loading" style="display: none;"><div class="spinner-mini"></div> Procesando...</span>';
                submitBtn.title = '';
            }
        }
        
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

    // Método para limpieza global (backward compatibility)
    limpiarFormulario() {
        this.clearForm();
    }
}

// Exportación por defecto para mayor compatibilidad
export default FormManager;