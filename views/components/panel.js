// Panel.js - Versión corregida sin cierres de sesión agresivos
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando panel...');
    
    setTimeout(() => {
        try {
            const navItems = document.querySelectorAll('.nav-item');
            const bottomNav = document.querySelector('.bottom-nav');
            const mainContent = document.querySelector('.main');
            const navActivationZone = document.createElement('div');
            
            // Crear zona de activación
            navActivationZone.className = 'nav-activation-zone';
            document.body.appendChild(navActivationZone);
            
            // Estado de la navegación
            let isNavHidden = false;
            let hideTimeout = null;
            let lastScrollTop = 0;
            let scrollDirection = 'down';

            // Inicializar navegación
            navItems.forEach(i => i.addEventListener('click', onNavClick));
            initAutoHideNav();
            
            // Cargar datos iniciales (sin verificaciones agresivas de sesión)
            cargarFeedSuave();
            cargarPerfilSuave();

            // Configurar botones del perfil
            const btnEditProfile = document.getElementById('btnEditProfile');
            const btnCancelProfile = document.getElementById('btnCancelProfile');
            const btnSaveProfile = document.getElementById('btnSaveProfile');
            const editAvatarBtn = document.getElementById('editAvatarBtn');
            
            if (btnEditProfile) {
                btnEditProfile.addEventListener('click', () => {
                    const profileForm = document.getElementById('profileForm');
                    if (profileForm) profileForm.style.display = 'block';
                });
            }
            
            if (btnCancelProfile) {
                btnCancelProfile.addEventListener('click', () => {
                    const profileForm = document.getElementById('profileForm');
                    if (profileForm) profileForm.style.display = 'none';
                });
            }
            
            if (btnSaveProfile) {
                btnSaveProfile.addEventListener('click', async () => {
                    await guardarPerfilSuave();
                });
            }
            
            if (editAvatarBtn) {
                editAvatarBtn.addEventListener('click', () => {
                    const fotoPerfil = document.getElementById('fotoPerfil');
                    if (fotoPerfil) fotoPerfil.click();
                });
            }

            console.log('✅ Panel inicializado correctamente');

            function initAutoHideNav() {
                hideTimeout = setTimeout(hideNavigation, 3000);
                navActivationZone.addEventListener('mouseenter', showNavigation);
                navActivationZone.addEventListener('touchstart', showNavigation);
                bottomNav.addEventListener('mouseenter', showNavigation);
                bottomNav.addEventListener('touchstart', showNavigation);
                
                bottomNav.addEventListener('mouseleave', () => {
                    if (!isUserInteracting()) {
                        hideTimeout = setTimeout(hideNavigation, 1000);
                    }
                });
                
                if (mainContent) {
                    mainContent.addEventListener('scroll', handleScroll);
                }
                
                document.addEventListener('mousemove', resetHideTimer);
                document.addEventListener('touchstart', resetHideTimer);
                document.addEventListener('click', resetHideTimer);
            }

            function handleScroll() {
                const scrollTop = mainContent.scrollTop;
                if (scrollTop > lastScrollTop) {
                    scrollDirection = 'down';
                } else {
                    scrollDirection = 'up';
                }
                lastScrollTop = scrollTop;
                
                if (scrollDirection === 'down' && !isNavHidden) {
                    hideNavigation();
                } else if (scrollDirection === 'up' && isNavHidden) {
                    showNavigation();
                }
                
                resetHideTimer();
            }

            function resetHideTimer() {
                clearTimeout(hideTimeout);
                if (!isNavHidden) {
                    hideTimeout = setTimeout(hideNavigation, 3000);
                }
            }

            function actualizarPosicionBoton() {
                const mapButton = document.querySelector('.map-floating-button');
                const bottomNav = document.querySelector('.bottom-nav');
                
                if (mapButton && bottomNav) {
                    if (bottomNav.classList.contains('hidden')) {
                        mapButton.style.bottom = '20px';
                    } else {
                        mapButton.style.bottom = '80px';
                    }
                }
            }

            function hideNavigation() {
                if (!isNavHidden && bottomNav) {
                    bottomNav.classList.remove('visible');
                    bottomNav.classList.add('hidden');
                    navActivationZone.classList.add('active');
                    if (mainContent) {
                        mainContent.classList.remove('with-visible-nav');
                        mainContent.classList.add('with-hidden-nav');
                    }
                    isNavHidden = true;
                    actualizarPosicionBoton();
                }
            }

            function showNavigation() {
                clearTimeout(hideTimeout);
                if (isNavHidden && bottomNav) {
                    bottomNav.classList.remove('hidden');
                    bottomNav.classList.add('visible');
                    navActivationZone.classList.remove('active');
                    if (mainContent) {
                        mainContent.classList.remove('with-hidden-nav');
                        mainContent.classList.add('with-visible-nav');
                    }
                    isNavHidden = false;
                    actualizarPosicionBoton();
                    hideTimeout = setTimeout(hideNavigation, 3000);
                }
            }

            function isUserInteracting() {
                return bottomNav.matches(':hover') || navActivationZone.matches(':hover');
            }

            async function onNavClick(e) {
                navItems.forEach(n => n.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const target = e.currentTarget.getAttribute('data-target');
                document.querySelectorAll('#mainContent > div').forEach(d => {
                    d.style.display = 'none';
                });
                
                const targetElement = document.getElementById(target);
                if (targetElement) {
                    targetElement.style.display = 'block';
                    
                    const mapButton = document.querySelector('.map-floating-button');
                    
                    if (target === 'mapView') {
                        targetElement.style.position = 'fixed';
                        targetElement.style.top = '44px';
                        targetElement.style.left = '0';
                        targetElement.style.right = '0';
                        targetElement.style.bottom = '0';
                        targetElement.style.width = '100%';
                        targetElement.style.height = 'calc(100vh - 44px)';
                        targetElement.style.zIndex = '998';
                        
                        if (mapButton) {
                            mapButton.style.display = 'flex';
                            mapButton.classList.add('visible');
                            mapButton.classList.remove('hidden');
                        }
                        
                        const iframe = targetElement.querySelector('iframe');
                        if (iframe) {
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                        }
                    } else {
                        if (mapButton) {
                            mapButton.style.display = 'none';
                            mapButton.classList.remove('visible');
                            mapButton.classList.add('hidden');
                        }
                    }
                }

                showNavigation();

                if (target === 'feedView') cargarFeedSuave();
                if (target === 'notificationsView') cargarNotificacionesSuave();
                if (target === 'profileView') cargarPerfilCompletoSuave();
            }

        } catch (error) {
            console.error('❌ Error durante la inicialización:', error);
        }
    }, 100);
});

