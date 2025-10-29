// Panel.js - gestiona navegación inferior, feed, notificaciones y perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando panel...');
    
    // Esperar un poco más para que el DOM esté completamente cargado
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
            
            // Cargar datos iniciales
            cargarFeed();
            cargarPerfil();

            // Configurar botones del perfil de forma SEGURA
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
                    await guardarPerfil();
                });
            }
            
            if (editAvatarBtn) {
                editAvatarBtn.addEventListener('click', () => {
                    const fotoPerfil = document.getElementById('fotoPerfil');
                    if (fotoPerfil) fotoPerfil.click();
                });
            }

            console.log('✅ Panel inicializado correctamente');

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
                if (mainContent) {
                    mainContent.addEventListener('scroll', handleScroll);
                }
                
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
                if (!isNavHidden && bottomNav) {
                    bottomNav.classList.remove('visible');
                    bottomNav.classList.add('hidden');
                    navActivationZone.classList.add('active');
                    if (mainContent) {
                        mainContent.classList.remove('with-visible-nav');
                        mainContent.classList.add('with-hidden-nav');
                    }
                    isNavHidden = true;
                    
                    // Actualizar posición del botón
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

        } catch (error) {
            console.error('❌ Error durante la inicialización:', error);
        }
    }, 100);
});

// Función para cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '../logout.php';
    }
}

// Mejorar la experiencia en móviles
document.addEventListener('touchstart', function() {}, { passive: true });

// Cargar feed de reportes - VERSIÓN MEJORADA
async function cargarFeed() {
    console.log('📰 Cargando feed de reportes...');
    
    const feedView = document.getElementById('feedView');
    if (!feedView) {
        console.error('❌ feedView no encontrado');
        return;
    }
    
    // Mostrar estados de carga de forma segura
    const postsContainer = document.getElementById('postsContainer');
    const loadingPosts = document.getElementById('loadingPosts');
    const noPosts = document.getElementById('noPosts');
    
    // Función segura para mostrar/ocultar elementos
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
        // Fallback seguro
        console.warn('⚠️ Elementos del feed no encontrados, usando fallback');
        feedView.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Cargando reportes...</p></div>';
    }
    
    try {
        const resp = await fetch('../controllers/reportecontrolador.php?action=listar');
        
        // Verificar respuesta
        if (!resp.ok) {
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
                feedView.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 40px;">No hay reportes disponibles. ¡Sé el primero en reportar!</p>';
            }
            return;
        }

        // Limpiar y mostrar posts de forma segura
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
            // Fallback seguro
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
        
        // Manejo seguro de errores
        if (postsContainer && loadingPosts && noPosts) {
            mostrarElemento(loadingPosts, false);
            mostrarElemento(noPosts, true);
            noPosts.innerHTML = '<p style="text-align:center; color:var(--danger); padding: 20px;">Error al cargar reportes</p>';
        } else {
            feedView.innerHTML = '<p style="text-align:center; color:var(--danger); padding: 20px;">Error al cargar reportes</p>';
        }
    }
}

// Función para crear elemento de post - VERSIÓN ACTUALIZADA CON LIKES Y COMENTARIOS
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

// 🆕 FUNCIONES PARA EL SISTEMA DE LIKES Y COMENTARIOS

