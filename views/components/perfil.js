// perfil.js - VERSIÓN SIN IMÁGENES

class PerfilManager {
    constructor() {
        this.perfilCargado = false;
        this.datosUsuario = null;
        this.init();
    }

    init() {
        console.log('🔧 Inicializando PerfilManager...');
        this.setupEventListeners();
        this.setupNavegacion();
        console.log('✅ PerfilManager inicializado correctamente');
    }

    // CONFIGURACIÓN DE EVENT LISTENERS
    setupEventListeners() {
        console.log('🔗 Configurando event listeners del perfil...');
        
        // Botón editar perfil
        const btnEditProfile = document.getElementById('btnEditProfile');
        if (btnEditProfile) {
            btnEditProfile.addEventListener('click', () => this.mostrarFormularioEdicion());
        }

        // Botón guardar cambios
        const btnSaveProfile = document.getElementById('btnSaveProfile');
        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', () => this.guardarPerfil());
        }

        // Botón cancelar edición
        const btnCancelProfile = document.getElementById('btnCancelProfile');
        if (btnCancelProfile) {
            btnCancelProfile.addEventListener('click', () => this.ocultarFormularioEdicion());
        }

        // QUITAMOS los listeners de foto de perfil
        console.log('🔗 Event listeners configurados (sin gestión de imágenes)');
    }

    // CONFIGURACIÓN DE NAVEGACIÓN
    setupNavegacion() {
        const profileNav = document.querySelector('.nav-item[data-target="profileView"]');
        if (profileNav) {
            profileNav.addEventListener('click', () => {
                console.log('👤 Navegando a la vista de perfil');
                setTimeout(() => {
                    this.cargarPerfil();
                }, 300);
            });
        }
    }

    // CARGA DE DATOS DEL PERFIL
    async cargarPerfil() {
        if (this.perfilCargado) {
            console.log('📊 Perfil ya cargado, mostrando datos existentes');
            this.mostrarDatosEnUI();
            return;
        }

        console.log('📱 Cargando perfil completo desde el servidor...');
        
        try {
            this.mostrarEstadoCarga(true);

            const resp = await fetch('../controllers/usuario_controlador.php?action=obtener', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('📤 Estado de respuesta:', resp.status, resp.statusText);

            if (!resp.ok) {
                throw new Error(`Error HTTP: ${resp.status}`);
            }

            const data = await resp.json();
            console.log('📥 Datos recibidos del servidor:', data);

            // Si hay error de autenticación
            if (data.error === 'No autenticado') {
                throw new Error('Sesión expirada');
            }

            // Preparar datos del usuario
            this.datosUsuario = {
                id_usuario: data.id_usuario || window.usuarioId || 0,
                nombres: data.nombres || window.usuarioNombres || 'Usuario',
                apellidos: data.apellidos || '',
                correo: data.correo || window.usuarioCorreo || '',
                telefono: data.telefono || ''
            };

            console.log('✅ Datos del perfil preparados:', this.datosUsuario);

            // Actualizar UI
            this.perfilCargado = true;
            this.mostrarDatosEnUI();
            this.mostrarEstadoCarga(false);

        } catch (error) {
            console.error('❌ Error cargando perfil:', error);
            this.mostrarEstadoCarga(false);
            this.usarDatosBasicosSesion();
        }
    }

    // FALLBACK CON DATOS DE SESIÓN
    usarDatosBasicosSesion() {
        console.log('🔄 Usando datos básicos de sesión');
        
        this.datosUsuario = {
            id_usuario: window.usuarioId || 0,
            nombres: window.usuarioNombres || 'Usuario',
            apellidos: '',
            correo: window.usuarioCorreo || '',
            telefono: ''
        };
        
        this.mostrarDatosEnUI();
        this.mostrarNotificacionPerfil('No se pudieron cargar todos los datos', 'info');
    }

    // ACTUALIZACIÓN DE LA INTERFAZ
    mostrarDatosEnUI() {
        if (!this.datosUsuario) return;

        try {
            console.log('🎨 Actualizando interfaz con datos del perfil...');
            const datos = this.datosUsuario;

            // 1. ACTUALIZAR HERO SECTION
            const nombreCompleto = `${datos.nombres || ''} ${datos.apellidos || ''}`.trim();
            this.actualizarElemento('profileName', nombreCompleto || 'Usuario');
            this.actualizarElemento('profileEmail', datos.correo || 'No disponible');
            this.actualizarElemento('profilePhone', this.formatearTelefono(datos.telefono));

            // 2. ACTUALIZAR INFORMACIÓN PERSONAL
            this.actualizarElemento('profileNames', datos.nombres || 'No disponible');
            this.actualizarElemento('profileLastnames', datos.apellidos || 'No disponible');
            this.actualizarElemento('profileEmailCard', datos.correo || 'No disponible');
            this.actualizarElemento('profilePhoneCard', this.formatearTelefono(datos.telefono));

            // 3. QUITAMOS la actualización de avatar
            console.log('✅ Interfaz actualizada correctamente (sin avatar)');

        } catch (error) {
            console.error('❌ Error actualizando la interfaz:', error);
        }
    }

    llenarFormularioEdicion(datos) {
        console.log('📝 Llenando formulario de edición con datos:', datos);
        
        try {
            document.getElementById('inpNombres').value = datos.nombres || '';
            document.getElementById('inpApellidos').value = datos.apellidos || '';
            document.getElementById('inpTelefono').value = datos.telefono || '';
        } catch (error) {
            console.error('❌ Error llenando formulario de edición:', error);
        }
    }

    // GESTIÓN DEL FORMULARIO DE EDICIÓN
    mostrarFormularioEdicion() {
        console.log('📋 Mostrando formulario de edición');
        document.getElementById('profileForm').style.display = 'block';
        document.querySelector('.profile-main .profile-card:first-child').style.display = 'none';
        
        setTimeout(() => {
            const primerInput = document.getElementById('inpNombres');
            if (primerInput) primerInput.focus();
        }, 100);
    }

    ocultarFormularioEdicion() {
        console.log('📋 Ocultando formulario de edición');
        document.getElementById('profileForm').style.display = 'none';
        document.querySelector('.profile-main .profile-card:first-child').style.display = 'block';
    }

    // GUARDAR PERFIL - SIN IMÁGENES
    async guardarPerfil() {
        console.log('💾 Iniciando guardado de perfil...');
        
        const btnSave = document.getElementById('btnSaveProfile');
        if (!btnSave) return;

        const originalText = btnSave.innerHTML;
        
        try {
            // Preparar UI para guardado
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnSave.disabled = true;

            // Obtener datos del formulario
            const datosFormulario = {
                nombres: document.getElementById('inpNombres').value.trim(),
                apellidos: document.getElementById('inpApellidos').value.trim(),
                telefono: document.getElementById('inpTelefono').value.trim()
            };

            console.log('📤 Enviando datos para actualizar:', datosFormulario);

            // Crear FormData para enviar datos (sin imágenes)
            const formData = new FormData();
            formData.append('nombres', datosFormulario.nombres);
            formData.append('apellidos', datosFormulario.apellidos);
            formData.append('telefono', datosFormulario.telefono);

            const resp = await fetch('../controllers/usuario_controlador.php?action=actualizar', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await resp.json();
            console.log('📥 Respuesta del servidor:', data);

            if (data.success) {
                console.log('✅ Perfil actualizado correctamente');
                
                // Actualizar datos locales
                this.datosUsuario = { 
                    ...this.datosUsuario, 
                    ...datosFormulario 
                };
                this.perfilCargado = false;
                
                // Actualizar UI
                this.mostrarDatosEnUI();
                this.ocultarFormularioEdicion();
                
                // Mostrar notificación
                this.mostrarNotificacionPerfil('Perfil actualizado correctamente', 'success');
                
            } else {
                throw new Error(data.error || data.mensaje || 'Error del servidor');
            }

        } catch (error) {
            console.error('❌ Error guardando perfil:', error);
            this.mostrarNotificacionPerfil(error.message, 'error');
        } finally {
            // Restaurar botón
            btnSave.innerHTML = originalText;
            btnSave.disabled = false;
        }
    }

    // SISTEMA DE NOTIFICACIONES
    mostrarNotificacionPerfil(mensaje, tipo = 'info') {
        const notificacionId = 'perfil-notification-' + Date.now();
        
        // Remover notificación anterior
        const notificacionAnterior = document.querySelector('.perfil-notification');
        if (notificacionAnterior) {
            notificacionAnterior.remove();
        }

        const notification = document.createElement('div');
        notification.id = notificacionId;
        notification.className = `perfil-notification perfil-notification-${tipo}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            background: ${tipo === 'error' ? '#e74c3c' : tipo === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: perfilSlideInRight 0.3s ease-out;
        `;
        
        const icon = tipo === 'error' ? '❌' : tipo === 'success' ? '✅' : 'ℹ️';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${icon}</span>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (document.getElementById(notificacionId)) {
                notification.style.animation = 'perfilSlideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // UTILIDADES
    actualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor && valor !== 'null' ? valor : 'No disponible';
        }
    }

    formatearTelefono(telefono) {
        if (!telefono || telefono === 'null') {
            return 'No registrado';
        }
        return telefono;
    }

    mostrarEstadoCarga(cargando) {
        const elementos = document.querySelectorAll('#profileView [id^="profile"]');
        
        if (cargando) {
            elementos.forEach(el => {
                if (!el.id.includes('View') && !el.id.includes('Form')) {
                    el.textContent = 'Cargando...';
                    el.style.opacity = '0.7';
                }
            });
        } else {
            elementos.forEach(el => {
                el.style.opacity = '1';
            });
        }
    }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, preparando sistema de perfil...');
    
    // Inyectar estilos
    const styles = `
        @keyframes perfilSlideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes perfilSlideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    
    if (!document.getElementById('perfil-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'perfil-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    // Inicializar sistema de perfil
    setTimeout(() => {
        window.perfilManager = new PerfilManager();
        console.log('✅ Sistema de perfil inicializado correctamente');
    }, 100);
});

// DEBUG TEMPORAL - MEJORADO
function debugPerfil() {
    console.log('🐛 DEBUG PERFIL:');
    console.log('- URL Controlador:', '../controllers/usuario_controlador.php?action=obtener');
    console.log('- Sesión JS:', {
        usuarioId: window.usuarioId,
        usuarioNombres: window.usuarioNombres,
        usuarioCorreo: window.usuarioCorreo
    });
    
    // Probar la conexión con mejor manejo de errores
    fetch('../controllers/usuario_controlador.php?action=obtener', {
        credentials: 'include'
    })
    .then(r => {
        console.log('🔍 Respuesta HTTP:', r.status, r.statusText);
        if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.text(); // Usamos text() en lugar de json() para ver la respuesta cruda
    })
    .then(text => {
        console.log('🔍 Respuesta cruda:', text);
        try {
            const data = JSON.parse(text);
            console.log('🔍 Datos parseados:', data);
        } catch (e) {
            console.log('🔍 No es JSON válido:', e.message);
        }
    })
    .catch(err => console.error('🔍 Error prueba:', err));
}

// Ejecutar debug cuando se haga clic en perfil
document.addEventListener('DOMContentLoaded', function() {
    const profileNav = document.querySelector('.nav-item[data-target="profileView"]');
    if (profileNav) {
        profileNav.addEventListener('click', () => {
            setTimeout(debugPerfil, 1000);
        });
    }
});