// VERSIÓN SEGURA DE LAS FUNCIONES PRINCIPALES - SIN REDIRECCIONES AGRESIVAS

// Cargar feed de forma segura
async function cargarFeedSuave() {
    console.log('📰 Cargando feed de reportes...');
    
    const feedView = document.getElementById('feedView');
    if (!feedView) {
        console.error('❌ feedView no encontrado');
        return;
    }
    
    const postsContainer = document.getElementById('postsContainer');
    const loadingPosts = document.getElementById('loadingPosts');
    const noPosts = document.getElementById('noPosts');
    
    function mostrarElemento(elemento, mostrar) {
        if (elemento && elemento.style) {
            elemento.style.display = mostrar ? 'block' : 'none';
        }
    }
    
    if (postsContainer && loadingPosts && noPosts) {
        postsContainer.innerHTML = '';
        mostrarElemento(loadingPosts, true);
        mostrarElemento(noPosts, false);
    } else {
        feedView.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando reportes...</p></div>';
    }
    
    try {
        const resp = await fetch('../controllers/reportecontrolador.php?action=listar', {
            credentials: 'include'
        });
        
        // MANEJO SEGURO DE ERRORES - SIN REDIRECCIONES
        if (!resp.ok) {
            if (resp.status === 401) {
                console.warn('⚠️ Posible problema de sesión al cargar feed');
                // No redirigir, solo mostrar error
                throw new Error('Problema de autenticación');
            }
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const data = await resp.json();

        if (!Array.isArray(data)) {
            throw new Error('Respuesta inválida del servidor');
        }

        if (data.length === 0) {
            if (postsContainer && loadingPosts && noPosts) {
                mostrarElemento(loadingPosts, false);
                mostrarElemento(noPosts, true);
            } else {
                feedView.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px;">No hay reportes disponibles.</p>';
            }
            return;
        }

        if (postsContainer && loadingPosts && noPosts) {
            mostrarElemento(loadingPosts, false);
            postsContainer.innerHTML = '';
            
            data.forEach(reporte => {
                try {
                    const postElement = crearPostElement(reporte);
                    if (postElement) {
                        postsContainer.appendChild(postElement);
                    }
                } catch (error) {
                    console.error('Error creando elemento de post:', error);
                }
            });
        } else {
            feedView.innerHTML = '';
            data.forEach(post => {
                try {
                    const postElement = crearPostElement(post);
                    if (postElement) {
                        feedView.appendChild(postElement);
                    }
                } catch (error) {
                    console.error('Error creando post fallback:', error);
                }
            });
        }

        console.log(`✅ Feed cargado: ${data.length} reportes`);

    } catch (err) {
        console.error('❌ Error cargando feed:', err);
        
        // MOSTRAR ERROR SIN REDIRIGIR
        if (postsContainer && loadingPosts && noPosts) {
            mostrarElemento(loadingPosts, false);
            mostrarElemento(noPosts, true);
            noPosts.innerHTML = '<p style="text-align:center; color:var(--warning); padding: 20px;">Problema al cargar reportes. Intenta recargar la página.</p>';
        } else {
            feedView.innerHTML = '<p style="text-align:center; color:var(--warning); padding: 20px;">Problema al cargar reportes.</p>';
        }
    }
}

// Cargar perfil de forma segura
async function cargarPerfilSuave() {
    try {
        console.log('👤 Cargando información del perfil...');
        
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener', {
            credentials: 'include'
        });
        
        // MANEJO SEGURO - NO REDIRIGIR EN ERROR 401
        if (!resp.ok) {
            if (resp.status === 401) {
                console.warn('⚠️ Posible problema de sesión al cargar perfil');
                // Mostrar datos por defecto en lugar de redirigir
                mostrarDatosPerfilPorDefecto();
                return;
            }
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const user = await resp.json();

        if (user && user.success === false) {
            console.warn('❌ Error del servidor:', user.error);
            // Mostrar datos por defecto en lugar de redirigir
            mostrarDatosPerfilPorDefecto();
            return;
        }

        console.log('✅ Datos del usuario recibidos:', user);
        actualizarUIUsuario(user);

    } catch (err) {
        console.error('❌ Error cargando perfil:', err);
        // Mostrar datos por defecto en lugar de redirigir
        mostrarDatosPerfilPorDefecto();
    }
}

