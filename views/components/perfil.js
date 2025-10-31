// perfil.js - VERSIÓN COMPATIBLE CON NUEVO CONTROLADOR

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
    }

    setupEventListeners() {
        const btnEditProfile = document.getElementById('btnEditProfile');
        const btnSaveProfile = document.getElementById('btnSaveProfile');
        const btnCancelProfile = document.getElementById('btnCancelProfile');

        if (btnEditProfile) btnEditProfile.addEventListener('click', () => this.mostrarFormularioEdicion());
        if (btnSaveProfile) btnSaveProfile.addEventListener('click', () => this.guardarPerfil());
        if (btnCancelProfile) btnCancelProfile.addEventListener('click', () => this.ocultarFormularioEdicion());
    }

    setupNavegacion() {
        const profileNav = document.querySelector('.nav-item[data-target="profileView"]');
        if (profileNav) {
            profileNav.addEventListener('click', () => {
                setTimeout(() => this.cargarPerfil(), 300);
            });
        }
    }

    async cargarPerfil() {
        if (this.perfilCargado) {
            this.mostrarDatosEnUI();
            return;
        }

        console.log('📱 Cargando perfil...');
        
        try {
            this.mostrarEstadoCarga(true);

            const resp = await fetch('../controllers/usuario_controlador.php?action=obtener', {
                credentials: 'include'
            });

            const data = await resp.json();
            console.log('📥 Respuesta del servidor:', data);

            if (data.success && data.data) {
                this.datosUsuario = {
                    id_usuario: data.data.id_usuario,
                    nombres: data.data.nombres,
                    apellidos: data.data.apellidos,
                    correo: data.data.correo,
                    telefono: data.data.telefono
                };
                
                this.perfilCargado = true;
                this.mostrarDatosEnUI();
                this.mostrarNotificacionPerfil('Perfil cargado correctamente', 'success');
            } else {
                throw new Error(data.error || 'Error al cargar perfil');
            }

        } catch (error) {
            console.error('❌ Error:', error);
            this.usarDatosBasicosSesion();
            this.mostrarNotificacionPerfil(error.message, 'error');
        } finally {
            this.mostrarEstadoCarga(false);
        }
    }

    usarDatosBasicosSesion() {
        this.datosUsuario = {
            id_usuario: window.usuarioId,
            nombres: window.usuarioNombres,
            apellidos: '',
            correo: window.usuarioCorreo,
            telefono: ''
        };
        this.mostrarDatosEnUI();
    }

    mostrarDatosEnUI() {
        if (!this.datosUsuario) return;

        const datos = this.datosUsuario;
        
        // Actualizar todos los elementos
        const elementos = {
            'profileName': `${datos.nombres} ${datos.apellidos}`.trim() || 'Usuario',
            'profileEmail': datos.correo || 'No disponible',
            'profilePhone': datos.telefono || 'No registrado',
            'profileNames': datos.nombres || 'No disponible',
            'profileLastnames': datos.apellidos || 'No disponible',
            'profileEmailCard': datos.correo || 'No disponible',
            'profilePhoneCard': datos.telefono || 'No registrado'
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.textContent = valor;
        });

        // Llenar formulario
        document.getElementById('inpNombres').value = datos.nombres || '';
        document.getElementById('inpApellidos').value = datos.apellidos || '';
        document.getElementById('inpTelefono').value = datos.telefono || '';
    }

    mostrarFormularioEdicion() {
        document.getElementById('profileForm').style.display = 'block';
        document.querySelector('.profile-main .profile-card:first-child').style.display = 'none';
    }

    ocultarFormularioEdicion() {
        document.getElementById('profileForm').style.display = 'none';
        document.querySelector('.profile-main .profile-card:first-child').style.display = 'block';
    }

    async guardarPerfil() {
        const btnSave = document.getElementById('btnSaveProfile');
        if (!btnSave) return;

        const originalText = btnSave.innerHTML;
        
        try {
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnSave.disabled = true;

            const formData = new FormData();
            formData.append('nombres', document.getElementById('inpNombres').value.trim());
            formData.append('apellidos', document.getElementById('inpApellidos').value.trim());
            formData.append('telefono', document.getElementById('inpTelefono').value.trim());

            const resp = await fetch('../controllers/usuario_controlador.php?action=actualizar', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await resp.json();
            console.log('📥 Respuesta actualización:', data);

            if (data.success) {
                this.perfilCargado = false; // Forzar recarga
                this.ocultarFormularioEdicion();
                this.mostrarNotificacionPerfil(data.mensaje, 'success');
                // Recargar datos
                setTimeout(() => this.cargarPerfil(), 1000);
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            this.mostrarNotificacionPerfil(error.message, 'error');
        } finally {
            btnSave.innerHTML = originalText;
            btnSave.disabled = false;
        }
    }

    mostrarNotificacionPerfil(mensaje, tipo = 'info') {
        // Código de notificaciones (mantener igual)
        const notification = document.createElement('div');
        notification.className = `perfil-notification perfil-notification-${tipo}`;
        notification.style.cssText = `
            position: fixed; top: 80px; right: 20px; padding: 12px 20px;
            background: ${tipo === 'error' ? '#e74c3c' : tipo === 'success' ? '#2ecc71' : '#3498db'};
            color: white; border-radius: 8px; z-index: 10000; max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = mensaje;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    mostrarEstadoCarga(cargando) {
        const elementos = document.querySelectorAll('#profileView [id^="profile"]');
        elementos.forEach(el => {
            if (!el.id.includes('View') && !el.id.includes('Form')) {
                el.textContent = cargando ? 'Cargando...' : el.textContent;
                el.style.opacity = cargando ? '0.7' : '1';
            }
        });
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    window.perfilManager = new PerfilManager();
});