// Función para cargar likes de un post
async function cargarLikesPost(id_reporte, postElement) {
    try {
        const resp = await fetch(`../controllers/reportecontrolador.php?action=contar_likes&id_reporte=${id_reporte}`);
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
        const resp = await fetch(`../controllers/reportecontrolador.php?action=contar_comentarios&id_reporte=${id_reporte}`);
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
            body: formData
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

// Función para toggle like (ACTUALIZADA)
window.toggleLike = async function(id_reporte, btn) {
    try {
        const id_usuario = await obtenerUsuarioId();
        const formData = new FormData();
        formData.append('id_reporte', id_reporte);
        formData.append('id_usuario', id_usuario);

        const resp = await fetch('../controllers/reportecontrolador.php?action=toggle_like', {
            method: 'POST', 
            body: formData
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

// 🆕 Función temporal para obtener ID de usuario - IMPLEMENTA ESTO CON TU SISTEMA DE SESIONES
async function obtenerUsuarioId() {
    // Si ya tenemos el ID en la variable global, usarlo
    if (window.usuarioId) {
        return window.usuarioId;
    }
    
    // Si no está disponible, intentar obtenerlo del servidor
    try {
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener_id');
        const data = await resp.json();
        if (data.success && data.id_usuario) {
            window.usuarioId = data.id_usuario;
            return data.id_usuario;
        }
    } catch (error) {
        console.error('Error obteniendo ID de usuario:', error);
    }
    
    // Fallback: mostrar error y redirigir al login
    console.error('❌ No se pudo obtener el ID de usuario');
    alert('Error de autenticación. Serás redirigido al login.');
    window.location.href = '../index.php';
    return null;
}

// Función auxiliar para crear estructura de imágenes simple
function crearEstructuraImagenesSimple(imagenes) {
    if (!imagenes || imagenes.length === 0) return '';
    
    // Asegurarse de que las URLs sean seguras para HTML
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
    // Navegar a la vista del mapa
    const mapNavItem = document.querySelector('.nav-item[data-target="mapView"]');
    if (mapNavItem) {
        mapNavItem.click();
        
        // Esperar un poco a que se cargue el mapa y luego enviar el mensaje
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
            // Convertir coordenadas a números
            const lat = typeof reporte.latitud === 'string' ? parseFloat(reporte.latitud) : reporte.latitud;
            const lng = typeof reporte.longitud === 'string' ? parseFloat(reporte.longitud) : reporte.longitud;
            
            console.log('📍 Enviando al mapa:', { reportId: reporte.id_reporte, lat, lng });
            
            // Enviar mensaje al iframe con las coordenadas
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
            
            // Reintentar después de 2 segundos por si el mapa no está listo
            setTimeout(() => {
                mapIframe.contentWindow.postMessage(message, '*');
            }, 2000);
            
        } catch (error) {
            console.error('Error enviando coordenadas al mapa:', error);
            // Fallback: abrir el mapa con parámetros en la URL
            abrirMapaConCoordenadas(reporte);
        }
    } else {
        console.error('❌ No se puede acceder al iframe del mapa');
        // Fallback si no se puede comunicar con el iframe
        abrirMapaConCoordenadas(reporte);
    }
}

// Función fallback para abrir mapa con coordenadas en parámetros URL
function abrirMapaConCoordenadas(reporte) {
    const lat = typeof reporte.latitud === 'string' ? parseFloat(reporte.latitud) : reporte.latitud;
    const lng = typeof reporte.longitud === 'string' ? parseFloat(reporte.longitud) : reporte.longitud;
    
    // Usar la variable mapUrl que ya está definida en el scope global desde PHP
    const mapUrlWithParams = `${window.mapUrl || '<?php echo $mapUrl; ?>'}?lat=${lat}&lng=${lng}&reportId=${reporte.id_reporte}`;
    const mapIframe = document.querySelector('#mapView iframe');
    
    if (mapIframe) {
        mapIframe.src = mapUrlWithParams;
    }
}

// Cargar perfil - VERSIÓN MEJORADA Y ROBUSTA
async function cargarPerfil() {
    try {
        console.log('👤 Cargando información del perfil...');
        
        const resp = await fetch('../controllers/usuario_controlador.php?action=obtener');
        
        // Verificar si la respuesta es JSON
        const contentType = resp.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ El servidor devolvió HTML en lugar de JSON');
            mostrarErrorPerfil('Error al cargar perfil: respuesta inválida del servidor');
            return;
        }
        
        const user = await resp.json();

        if (!user || user.error) {
            console.warn('❌ No se pudo obtener información del usuario:', user?.error);
            mostrarErrorPerfil('No se pudo cargar la información del perfil');
            return;
        }

        console.log('✅ Datos del usuario recibidos:', user);

        // Función auxiliar para actualizar elementos de forma segura
        function actualizarElemento(id, valor, valorPorDefecto = 'No disponible') {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor || valorPorDefecto;
                console.log(`✅ Actualizado ${id}: ${valor || valorPorDefecto}`);
            } else {
                console.warn(`⚠️ Elemento no encontrado: ${id}`);
            }
        }

        // Lista de todos los elementos que podríamos necesitar actualizar
        const elementosPerfil = [
            // Información principal
            { id: 'profileName', valor: `${user.nombres || ''} ${user.apellidos || ''}`.trim() || 'Usuario' },
            { id: 'profileEmail', valor: user.correo, defecto: 'Correo no disponible' },
            { id: 'profilePhone', valor: user.telefono, defecto: 'Sin teléfono' },
            
            // Información personal en la tarjeta
            { id: 'profileNames', valor: user.nombres, defecto: 'No disponible' },
            { id: 'profileLastnames', valor: user.apellidos, defecto: 'No disponible' },
            { id: 'profileEmailCard', valor: user.correo, defecto: 'Correo no disponible' },
            { id: 'profilePhoneCard', valor: user.telefono, defecto: 'Sin teléfono' }
        ];

        // Actualizar todos los elementos
        elementosPerfil.forEach(item => {
            actualizarElemento(item.id, item.valor, item.defecto);
        });

        // Actualizar avatars
        const profileAvatar = document.getElementById('profileAvatar');
        const headerAvatar = document.getElementById('headerAvatar');
        
        if (profileAvatar) {
            profileAvatar.src = '/imagenes/fiveicon.png';
            console.log('✅ Avatar del perfil actualizado');
        } else {
            console.warn('⚠️ profileAvatar no encontrado');
        }
        
        if (headerAvatar) {
            headerAvatar.src = '/imagenes/fiveicon.png';
            console.log('✅ Avatar del header actualizado');
        } else {
            console.warn('⚠️ headerAvatar no encontrado');
        }

        // Prefill form solo con datos existentes
        const inpNombres = document.getElementById('inpNombres');
        const inpApellidos = document.getElementById('inpApellidos');
        const inpTelefono = document.getElementById('inpTelefono');
        
        if (inpNombres) {
            inpNombres.value = user.nombres || '';
            console.log('✅ Campo nombres del formulario actualizado');
        } else {
            console.warn('⚠️ inpNombres no encontrado');
        }
        
        if (inpApellidos) {
            inpApellidos.value = user.apellidos || '';
            console.log('✅ Campo apellidos del formulario actualizado');
        } else {
            console.warn('⚠️ inpApellidos no encontrado');
        }
        
        if (inpTelefono) {
            inpTelefono.value = user.telefono || '';
            console.log('✅ Campo teléfono del formulario actualizado');
        } else {
            console.warn('⚠️ inpTelefono no encontrado');
        }

        console.log('✅ Perfil cargado exitosamente');

    } catch (err) {
        console.error('❌ Error crítico al cargar perfil:', err);
        mostrarErrorPerfil('Error al conectar con el servidor');
    }
}


// Función para mostrar errores en el perfil
function mostrarErrorPerfil(mensaje) {
    console.log('🔄 Mostrando mensaje de error en perfil:', mensaje);
    
    // Intentar mostrar el error en diferentes lugares
    const elementosError = [
        'profileName',
        'profileEmail', 
        'profilePhone',
        'profileNames',
        'profileLastnames',
        'profileEmailCard',
        'profilePhoneCard'
    ];
    
    let elementosActualizados = 0;
    
    elementosError.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = 'Error al cargar';
            elemento.style.color = '#e74c3c';
            elementosActualizados++;
        }
    });
    
    console.log(`✅ ${elementosActualizados} elementos de error actualizados`);
    
    // Mostrar notificación temporal solo si estamos en una vista visible
    const profileView = document.getElementById('profileView');
    if (profileView && profileView.style.display !== 'none') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `
            <strong>⚠️ Error</strong>
            <p style="margin: 5px 0; font-size: 12px;">${mensaje}</p>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Notificaciones (ACTUALIZADA para usar el nuevo controlador)
async function cargarNotificaciones() {
    const notificationsView = document.getElementById('notificationsView');
    if (!notificationsView) {
        console.warn('❌ notificationsView no encontrado');
        return;
    }
    
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

async function guardarPerfil() {
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
            method: 'POST', body: form
        });
        const res = await resp.json();
        if (res.success) {
            alert('Perfil actualizado');
            const profileForm = document.getElementById('profileForm');
            if (profileForm) profileForm.style.display = 'none';
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
    // Usar la variable mapUrl que ya está definida en el scope global desde PHP
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

// Función auxiliar para formatear coordenadas de forma segura
function formatearCoordenada(coord) {
    if (coord === null || coord === undefined) {
        return 'No disponible';
    }
    
    // Convertir a número si es string
    const num = typeof coord === 'string' ? parseFloat(coord) : coord;
    
    // Verificar si es un número válido
    if (isNaN(num)) {
        return 'Inválida';
    }
    
    return num.toFixed(6);
}

// Función para formatear fecha
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

// Función para compartir reporte
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

// Función para ampliar imagen
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

// Función global para navegar al mapa (para uso externo)
window.navegarAlMapa = navegarAlMapa;