// Función para mostrar datos por defecto cuando hay problemas de sesión
function mostrarDatosPerfilPorDefecto() {
    const elementosPerfil = [
        'profileName', 'profileEmail', 'profilePhone', 
        'profileNames', 'profileLastnames', 'profileEmailCard', 'profilePhoneCard'
    ];
    
    elementosPerfil.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (id === 'profileName') elemento.textContent = 'Usuario';
            else if (id.includes('Email')) elemento.textContent = 'correo@ejemplo.com';
            else if (id.includes('Phone')) elemento.textContent = 'Sin teléfono';
            else elemento.textContent = 'No disponible';
            elemento.style.color = '#999';
        }
    });
}

// Versiones seguras de otras funciones
async function cargarNotificacionesSuave() {
    const notificationsView = document.getElementById('notificationsView');
    if (!notificationsView) return;
    
    notificationsView.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando notificaciones...</p></div>';
    
    try {
        const resp = await fetch('../controllers/notificacion_controlador.php?action=listar', {
            credentials: 'include'
        });
        
        if (!resp.ok) {
            if (resp.status === 401) {
                notificationsView.innerHTML = '<div class="notification">Problema de sesión al cargar notificaciones</div>';
                return;
            }
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const data = await resp.json();

        if (!Array.isArray(data) || data.length === 0) {
            notificationsView.innerHTML = '<div class="notification">No tienes notificaciones.</div>';
            return;
        }

        notificationsView.innerHTML = '';
        data.forEach(n => {
            const div = document.createElement('div');
            div.className = 'notification';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${escapeHtml(n.origen_nombres || 'Sistema')}</strong>
                        <div style="font-size:13px; color:#666;">${escapeHtml(n.mensaje || n.tipo)}</div>
                        <div style="font-size:12px; color:#999;">${new Date(n.fecha).toLocaleString()}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <button class="btn-small" onclick="verNotificacion(${n.id_notificacion}, ${n.id_reporte || 'null'})">Ver</button>
                        <button class="btn-small" onclick="marcarLeida(${n.id_notificacion}, this)">${n.leida == 1 ? 'Leída' : 'Marcar leída'}</button>
                    </div>
                </div>
            `;
            notificationsView.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        notificationsView.innerHTML = '<div class="notification">Error al cargar notificaciones</div>';
    }
}

async function guardarPerfilSuave() {
    const form = new FormData();
    const foto = document.getElementById('fotoPerfil');
    if (foto && foto.files[0]) form.append('foto', foto.files[0]);
    
    const inpNombres = document.getElementById('inpNombres');
    const inpApellidos = document.getElementById('inpApellidos');
    const inpTelefono = document.getElementById('inpTelefono');
    
    if (inpNombres) form.append('nombres', inpNombres.value);
    if (inpApellidos) form.append('apellidos', inpApellidos.value);
    if (inpTelefono) form.append('telefono', inpTelefono.value);

    try {
        const resp = await fetch('../controllers/usuario_controlador.php?action=actualizar', {
            method: 'POST', 
            body: form,
            credentials: 'include'
        });
        
        if (!resp.ok) {
            if (resp.status === 401) {
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                return;
            }
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const res = await resp.json();
        if (res.success) {
            alert('Perfil actualizado');
            const profileForm = document.getElementById('profileForm');
            if (profileForm) profileForm.style.display = 'none';
            await cargarPerfilSuave();
        } else {
            alert('Error: ' + (res.mensaje || res.error || 'desconocido'));
        }
    } catch (err) {
        console.error(err);
        alert('Error al guardar perfil');
    }
}

async function cargarPerfilCompletoSuave() {
    try {
        console.log('👤 Cargando perfil completo...');
        await cargarPerfilSuave();
        await cargarEstadisticasUsuario();
        console.log('✅ Perfil completo cargado exitosamente');
    } catch (error) {
        console.error('❌ Error cargando perfil completo:', error);
    }
}

// FUNCIÓN PARA CARGAR ESTADÍSTICAS
async function cargarEstadisticasUsuario() {
    try {
        console.log('📊 Cargando estadísticas del usuario...');
        
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener_estadisticas', {
            credentials: 'include'
        });
        
        if (!resp.ok) {
            if (resp.status === 401) {
                console.warn('🔐 Sesión expirada en estadísticas');
                return;
            }
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        
        const data = await resp.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar estadísticas');
        }
        
        const stats = data.estadisticas || {
            reportes: 0,
            likes: 0,
            comentarios: 0,
            vistas: 0
        };
        
        console.log('✅ Estadísticas cargadas:', stats);
        actualizarEstadisticasUI(stats);
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        actualizarEstadisticasUI({
            reportes: 0,
            likes: 0,
            comentarios: 0,
            vistas: 0
        });
    }
}

// FUNCIÓN PARA ACTUALIZAR ESTADÍSTICAS EN UI
function actualizarEstadisticasUI(stats) {
    function formatearNumero(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    const elementosStats = [
        { id: 'statReports', valor: stats.reportes },
        { id: 'statLikes', valor: stats.likes },
        { id: 'statComments', valor: stats.comentarios },
        { id: 'statViews', valor: stats.vistas }
    ];
    
    elementosStats.forEach(stat => {
        const elemento = document.getElementById(stat.id);
        if (elemento) {
            elemento.textContent = formatearNumero(stat.valor);
        }
    });
}

// FUNCIÓN PARA ACTUALIZAR LA UI DEL USUARIO
function actualizarUIUsuario(user) {
    function actualizarElemento(id, valor, valorPorDefecto = 'No disponible') {
        const elemento = document.getElementById(id);
        if (elemento) {
            const valorSeguro = valor ? String(valor).trim() : '';
            elemento.textContent = valorSeguro || valorPorDefecto;
            elemento.style.color = '';
        }
    }

    const elementosPerfil = [
        { id: 'profileName', valor: `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario' },
        { id: 'profileEmail', valor: user.correo, defecto: 'Correo no disponible' },
        { id: 'profilePhone', valor: user.telefono, defecto: 'Sin teléfono' },
        { id: 'profileNames', valor: user.nombres, defecto: 'No disponible' },
        { id: 'profileLastnames', valor: user.apellidos, defecto: 'No disponible' },
        { id: 'profileEmailCard', valor: user.correo, defecto: 'Correo no disponible' },
        { id: 'profilePhoneCard', valor: user.telefono, defecto: 'Sin teléfono' }
    ];

    elementosPerfil.forEach(item => {
        actualizarElemento(item.id, item.valor, item.defecto);
    });

    // Actualizar avatars
    const profileAvatar = document.getElementById('profileAvatar');
    const headerAvatar = document.getElementById('headerAvatar');
    
    if (profileAvatar) {
        profileAvatar.src = '/imagenes/fiveicon.png';
        profileAvatar.onerror = function() {
            this.src = '/imagenes/default-avatar.png';
        };
    }
    
    if (headerAvatar) {
        headerAvatar.src = '/imagenes/fiveicon.png';
        headerAvatar.onerror = function() {
            this.src = '/imagenes/default-avatar.png';
        };
    }

    // Prefill form
    const inpNombres = document.getElementById('inpNombres');
    const inpApellidos = document.getElementById('inpApellidos');
    const inpTelefono = document.getElementById('inpTelefono');
    
    if (inpNombres) inpNombres.value = user.nombres || '';
    if (inpApellidos) inpApellidos.value = user.apellidos || '';
    if (inpTelefono) inpTelefono.value = user.telefono || '';

    console.log('✅ Perfil cargado exitosamente');
}

// FUNCIÓN PARA OBTENER ID DE USUARIO
async function obtenerUsuarioId() {
    if (window.usuarioId) {
        return window.usuarioId;
    }
    
    try {
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener_id', {
            credentials: 'include'
        });
        const data = await resp.json();
        if (data.success && data.id_usuario) {
            window.usuarioId = data.id_usuario;
            return data.id_usuario;
        }
    } catch (error) {
        console.error('Error obteniendo ID de usuario:', error);
    }
    
    return 0;
}

// Función para crear elemento de post
function crearPostElement(reporte) {
    try {
        const avatar = '/imagenes/default-avatar.png';
        const timeText = tiempoRelativo(new Date(reporte.fecha_reporte));
        const descripcionCorta = reporte.descripcion && reporte.descripcion.length > 150 ? 
            reporte.descripcion.substring(0, 150) + '...' : reporte.descripcion;

        const div = document.createElement('div');
        div.className = 'post';
        div.setAttribute('data-post-id', reporte.id_reporte);
        
        div.innerHTML = `
            <div class="post-header">
                <img src="${avatar}" class="avatar" alt="${reporte.usuario || 'Usuario'}" onerror="this.src='/imagenes/default-avatar.png'">
                <div class="user-info">
                    <div class="user-name">${escapeHtml(reporte.usuario || 'Usuario')}</div>
                    <div class="post-meta">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Ubicación en mapa</span>
                        <i class="fas fa-clock"></i>
                        <span>${timeText}</span>
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="post-incident-type">${escapeHtml(reporte.tipo_incidente || 'Tipo no especificado')}</span>
                    </div>
                    <div class="post-status">
                        <span class="status-badge ${(reporte.estado || 'pendiente').toLowerCase().replace(' ', '-')}">${reporte.estado || 'pendiente'}</span>
                    </div>
                </div>
            </div>
            
            ${reporte.imagenes && reporte.imagenes.length > 0 ? `
                <div class="post-images">
                    ${crearEstructuraImagenesSimple(reporte.imagenes)}
                </div>
            ` : ''}
            
            <div class="post-desc">${escapeHtml(reporte.descripcion || 'Sin descripción')}</div>
            
            <div class="post-additional-info">
                <div class="info-item">
                    <i class="fas fa-road"></i>
                    <span class="street-info">Coordenadas: ${formatearCoordenada(reporte.latitud)}, ${formatearCoordenada(reporte.longitud)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-day"></i>
                    <span class="report-date">${formatearFecha(reporte.fecha_reporte)}</span>
                </div>
            </div>
            
            <div class="post-actions">
                <button class="btn-small like-btn" data-report-id="${reporte.id_reporte}">
                    <i class="far fa-heart"></i>
                    <span class="like-count">0</span>
                </button>
                <button class="btn-small comment-btn" data-report-id="${reporte.id_reporte}">
                    <i class="fas fa-comment"></i>
                    <span>Comentarios (0)</span>
                </button>
                <button class="btn-small view-map-btn">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Ver en Mapa</span>
                </button>
            </div>
        `;

        // Agregar event listeners
        const likeBtn = div.querySelector('.like-btn');
        const commentBtn = div.querySelector('.comment-btn');
        const viewMapBtn = div.querySelector('.view-map-btn');
        const streetInfo = div.querySelector('.street-info');
        
        if (likeBtn) {
            likeBtn.addEventListener('click', () => toggleLike(reporte.id_reporte, likeBtn));
        }
        if (commentBtn) {
            commentBtn.addEventListener('click', () => {
                if (typeof ComentariosManager !== 'undefined' && ComentariosManager.abrirComentarios) {
                    ComentariosManager.abrirComentarios(reporte.id_reporte);
                } else {
                    alert('Función de comentarios no disponible');
                }
            });
        }
        if (viewMapBtn) viewMapBtn.addEventListener('click', () => navegarAlMapa(reporte));
        if (streetInfo) {
            streetInfo.style.cursor = 'pointer';
            streetInfo.title = 'Haz clic para ver en el mapa';
            streetInfo.addEventListener('click', () => navegarAlMapa(reporte));
        }

        // Cargar datos de likes y comentarios después de crear el elemento
        setTimeout(() => {
            cargarLikesPost(reporte.id_reporte, div);
            cargarComentariosPost(reporte.id_reporte, div);
            verificarLikeUsuario(reporte.id_reporte, div);
        }, 100);

        return div;
        
    } catch (error) {
        console.error('Error creando post:', error);
        return null;
    }
}

// Función para cargar likes de un post
async function cargarLikesPost(id_reporte, postElement) {
    try {
        const resp = await fetch(`../controllers/reportecontrolador.php?action=contar_likes&id_reporte=${id_reporte}`, {
            credentials: 'include'
        });
        const data = await resp.json();
        
        const likeCount = postElement.querySelector('.like-count');
        if (likeCount && data.total_likes !== undefined) {
            likeCount.textContent = data.total_likes;
        }
    } catch (error) {
        console.error('Error cargando likes:', error);
    }
}

// Función para cargar comentarios de un post
async function cargarComentariosPost(id_reporte, postElement) {
    try {
        const resp = await fetch(`../controllers/reportecontrolador.php?action=contar_comentarios&id_reporte=${id_reporte}`, {
            credentials: 'include'
        });
        const data = await resp.json();
        
        const commentBtn = postElement.querySelector('.comment-btn');
        if (commentBtn && data.total_comentarios !== undefined) {
            const commentText = commentBtn.querySelector('span');
            if (commentText) {
                commentText.textContent = `Comentarios (${data.total_comentarios})`;
            }
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
    }
}

// Función para verificar si el usuario actual dio like
async function verificarLikeUsuario(id_reporte, postElement) {
    try {
        const id_usuario = await obtenerUsuarioId();
        const formData = new FormData();
        formData.append('id_reporte', id_reporte);
        formData.append('id_usuario', id_usuario);
        
        const resp = await fetch('../controllers/reportecontrolador.php?action=verificar_like', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await resp.json();
        
        const likeBtn = postElement.querySelector('.like-btn');
        if (likeBtn && data.liked) {
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + (likeBtn.querySelector('.like-count')?.textContent || '0') + '</span>';
            likeBtn.style.color = 'var(--danger)';
        }
    } catch (error) {
        console.error('Error verificando like:', error);
    }
}

// Función para toggle like
window.toggleLike = async function(id_reporte, btn) {
    try {
        const id_usuario = await obtenerUsuarioId();
        const formData = new FormData();
        formData.append('id_reporte', id_reporte);
        formData.append('id_usuario', id_usuario);

        const resp = await fetch('../controllers/reportecontrolador.php?action=toggle_like', {
            method: 'POST', 
            body: formData,
            credentials: 'include'
        });
        const r = await resp.json();
        
        if (r.success) {
            const likeCount = btn.querySelector('.like-count');
            let currentCount = parseInt(likeCount.textContent) || 0;
            
            if (r.action === 'liked') {
                btn.innerHTML = '<i class="fas fa-heart"></i> <span class="like-count">' + (currentCount + 1) + '</span>';
                btn.style.color = 'var(--danger)';
                likeCount.textContent = currentCount + 1;
            } else {
                btn.innerHTML = '<i class="far fa-heart"></i> <span class="like-count">' + (currentCount - 1) + '</span>';
                btn.style.color = '';
                likeCount.textContent = Math.max(0, currentCount - 1);
            }
        } else {
            alert('Error al procesar like');
        }
    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor');
    }
}

// Función auxiliar para crear estructura de imágenes simple
function crearEstructuraImagenesSimple(imagenes) {
    if (!imagenes || imagenes.length === 0) return '';
    
    const imagenesSeguras = imagenes.map(img => {
        return img.replace(/'/g, "&#39;").replace(/"/g, "&#34;");
    });
    
    if (imagenesSeguras.length === 1) {
        return `<img src="${imagenesSeguras[0]}" alt="Imagen del reporte" class="post-image" onclick="ampliarImagen('${imagenesSeguras[0]}')">`;
    } else if (imagenesSeguras.length === 2) {
        return `
            <div class="images-grid two-images">
                ${imagenesSeguras.map(img => 
                    `<img src="${img}" alt="Imagen del reporte" class="post-image" onclick="ampliarImagen('${img}')">`
                ).join('')}
            </div>
        `;
    } else if (imagenesSeguras.length === 3) {
        return `
            <div class="images-grid three-images">
                ${imagenesSeguras.map(img => 
                    `<img src="${img}" alt="Imagen del reporte" class="post-image" onclick="ampliarImagen('${img}')">`
                ).join('')}
            </div>
        `;
    } else {
        const totalImagenes = imagenesSeguras.length;
        const imagenesMostradas = imagenesSeguras.slice(0, 4);
        const imagenesExtra = totalImagenes - 4;
        
        return `
            <div class="images-grid four-images ${imagenesExtra > 0 ? 'has-more-images' : ''}">
                ${imagenesMostradas.map(img => 
                    `<img src="${img}" alt="Imagen del reporte" class="post-image" onclick="ampliarImagen('${img}')">`
                ).join('')}
                ${imagenesExtra > 0 ? `
                    <div class="image-count-overlay">+${imagenesExtra}</div>
                ` : ''}
            </div>
        `;
    }
}

// Función para navegar al mapa con el reporte específico
function navegarAlMapa(reporte) {
    const mapNavItem = document.querySelector('.nav-item[data-target="mapView"]');
    if (mapNavItem) {
        mapNavItem.click();
        
        setTimeout(() => {
            enviarCoordenadasAlMapa(reporte);
        }, 1000);
    }
}

// Función para enviar las coordenadas al iframe del mapa
function enviarCoordenadasAlMapa(reporte) {
    const mapIframe = document.querySelector('#mapView iframe');
    if (mapIframe && mapIframe.contentWindow) {
        try {
            const lat = typeof reporte.latitud === 'string' ? parseFloat(reporte.latitud) : reporte.latitud;
            const lng = typeof reporte.longitud === 'string' ? parseFloat(reporte.longitud) : reporte.longitud;
            
            console.log('📍 Enviando al mapa:', { reportId: reporte.id_reporte, lat, lng });
            
            const message = {
                type: 'SHOW_REPORT',
                coordinates: {
                    lat: lat,
                    lng: lng
                },
                reportId: reporte.id_reporte,
                reportData: {
                    tipo_incidente: reporte.tipo_incidente,
                    descripcion: reporte.descripcion,
                    estado: reporte.estado,
                    usuario: reporte.usuario,
                    fecha_reporte: reporte.fecha_reporte
                }
            };
            
            mapIframe.contentWindow.postMessage(message, '*');
            
        } catch (error) {
            console.error('Error enviando coordenadas al mapa:', error);
        }
    }
}

// Función para abrir mapa en pantalla completa
function abrirMapaCompleto() {
    const url = window.mapUrl || '<?php echo $mapUrl; ?>';
    const ventanaMapa = window.open(url, 'MapaOjoEnLaVia', 
        'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (ventanaMapa) {
        ventanaMapa.focus();
    } else {
        alert('Por favor permite las ventanas emergentes para esta función');
    }
}

// Utilidades
function tiempoRelativo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return diff + 's';
    if (diff < 3600) return Math.floor(diff/60) + 'm';
    if (diff < 86400) return Math.floor(diff/3600) + 'h';
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) { 
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; 
    });
}

function formatearCoordenada(coord) {
    if (coord === null || coord === undefined) {
        return 'No disponible';
    }
    
    const num = typeof coord === 'string' ? parseFloat(coord) : coord;
    
    if (isNaN(num)) {
        return 'Inválida';
    }
    
    return num.toFixed(6);
}

function formatearFecha(fechaString) {
    try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Fecha no disponible';
    }
}

