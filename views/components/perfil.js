// perfil.js - Gestión completa del perfil de usuario
// Esta versión usa datos de sesión inmediatamente y carga datos adicionales después

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
            console.log('✅ Listener para btnEditProfile configurado');
        } else {
            console.warn('⚠️ btnEditProfile no encontrado');
        }

        // Botón guardar cambios
        const btnSaveProfile = document.getElementById('btnSaveProfile');
        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', () => this.guardarPerfil());
            console.log('✅ Listener para btnSaveProfile configurado');
        } else {
            console.warn('⚠️ btnSaveProfile no encontrado');
        }

        // Botón cancelar edición
        const btnCancelProfile = document.getElementById('btnCancelProfile');
        if (btnCancelProfile) {
            btnCancelProfile.addEventListener('click', () => this.ocultarFormularioEdicion());
            console.log('✅ Listener para btnCancelProfile configurado');
        } else {
            console.warn('⚠️ btnCancelProfile no encontrado');
        }

        // Botón editar avatar
        const editAvatarBtn = document.getElementById('editAvatarBtn');
        if (editAvatarBtn) {
            editAvatarBtn.addEventListener('click', () => this.seleccionarNuevaFoto());
            console.log('✅ Listener para editAvatarBtn configurado');
        } else {
            console.warn('⚠️ editAvatarBtn no encontrado');
        }

        // Input de foto de perfil (oculto)
        const fotoPerfilInput = document.getElementById('fotoPerfil');
        if (fotoPerfilInput) {
            fotoPerfilInput.addEventListener('change', (e) => this.procesarNuevaFoto(e));
            console.log('✅ Listener para fotoPerfil configurado');
        }

        console.log('🔗 Todos los event listeners configurados');
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
            console.log('✅ Navegación de perfil configurada');
        } else {
            console.warn('⚠️ Botón de navegación del perfil no encontrado');
        }
    }

    // CARGA DE DATOS DEL PERFIL - VERSIÓN SIMPLIFICADA
    async cargarPerfil() {
        if (this.perfilCargado) {
            console.log('📊 Perfil ya cargado, mostrando datos existentes');
            this.mostrarDatosEnUI();
            return;
        }

        console.log('📱 Cargando perfil desde datos de sesión...');
        
        // Usar los datos que YA tenemos en las variables de sesión
        const datosBasicos = {
            id_usuario: window.usuarioId || 0,
            nombres: window.usuarioNombres || 'Usuario',
            apellidos: '', // No disponible en sesión inicialmente
            correo: window.usuarioCorreo || '',
            telefono: '', // No disponible en sesión inicialmente  
            foto_perfil: '/imagenes/default-avatar.png',
            nombre_rol: 'Usuario'
        };
        
        console.log('✅ Datos básicos desde sesión:', {
            id: datosBasicos.id_usuario,
            nombres: datosBasicos.nombres,
            correo: datosBasicos.correo
        });
        
        // Actualizar la UI inmediatamente con datos básicos
        this.datosUsuario = datosBasicos;
        this.perfilCargado = true;
        this.mostrarDatosEnUI();
        
        // Intentar cargar datos adicionales del servidor en segundo plano
        this.cargarDatosAdicionales();
    }

    // CARGA DE DATOS ADICIONALES DESDE EL SERVIDOR
    async cargarDatosAdicionales() {
        try {
            console.log('🔄 Cargando datos adicionales del servidor...');
            
            const resp = await fetch('../controllers/usuario_controlador.php?action=obtener', {
                credentials: 'include'
            });

            if (!resp.ok) {
                throw new Error(`Error HTTP: ${resp.status}`);
            }

            const data = await resp.json();
            
            if (data.success) {
                console.log('✅ Datos adicionales cargados:', data);
                
                // Combinar datos básicos con datos adicionales del servidor
                this.datosUsuario = { 
                    ...this.datosUsuario, 
                    ...data,
                    // Mantener foto_perfil si no viene del servidor
                    foto_perfil: data.foto_perfil || this.datosUsuario.foto_perfil
                };
                
                this.mostrarDatosEnUI();
                this.cargarEstadisticas();
                
                console.log('✅ Perfil completo cargado correctamente');
            } else {
                throw new Error(data.error || 'Error en respuesta del servidor');
            }
            
        } catch (error) {
            console.log('⚠️ No se pudieron cargar datos adicionales:', error.message);
            console.log('ℹ️ Usando datos básicos de sesión');
        }
    }

    // CARGA DE ESTADÍSTICAS
    async cargarEstadisticas() {
        try {
            console.log('📈 Cargando estadísticas...');
            
            const resp = await fetch('../controllers/usuario_controlador.php?action=obtener_estadisticas', {
                credentials: 'include'
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.success) {
                    this.actualizarEstadisticas(data.estadisticas);
                    console.log('✅ Estadísticas cargadas:', data.estadisticas);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error cargando estadísticas:', error);
            // No mostramos error al usuario para las estadísticas
        }
    }

    // ACTUALIZACIÓN DE LA INTERFAZ
    mostrarDatosEnUI() {
        if (!this.datosUsuario) {
            console.error('❌ No hay datos para mostrar');
            return;
        }

        try {
            console.log('🎨 Actualizando interfaz con datos del perfil...');
            
            const datos = this.datosUsuario;

            // 1. ACTUALIZAR HERO SECTION
            this.actualizarHeroSection(datos);

            // 2. ACTUALIZAR INFORMACIÓN PERSONAL
            this.actualizarInformacionPersonal(datos);

            // 3. ACTUALIZAR AVATAR
            this.actualizarAvatar(datos.foto_perfil);

            // 4. LLENAR FORMULARIO DE EDICIÓN
            this.llenarFormularioEdicion(datos);

            console.log('✅ Interfaz actualizada correctamente');

        } catch (error) {
            console.error('❌ Error actualizando la interfaz:', error);
        }
    }

    actualizarHeroSection(datos) {
        const nombreCompleto = `${datos.nombres || ''} ${datos.apellidos || ''}`.trim();
        this.actualizarElemento('profileName', nombreCompleto || 'Usuario');
        this.actualizarElemento('profileEmail', datos.correo || 'No disponible');
        this.actualizarElemento('profilePhone', this.formatearTelefono(datos.telefono));
    }

    actualizarInformacionPersonal(datos) {
        this.actualizarElemento('profileNames', datos.nombres || 'No disponible');
        this.actualizarElemento('profileLastnames', datos.apellidos || 'No disponible');
        this.actualizarElemento('profileEmailCard', datos.correo || 'No disponible');
        this.actualizarElemento('profilePhoneCard', this.formatearTelefono(datos.telefono));
    }

    actualizarAvatar(fotoPerfil) {
        console.log('🖼️ Actualizando avatar:', fotoPerfil);
        
        const avatares = [
            document.getElementById('headerAvatar'),
            document.getElementById('profileAvatar')
        ];

        avatares.forEach((avatar, index) => {
            if (avatar) {
                const tipo = index === 0 ? 'header' : 'profile';
                console.log(`📸 Cargando avatar ${tipo}`);
                this.cargarImagenSegura(avatar, fotoPerfil);
            }
        });
    }

    actualizarEstadisticas(estadisticas) {
        console.log('📊 Actualizando estadísticas:', estadisticas);
        
        const elementos = {
            'statReports': estadisticas.reportes,
            'statLikes': estadisticas.likes,
            'statComments': estadisticas.comentarios,
            'statViews': estadisticas.vistas
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor !== undefined && valor !== null ? valor : '0';
                // Animación simple para el cambio de números
                elemento.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    elemento.style.transform = 'scale(1)';
                }, 300);
            }
        });
    }

    llenarFormularioEdicion(datos) {
        console.log('📝 Llenando formulario de edición con datos:', datos);
        
        try {
            document.getElementById('inpNombres').value = datos.nombres || '';
            document.getElementById('inpApellidos').value = datos.apellidos || '';
            document.getElementById('inpTelefono').value = datos.telefono || '';
            console.log('✅ Formulario de edición preparado');
        } catch (error) {
            console.error('❌ Error llenando formulario de edición:', error);
        }
    }

    // GESTIÓN DEL FORMULARIO DE EDICIÓN
    mostrarFormularioEdicion() {
        console.log('📋 Mostrando formulario de edición');
        document.getElementById('profileForm').style.display = 'block';
        document.querySelector('.profile-main .profile-card:first-child').style.display = 'none';
        
        // Enfocar el primer campo
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

    async guardarPerfil() {
        console.log('💾 Iniciando guardado de perfil...');
        
        const btnSave = document.getElementById('btnSaveProfile');
        if (!btnSave) {
            console.error('❌ Botón guardar no encontrado');
            return;
        }

        const originalText = btnSave.innerHTML;
        
        try {
            // Preparar UI para guardado
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            btnSave.disabled = true;

            // Obtener y validar datos del formulario
            const datosFormulario = this.obtenerDatosFormulario();
            const errores = this.validarDatosFormulario(datosFormulario);
            
            if (errores.length > 0) {
                throw new Error(errores.join(', '));
            }

            console.log('📤 Enviando datos para actualizar:', datosFormulario);

            // Enviar datos al servidor
            const formData = new FormData();
            Object.entries(datosFormulario).forEach(([key, value]) => {
                formData.append(key, value);
            });

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
                this.datosUsuario = { ...this.datosUsuario, ...datosFormulario };
                this.perfilCargado = false; // Forzar recarga en próxima visita
                
                // Actualizar UI y ocultar formulario
                this.mostrarDatosEnUI();
                this.ocultarFormularioEdicion();
                
                // Mostrar notificación de éxito
                this.mostrarNotificacionPerfil('Perfil actualizado correctamente', 'success');
                
                // Actualizar sesión del lado del cliente si es necesario
                this.actualizarSesionCliente(datosFormulario);
                
            } else {
                throw new Error(data.error || 'Error del servidor al actualizar');
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

    obtenerDatosFormulario() {
        return {
            nombres: document.getElementById('inpNombres').value.trim(),
            apellidos: document.getElementById('inpApellidos').value.trim(),
            telefono: document.getElementById('inpTelefono').value.trim()
        };
    }

    validarDatosFormulario(datos) {
        const errores = [];

        if (!datos.nombres) {
            errores.push('El nombre es obligatorio');
        }

        if (!datos.apellidos) {
            errores.push('Los apellidos son obligatorios');
        }

        if (datos.nombres.length > 100) {
            errores.push('El nombre es demasiado largo');
        }

        if (datos.apellidos.length > 100) {
            errores.push('Los apellidos son demasiado largos');
        }

        if (datos.telefono && datos.telefono.length > 20) {
            errores.push('El teléfono es demasiado largo');
        }

        return errores;
    }

    // GESTIÓN DE FOTOS DE PERFIL
    seleccionarNuevaFoto() {
        console.log('📸 Solicitando selección de nueva foto');
        const fotoInput = document.getElementById('fotoPerfil');
        if (fotoInput) {
            fotoInput.click();
        } else {
            this.mostrarNotificacionPerfil('Funcionalidad de cambio de foto no disponible', 'info');
        }
    }

    procesarNuevaFoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('🖼️ Archivo seleccionado:', file.name, file.type, file.size);

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            this.mostrarNotificacionPerfil('Por favor selecciona una imagen válida', 'error');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.mostrarNotificacionPerfil('La imagen debe ser menor a 5MB', 'error');
            return;
        }

        // Mostrar preview
        this.mostrarPreviewFoto(file);
        
        // Aquí podrías subir la imagen automáticamente o esperar a que el usuario guarde
        this.mostrarNotificacionPerfil('Foto seleccionada. Haz clic en "Guardar Cambios" para actualizar.', 'info');
    }

    mostrarPreviewFoto(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatares = [
                document.getElementById('headerAvatar'),
                document.getElementById('profileAvatar')
            ];
            
            avatares.forEach(avatar => {
                if (avatar) {
                    avatar.src = e.target.result;
                }
            });
        };
        reader.readAsDataURL(file);
    }

    // SISTEMA DE NOTIFICACIONES DEL PERFIL (EVITA CONFLICTOS CON PANEL.JS)
    mostrarNotificacionPerfil(mensaje, tipo = 'info') {
        // Usar un nombre único para evitar conflictos
        const notificacionId = 'perfil-notification-' + Date.now();
        
        // Remover notificación anterior si existe
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
            font-family: inherit;
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
                setTimeout(() => {
                    if (document.getElementById(notificacionId)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // UTILIDADES
    actualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor && valor !== 'null' ? valor : 'No disponible';
        } else {
            console.warn(`⚠️ Elemento con ID ${id} no encontrado`);
        }
    }

    formatearTelefono(telefono) {
        if (!telefono || telefono === 'null' || telefono === 'No registrado') {
            return 'No registrado';
        }
        
        // Formato básico de teléfono
        const telefonoLimpio = telefono.replace(/\D/g, '');
        if (telefonoLimpio.length === 10) {
            return telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }
        
        return telefono;
    }

    cargarImagenSegura(elemento, url) {
        if (!elemento) return;

        // Si no hay URL válida, usar imagen por defecto
        if (!url || url === '' || url === 'null' || url === 'undefined') {
            const defaultAvatar = window.location.origin + '/imagenes/default-avatar.png';
            elemento.src = defaultAvatar;
            return;
        }

        let imagenUrl = url;
        
        // Convertir a URL absoluta si es relativa
        if (!url.startsWith('http') && !url.startsWith('data:')) {
            const baseUrl = window.location.origin;
            imagenUrl = baseUrl + (url.startsWith('/') ? url : '/' + url);
        }

        elemento.src = imagenUrl;
        
        // Manejar errores de carga
        elemento.onerror = function() {
            console.warn('❌ Error cargando imagen:', this.src);
            const defaultAvatar = window.location.origin + '/imagenes/default-avatar.png';
            this.src = defaultAvatar;
            this.onerror = null;
        };

        elemento.onload = function() {
            console.log('✅ Imagen cargada correctamente');
        };
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

    mostrarError(mensaje) {
        console.error('❌ Error en perfil:', mensaje);
        
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = 'Error al cargar';
            profileName.style.color = 'var(--danger, #e74c3c)';
        }
        
        this.mostrarNotificacionPerfil(mensaje, 'error');
    }

    actualizarSesionCliente(datos) {
        // Actualizar variables globales si existen
        if (window.usuarioNombres && datos.nombres) {
            window.usuarioNombres = datos.nombres;
        }
        
        // Podrías actualizar otros datos de sesión aquí si es necesario
        console.log('🔄 Datos de sesión del cliente actualizados');
    }

    // MÉTODOS PÚBLICOS
    recargarPerfil() {
        console.log('🔄 Recargando perfil...');
        this.perfilCargado = false;
        this.cargarPerfil();
    }

    obtenerDatosUsuario() {
        return this.datosUsuario;
    }

    estaCargado() {
        return this.perfilCargado;
    }
}

// INICIALIZACIÓN GLOBAL
function inicializarSistemaPerfil() {
    console.log('🚀 Iniciando sistema de perfil...');
    
    try {
        // Crear instancia global del gestor de perfil
        window.perfilManager = new PerfilManager();
        
        console.log('✅ Sistema de perfil inicializado correctamente');
        
        // Cargar perfil automáticamente si ya estamos en la vista de perfil
        if (document.getElementById('profileView')?.style.display === 'block') {
            console.log('📱 Vista de perfil visible, cargando datos...');
            setTimeout(() => {
                window.perfilManager.cargarPerfil();
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Error inicializando sistema de perfil:', error);
    }
}

// ESTILOS CSS PARA ANIMACIONES (inyectarlos dinámicamente con nombres únicos)
function inyectarEstilosPerfil() {
    const styles = `
        @keyframes perfilSlideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes perfilSlideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .perfil-notification {
            font-family: inherit;
            font-size: 14px;
        }
        
        /* Estilos específicos para el perfil que no interfieran con panel.js */
        .perfil-loading-state {
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .perfil-avatar-editor {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .perfil-avatar-editor:hover {
            transform: scale(1.05);
        }
        
        /* Estados específicos del perfil */
        .perfil-form-edit .form-input {
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            padding: 10px;
            width: 100%;
            transition: border-color 0.3s ease;
        }
        
        .perfil-form-edit .form-input:focus {
            border-color: var(--primary, #3498db);
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
    `;
    
    // Verificar si los estilos ya fueron inyectados para evitar duplicados
    if (!document.getElementById('perfil-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'perfil-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        console.log('🎨 Estilos del perfil inyectados correctamente');
    } else {
        console.log('🎨 Estilos del perfil ya estaban inyectados');
    }
}

// DIAGNÓSTICO DEL SISTEMA (opcional)
function diagnosticarSistemaPerfil() {
    console.log('🔍 DIAGNÓSTICO SISTEMA PERFIL:');
    console.log('- perfilManager:', window.perfilManager);
    console.log('- Elementos críticos:');
    console.log('  • profileView:', document.getElementById('profileView'));
    console.log('  • profileName:', document.getElementById('profileName'));
    console.log('  • profileAvatar:', document.getElementById('profileAvatar'));
    console.log('  • btnEditProfile:', document.getElementById('btnEditProfile'));
    console.log('  • btnSaveProfile:', document.getElementById('btnSaveProfile'));
    console.log('- Estilos inyectados:', document.getElementById('perfil-styles'));
    console.log('- Datos sesión JS:', {
        usuarioId: window.usuarioId,
        usuarioNombres: window.usuarioNombres,
        usuarioCorreo: window.usuarioCorreo
    });
}

// INICIALIZAR CUANDO EL DOCUMENTO ESTÉ LISTO
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, preparando sistema de perfil...');
    
    // Inyectar estilos
    inyectarEstilosPerfil();
    
    // Inicializar sistema de perfil con un pequeño delay
    setTimeout(() => {
        inicializarSistemaPerfil();
        
        // Ejecutar diagnóstico después de 2 segundos (opcional)
        setTimeout(diagnosticarSistemaPerfil, 2000);
    }, 100);
});

// EXPORTAR PARA USO EN MÓDULOS (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerfilManager, inicializarSistemaPerfil };
}