// FUNCIÓN MEJORADA PARA CARGAR PERFIL
async function cargarPerfil() {
    try {
        console.log('🔍 Iniciando carga de perfil...');
        
        const timestamp = new Date().getTime();
        const url = `/controllers/usuario_controlador.php?action=obtener&_=${timestamp}`;
        
        console.log('📡 URL de petición:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            credentials: 'include',
            redirect: 'manual'
        });

        console.log('📊 Estado de respuesta:', response.status, response.type);

        if (response.status === 301 || response.status === 302) {
            const redirectUrl = response.headers.get('Location');
            console.warn('⚠️ Redirección detectada:', redirectUrl);
            
            if (redirectUrl && redirectUrl.includes('index.php')) {
                mostrarMensajeError('Sesión expirada. Redirigiendo...');
                setTimeout(() => {
                    window.location.href = '/index.php';
                }, 2000);
                return;
            }
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Respuesta no es JSON: ${contentType}`);
        }

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Perfil cargado exitosamente:', data);
        
        actualizarUIperfil(data);
        
    } catch (error) {
        console.error('❌ Error crítico al cargar perfil:', error);
        
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('redirected') ||
            error.message.includes('net::ERR_TOO_MANY_REDIRECTS')) {
            
            mostrarMensajeError('Problema de autenticación. Verificando sesión...');
            setTimeout(() => verificarSesion(), 1000);
            
        } else if (error.message.includes('no es JSON')) {
            mostrarMensajeError('Error en el servidor. Recargando...');
            setTimeout(() => location.reload(), 3000);
        } else {
            mostrarMensajeError('Error de conexión con el servidor');
        }
    }
}

// FUNCIÓN PARA VERIFICAR SESIÓN
async function verificarSesion() {
    try {
        const response = await fetch('/test_session.php');
        const sessionData = await response.json();
        console.log('🔐 Estado de sesión:', sessionData);
        
        if (!sessionData.usuario_id || sessionData.usuario_id === 'NO_SET') {
            mostrarMensajeError('Sesión no válida. Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = '/index.php';
            }, 2000);
        } else {
            mostrarMensajeError('Sesión activa pero hay problemas de servidor');
            setTimeout(() => cargarPerfil(), 5000);
        }
    } catch (sessionError) {
        console.error('❌ Error verificando sesión:', sessionError);
        mostrarMensajeError('No se pudo verificar la sesión');
    }
}

// FUNCIÓN MEJORADA PARA ACTUALIZAR UI DEL PERFIL
function actualizarUIperfil(data) {
    try {
        if (data.success && data.usuario) {
            const usuario = data.usuario;
            
            const elementsToUpdate = {
                'nombreUsuario': usuario.nombres || 'Usuario',
                'correoUsuario': usuario.correo || 'No especificado',
                'telefonoUsuario': usuario.telefono || 'No especificado',
                'rolUsuario': usuario.nombre_rol || 'Usuario',
                'fechaRegistro': usuario.fecha_registro ? 
                    new Date(usuario.fecha_registro).toLocaleDateString() : 'No disponible'
            };
            
            Object.entries(elementsToUpdate).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
            
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            
            console.log('✅ UI de perfil actualizada correctamente');
            
        } else {
            throw new Error(data.mensaje || 'Error en datos del perfil');
        }
    } catch (uiError) {
        console.error('❌ Error actualizando UI:', uiError);
        mostrarMensajeError('Error mostrando información del perfil');
    }
}

// FUNCIÓN MEJORADA PARA ESTADÍSTICAS
async function cargarEstadisticasUsuario() {
    try {
        console.log('📊 Cargando estadísticas...');
        
        const timestamp = new Date().getTime();
        const response = await fetch(`/controllers/usuario_controlador.php?action=obtener_estadisticas&_=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            },
            credentials: 'include',
            redirect: 'manual'
        });

        console.log('📈 Estado de estadísticas:', response.status);

        if (response.status >= 300 && response.status < 400) {
            console.warn('⚠️ Estadísticas redirigidas - posible problema de sesión');
            return null;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Estadísticas cargadas:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        return null;
    }
}

// FUNCIÓN PARA MOSTRAR MENSAJES DE ERROR
function mostrarMensajeError(mensaje) {
    console.log('🔄 Mostrando mensaje de error en perfil:', mensaje);
    
    const errorElements = document.querySelectorAll('.error-message, .alert-error');
    errorElements.forEach(element => {
        element.textContent = mensaje;
        element.style.display = 'block';
    });
    
    document.querySelectorAll('.loading, .spinner').forEach(element => {
        element.style.display = 'none';
    });
}