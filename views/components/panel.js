// Panel.js - gestiona navegación inferior, feed, notificaciones y perfil
document.addEventListener('DOMContentLoaded', function() {
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

    navItems.forEach(i => i.addEventListener('click', onNavClick));

    // Referencias
    const feedView = document.getElementById('feedView');
    const notificationsView = document.getElementById('notificationsView');
    const profileView = document.getElementById('profileView');

    // Inicializar
    initAutoHideNav();
    cargarFeed();
    cargarPerfil();

    // Botones perfil
    document.getElementById('btnEditProfile').addEventListener('click', () => {
        document.getElementById('profileForm').style.display = 'block';
    });

    document.getElementById('btnCancelProfile').addEventListener('click', () => {
        document.getElementById('profileForm').style.display = 'none';
    });

    document.getElementById('btnSaveProfile').addEventListener('click', async () => {
        await guardarPerfil();
    });

    document.getElementById('editAvatarBtn').addEventListener('click', () => {
        document.getElementById('fotoPerfil').click();
    });

    // Función para inicializar el auto-ocultado de la navegación
    function initAutoHideNav() {
        // Ocultar después de 3 segundos de inactividad
        hideTimeout = setTimeout(hideNavigation, 3000);
        
        // Mostrar navegación al hacer hover en la zona de activación
        navActivationZone.addEventListener('mouseenter', showNavigation);
        navActivationZone.addEventListener('touchstart', showNavigation);
        
        // Mostrar navegación al hacer hover sobre ella misma
        bottomNav.addEventListener('mouseenter', showNavigation);
        bottomNav.addEventListener('touchstart', showNavigation);
        
        // Ocultar al salir del área de la navegación
        bottomNav.addEventListener('mouseleave', () => {
            if (!isUserInteracting()) {
                hideTimeout = setTimeout(hideNavigation, 1000);
            }
        });
        
        // Detectar scroll para auto-ocultar
        mainContent.addEventListener('scroll', handleScroll);
        
        // Resetear timer en interacciones
        document.addEventListener('mousemove', resetHideTimer);
        document.addEventListener('touchstart', resetHideTimer);
        document.addEventListener('click', resetHideTimer);
    }

    function handleScroll() {
        const scrollTop = mainContent.scrollTop;
        
        // Determinar dirección del scroll
        if (scrollTop > lastScrollTop) {
            scrollDirection = 'down';
        } else {
            scrollDirection = 'up';
        }
        lastScrollTop = scrollTop;
        
        // Ocultar al hacer scroll hacia abajo, mostrar al hacer scroll hacia arriba
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
            // Navegación oculta - botón más abajo
            mapButton.style.bottom = '20px';
        } else {
            // Navegación visible - botón arriba de la navegación
            mapButton.style.bottom = '80px';
        }
    }
}
function hideNavigation() {
    if (!isNavHidden) {
        bottomNav.classList.remove('visible');
        bottomNav.classList.add('hidden');
        navActivationZone.classList.add('active');
        mainContent.classList.remove('with-visible-nav');
        mainContent.classList.add('with-hidden-nav');
        isNavHidden = true;
        
        // Actualizar posición del botón
        actualizarPosicionBoton();
    }
}