window.marcarLeida = async function(id, btn) {
    try {
        const form = new FormData(); 
        form.append('id_notificacion', id);
        const resp = await fetch('../controllers/notificacion_controlador.php?action=marcar_leida', { 
            method: 'POST', 
            body: form,
            credentials: 'include'
        });
        const r = await resp.json();
        if (r.success) {
            btn.textContent = 'Leída';
            btn.disabled = true;
        }
    } catch (e) { 
        console.error(e); 
        alert('Error al marcar como leída');
    }
}

window.verNotificacion = function(id_notificacion, id_reporte) {
    if (id_reporte && id_reporte !== 'null') {
        if (typeof ComentariosManager !== 'undefined' && ComentariosManager.abrirComentarios) {
            ComentariosManager.abrirComentarios(id_reporte);
        } else {
            alert('Función de comentarios no disponible');
        }
    } else {
        alert('No hay información de reporte asociada');
    }
}

window.compartirReporte = function(reporte) {
    const texto = `Reporte de ${reporte.tipo_incidente}: ${reporte.descripcion}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Ojo en la Vía - Reporte',
            text: texto,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(texto).then(() => {
            alert('Reporte copiado al portapapeles');
        });
    }
}

window.ampliarImagen = function(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <img src="${src}" alt="Imagen ampliada">
        <button class="image-modal-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

window.navegarAlMapa = navegarAlMapa;

// Función para cerrar sesión (solo cuando el usuario lo solicita)
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '../logout.php';
    }
}

// Mejorar la experiencia en móviles
document.addEventListener('touchstart', function() {}, { passive: true });