import { FormConstants, AnimationConstants } from './utils/Constants.js';
import { FormHelpers } from './utils/Helpers.js';

export class UIManager {
    constructor(formManager) {
        this.formManager = formManager;
    }

    initialize() {
        FormHelpers.injectStyles();
        this.enhanceFormUI();
        this.setupVisualEffects();
        this.setupMobilePanel();
        this.setupMapIntegration();
    }

    enhanceFormUI() {
        console.log('🎨 Mejorando UI del formulario...');
        
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        form.classList.add('formulario-moderno');
        
        this.enhanceSelect();
        this.enhanceTextarea();
        this.enhanceButtons();
        
        console.log('✅ UI del formulario mejorada');
    }

    enhanceSelect() {
        const select = document.querySelector(FormConstants.SELECTORS.TIPO);
        if (select) {
            select.classList.add('select-moderno');
        }
    }

    enhanceTextarea() {
        const textarea = document.querySelector(FormConstants.SELECTORS.DESCRIPCION);
        if (textarea) {
            textarea.classList.add('textarea-moderno');
            textarea.setAttribute('placeholder', 'Describe detalladamente el incidente...');
        }
    }

    enhanceButtons() {
        const submitBtn = document.querySelector(FormConstants.SELECTORS.SUBMIT_BTN);
        if (submitBtn) {
            submitBtn.innerHTML = `
                <span class="btn-text">📝 Registrar Reporte</span>
                <span class="btn-loading" style="display: none;">
                    ${FormHelpers.createLoadingSpinner().outerHTML} Procesando...
                </span>
            `;
        }
        
        const fileBtn = document.querySelector(FormConstants.SELECTORS.BTN_SELECCIONAR_ARCHIVO);
        if (fileBtn) {
            fileBtn.innerHTML = '📁 Seleccionar Archivos';
        }
    }

    setupVisualEffects() {
        // Efecto de focus para todos los campos
        const fields = document.querySelectorAll('#formReporte select, #formReporte textarea, #formReporte input');
        
        fields.forEach(field => {
            field.addEventListener('focus', function() {
                this.parentElement.classList.add('campo-focus');
            });
            
            field.addEventListener('blur', function() {
                this.parentElement.classList.remove('campo-focus');
            });
        });
    }

    setupMobilePanel() {
        const panelToggle = document.getElementById('panelToggle');
        const panel = document.getElementById('panel');
        
        if (!panelToggle || !panel) return;
        
        panelToggle.addEventListener('click', function() {
            panel.classList.toggle('active');
            panelToggle.textContent = panel.classList.contains('active') ? '🗺️ Mapa' : '📋 Formulario';
        });
        
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsidePanel = panel.contains(event.target);
                const isClickOnToggle = panelToggle.contains(event.target);
                
                if (!isClickInsidePanel && !isClickOnToggle && panel.classList.contains('active')) {
                    panel.classList.remove('active');
                    panelToggle.textContent = '📋 Formulario';
                }
            }
        });
    }

    showLoadingState() {
        const submitBtn = document.querySelector(FormConstants.SELECTORS.SUBMIT_BTN);
        const loading = document.querySelector(FormConstants.SELECTORS.LOADING);
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loading').style.display = 'block';
        }
        
        if (loading) {
            FormHelpers.showElement(loading, false);
        }
    }

    hideLoadingState() {
        const submitBtn = document.querySelector(FormConstants.SELECTORS.SUBMIT_BTN);
        const loading = document.querySelector(FormConstants.SELECTORS.LOADING);
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.querySelector('.btn-text').style.display = 'block';
            submitBtn.querySelector('.btn-loading').style.display = 'none';
        }
        
        if (loading) {
            FormHelpers.hideElement(loading, false);
        }
    }

    showSuccessAnimation() {
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        form.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            form.style.transform = 'scale(1)';
        }, 300);
    }

    showErrorAnimation() {
        const form = document.querySelector(FormConstants.SELECTORS.FORM);
        form.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }

   updateCoordinates(lat, lng) {
    const latInput = document.getElementById('latitud');
    const lngInput = document.getElementById('longitud');
    const latDisplay = document.querySelector(FormConstants.SELECTORS.LAT_DISPLAY);
    const lngDisplay = document.querySelector(FormConstants.SELECTORS.LNG_DISPLAY);
    
    if (latInput && lngInput && latDisplay && lngDisplay) {
        // Actualizar inputs hidden
        latInput.value = lat;
        lngInput.value = lng;
        
        // Actualizar displays
        latDisplay.textContent = typeof lat === 'number' ? lat.toFixed(6) : lat;
        lngDisplay.textContent = typeof lng === 'number' ? lng.toFixed(6) : lng;
        
        console.log('✅ Coordenadas actualizadas en formulario:', lat, lng);
        
        // Efecto visual al actualizar coordenadas
        FormHelpers.addTemporaryStyle(
            latDisplay,
            {
                color: FormConstants.STYLES.SUCCESS_COLOR,
                fontWeight: '600'
            },
            2000
        );
        
        FormHelpers.addTemporaryStyle(
            lngDisplay,
            {
                color: FormConstants.STYLES.SUCCESS_COLOR,
                fontWeight: '600'
            },
            2000
        );
    } else {
        console.error('❌ No se encontraron elementos para actualizar coordenadas');
    }
}
// En UIManager.js, agrega este método:
setupMapIntegration() {
    // Escuchar eventos de ubicación del mapa
    document.addEventListener('ubicacionSeleccionada', (event) => {
        const { lat, lng } = event.detail;
        this.updateCoordinates(lat, lng);
    });
    
    // También escuchar cambios directos si el mapa los proporciona
    if (window.mapaSistema) {
        // Podrías agregar un listener directo al mapa si es necesario
        console.log('🔗 Integración con mapa configurada');
    }
}
}