function showNavigation() {
    clearTimeout(hideTimeout);
    if (isNavHidden) {
        bottomNav.classList.remove('hidden');
        bottomNav.classList.add('visible');
        navActivationZone.classList.remove('active');
        mainContent.classList.remove('with-hidden-nav');
        mainContent.classList.add('with-visible-nav');
        isNavHidden = false;
        
        // Actualizar posición del botón
        actualizarPosicionBoton();
        
        hideTimeout = setTimeout(hideNavigation, 3000);
    }
}

    function isUserInteracting() {
        // Verificar si el usuario está interactuando con la navegación
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
        
        // Manejar el botón flotante
        const mapButton = document.querySelector('.map-floating-button');
        
        if (target === 'mapView') {
            // Configurar mapa en pantalla completa
            targetElement.style.position = 'fixed';
            targetElement.style.top = '44px';
            targetElement.style.left = '0';
            targetElement.style.right = '0';
            targetElement.style.bottom = '0';
            targetElement.style.width = '100%';
            targetElement.style.height = 'calc(100vh - 44px)';
            targetElement.style.zIndex = '998';
            
            // Mostrar botón
            if (mapButton) {
                mapButton.style.display = 'flex';
                mapButton.classList.add('visible');
                mapButton.classList.remove('hidden');
            }
            
            // Asegurar que el iframe ocupe todo
            const iframe = targetElement.querySelector('iframe');
            if (iframe) {
                iframe.style.width = '100%';
                iframe.style.height = '100%';
            }
        } else {
            // Ocultar botón en otras vistas
            if (mapButton) {
                mapButton.style.display = 'none';
                mapButton.classList.remove('visible');
                mapButton.classList.add('hidden');
            }
        }
    }

    showNavigation();

    if (target === 'feedView') cargarFeed();
    if (target === 'notificationsView') cargarNotificaciones();
    if (target === 'profileView') cargarPerfil();
}

    // Cargar feed de reportes
    async function cargarFeed() {
    if (!feedView) return;
    
    feedView.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando publicaciones...</p></div>';
    try {
        const resp = await fetch('../controllers/reportecontrolador.php?action=listar');
        const data = await resp.json();

        if (!Array.isArray(data)) {
            feedView.innerHTML = '<p style="text-align:center; color:var(--danger); padding: 20px;">Error al cargar feed</p>';
            return;
        }

        if (data.length === 0) {
            feedView.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px;">No hay publicaciones aún. ¡Sé el primero en reportar!</p>';
            return;
        }

        feedView.innerHTML = '';
        data.forEach(post => {
            const avatar = post.imagen_url ? post.imagen_url : '/imagenes/fiveicon.png';
            const timeText = tiempoRelativo(new Date(post.fecha_reporte));
            const descripcionCorta = post.descripcion.length > 150 ? 
                post.descripcion.substring(0, 150) + '...' : post.descripcion;

            const div = document.createElement('div');
            div.className = 'post';
            div.innerHTML = `
                <div class="post-header">
                    <img src="${avatar}" class="avatar" onerror="this.src='/imagenes/fiveicon.png'">
                    <div class="user-info">
                        <div class="user-name">${escapeHtml(post.nombres || post.usuario_correo)} ${escapeHtml(post.apellidos || '')}</div>
                        <div class="post-meta">
                            <i class="fas fa-map-marker-alt"></i>
                            ${post.latitud}, ${post.longitud} · ${timeText}
                        </div>
                    </div>
                </div>
                <div class="post-desc" title="${escapeHtml(post.descripcion)}">${escapeHtml(descripcionCorta)}</div>
                ${post.imagen_url ? `
                    <img class="post-img" src="${post.imagen_url}" 
                         onerror="this.style.display='none'" 
                         alt="Imagen del reporte"
                         loading="lazy">
                ` : ''}
                <div class="post-actions">
                    <button class="btn-small" data-id="${post.id_reporte}" onclick="ComentariosManager.abrirComentarios(${post.id_reporte})">
                        <i class="fas fa-comment"></i> Comentar
                    </button>
                    <button class="btn-small" onclick="toggleLike(${post.id_reporte}, this)">
                        <i class="far fa-heart"></i> Me gusta
                    </button>
                </div>
            `;

            // Agregar funcionalidad de expandir descripción
            const descElement = div.querySelector('.post-desc');
            descElement.addEventListener('click', function() {
                if (this.style.webkitLineClamp) {
                    this.style.webkitLineClamp = 'unset';
                    this.title = '';
                } else {
                    this.style.webkitLineClamp = '4';
                    this.title = escapeHtml(post.descripcion);
                }
            });

            feedView.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        feedView.innerHTML = '<p style="text-align:center; color:var(--danger); padding: 20px;">Error al cargar publicaciones</p>';
    }
}

    // Notificaciones (mock mínimo: likes/comentarios recientes cercanos a tus coords)
    async function cargarNotificaciones() {
        if (!notificationsView) return;
        
        notificationsView.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando notificaciones...</p></div>';
        try {
            const resp = await fetch('../controllers/notificacion_controlador.php?action=listar');
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
                            <strong>${escapeHtml(n.origen_nombres || 'Usuario')}</strong>
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

    // Cargar perfil
   async function cargarPerfil() {
    try {
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener');
        
        // Verificar si la respuesta es JSON
        const contentType = resp.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('El servidor devolvió HTML en lugar de JSON');
            return;
        }
        
        const user = await resp.json();

        if (!user) return;

        // Solo mostrar datos que existen en la BD
        document.getElementById('profileAvatar').src = '/imagenes/fiveicon.png'; // Avatar por defecto
        document.getElementById('profileName').textContent = `${user.nombres || ''} ${user.apellidos || ''}`.trim();
        document.getElementById('profileEmail').textContent = user.correo || 'No disponible';
        document.getElementById('profilePhone').textContent = user.telefono || 'Sin teléfono';
        
        // Información personal en la tarjeta
        document.getElementById('profileNames').textContent = user.nombres || 'No disponible';
        document.getElementById('profileLastnames').textContent = user.apellidos || 'No disponible';
        document.getElementById('profileEmailCard').textContent = user.correo || 'No disponible';
        document.getElementById('profilePhoneCard').textContent = user.telefono || 'Sin teléfono';

        // Prefill form solo con datos existentes
        document.getElementById('inpNombres').value = user.nombres || '';
        document.getElementById('inpApellidos').value = user.apellidos || '';
        document.getElementById('inpTelefono').value = user.telefono || '';

    } catch (err) {
        console.warn('Error cargar perfil (no crítico):', err);
        // No hacer nada, dejar que la aplicación continúe
    }
}

    async function guardarPerfil() {
        const form = new FormData();
        const foto = document.getElementById('fotoPerfil').files[0];
        if (foto) form.append('foto', foto);
        form.append('nombres', document.getElementById('inpNombres').value);
        form.append('apellidos', document.getElementById('inpApellidos').value);
        form.append('telefono', document.getElementById('inpTelefono').value);
        form.append('ubicacion', document.getElementById('inpUbicacion').value);
        form.append('biografia', document.getElementById('inpBio').value);

        try {
            const resp = await fetch('../controllers/usuario_controlador.php?action=actualizar', {
                method: 'POST', body: form
            });
            const res = await resp.json();
            if (res.success) {
                alert('Perfil actualizado');
                document.getElementById('profileForm').style.display = 'none';
                await cargarPerfil();
            } else {
                alert('Error: ' + (res.mensaje || res.error || 'desconocido'));
            }
        } catch (err) {
            console.error(err);
            alert('Error al guardar perfil');
        }
    }
// Función para abrir mapa en pantalla completa
function abrirMapaCompleto() {
    const ventanaMapa = window.open(mapUrl, 'MapaOjoEnLaVia', 
        'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (ventanaMapa) {
        ventanaMapa.focus();
    } else {
        alert('Por favor permite las ventanas emergentes para esta función');
    }
}

// Y mantén esta modificación en onNavClick para ajustar la altura:
async function onNavClick(e) {
    navItems.forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');

    const target = e.currentTarget.getAttribute('data-target');
    document.querySelectorAll('#mainContent > div').forEach(d => d.style.display = 'none');
    
    const targetElement = document.getElementById(target);
    if (targetElement) {
        targetElement.style.display = 'block';
        
        // Si es el mapa, ajustar altura después de mostrarlo
        if (target === 'mapView') {
            setTimeout(ajustarAlturaMapa, 100);
        }
    }

    showNavigation();

    if (target === 'feedView') cargarFeed();
    if (target === 'notificationsView') cargarNotificaciones();
    if (target === 'profileView') cargarPerfil();
}

function ajustarAlturaMapa() {
    const mapContainer = document.querySelector('.map-container');
    const mapView = document.getElementById('mapView');
    
    if (mapContainer && mapView) {
        // Ocupar toda la altura disponible
        const viewportHeight = window.innerHeight;
        const headerHeight = document.querySelector('.app-header').offsetHeight;
        
        // Altura completa menos el header
        const alturaCalculada = viewportHeight - headerHeight;
        mapContainer.style.height = alturaCalculada + 'px';
        mapView.style.height = alturaCalculada + 'px';
        
        // También asegurarnos que el iframe ocupe todo
        const iframe = mapContainer.querySelector('iframe');
        if (iframe) {
            iframe.style.height = '100%';
            iframe.style.minHeight = alturaCalculada + 'px';
        }
    }
}

// Ajustar mapa al redimensionar
window.addEventListener('resize', function() {
    if (document.getElementById('mapView').style.display === 'block') {
        ajustarAlturaMapa();
    }
});
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

    window.toggleLike = async function(id_reporte, btn) {
        try {
            const form = new FormData();
            form.append('id_reporte', id_reporte);

            const resp = await fetch('../controllers/reportecontrolador.php?action=toggle_like', {
                method: 'POST', body: form
            });
            const r = await resp.json();
            if (r.success) {
                if (r.action === 'liked') {
                    btn.innerHTML = '<i class="fas fa-heart"></i> Ya me gusta';
                    btn.style.color = 'var(--danger)';
                } else {
                    btn.innerHTML = '<i class="far fa-heart"></i> Me gusta';
                    btn.style.color = '';
                }
            } else {
                alert('Error al procesar like');
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor');
        }
    }

    window.marcarLeida = async function(id, btn) {
        try {
            const form = new FormData(); 
            form.append('id_notificacion', id);
            const resp = await fetch('../controllers/notificacion_controlador.php?action=marcar_leida', { 
                method: 'POST', 
                body: form 
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
        // Marcar como leída y abrir la info del reporte
        if (id_reporte && id_reporte !== 'null') {
            // Abrir comentarios para ese reporte
            if (typeof ComentariosManager !== 'undefined' && ComentariosManager.abrirComentarios) {
                ComentariosManager.abrirComentarios(id_reporte);
            } else {
                alert('Función de comentarios no disponible');
            }
        } else {
            alert('No hay información de reporte asociada');
        }
    }

    // Función global para mostrar/ocultar navegación manualmente
    window.toggleNavigation = function() {
        if (isNavHidden) {
            showNavigation();
        } else {
            hideNavigation();
        }
    };

    // Función global para forzar mostrar la navegación
    window.showNavigation = showNavigation;

    // Función global para forzar ocultar la navegación
    window.hideNavigation = hideNavigation;
});