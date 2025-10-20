// Panel.js - gestiona navegación inferior, feed, notificaciones y perfil
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.addEventListener('click', onNavClick));

    const feedPosts = document.getElementById('feedPosts');
    const notificationsPreview = document.getElementById('notificationsPreview');
    const notificationsView = document.getElementById('notificationsView');
    const profileView = document.getElementById('profileView');
    const notificationsBadge = document.getElementById('notificationsBadge');
    const notificationsNavItem = document.querySelector('.nav-item[data-target="notificationsView"]');

    let cachedNotifications = null;
    let notificationsRequest = null;

    cargarFeed();
    cargarPerfil();

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

    async function onNavClick(evt) {
        navItems.forEach(n => n.classList.remove('active'));
        evt.currentTarget.classList.add('active');

        const target = evt.currentTarget.getAttribute('data-target');
        document.querySelectorAll('#mainContent > div').forEach(d => d.style.display = 'none');

        const targetElement = document.getElementById(target);
        if (targetElement) {
            targetElement.style.display = 'block';
        }

        if (target === 'feedView') {
            cargarFeed();
        } else if (target === 'notificationsView') {
            cargarNotificaciones(true);
        } else if (target === 'profileView') {
            cargarPerfil();
        }
    }

    async function cargarFeed() {
        if (!feedPosts) return;

        feedPosts.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Cargando publicaciones...</p>
            </div>
        `;

        try {
            const resp = await fetch('../controllers/reportecontrolador.php?action=listar', { cache: 'no-store' });
            const data = await resp.json();

            if (!Array.isArray(data)) {
                feedPosts.innerHTML = '<p style="text-align:center; color:#d9534f;">Error al cargar feed.</p>';
                return;
            }

            if (data.length === 0) {
                feedPosts.innerHTML = '<p style="text-align:center; color:#666;">No hay publicaciones aún.</p>';
                notificationsPreview?.classList.remove('active');
                if (notificationsPreview) notificationsPreview.innerHTML = '';
                await actualizarNotificacionesPreview();
                return;
            }

            feedPosts.innerHTML = '';
            data.forEach(post => {
                feedPosts.appendChild(crearTarjetaPost(post));
            });
            feedPosts.scrollTop = 0;

            await actualizarNotificacionesPreview();
        } catch (err) {
            console.error(err);
            feedPosts.innerHTML = '<p style="text-align:center; color:#d9534f;">Error al cargar publicaciones.</p>';
        }
    }

    function crearTarjetaPost(post) {
        const div = document.createElement('div');
        div.className = 'post';

        const avatar = post.foto_perfil || '../imagenes/fiveicon.png';
        const primeraImagen = Array.isArray(post.imagenes) && post.imagenes.length ? post.imagenes[0] : (post.imagen_url || '');
        const liked = Boolean(Number(post.user_liked || 0));
        const totalLikes = Number(post.total_likes || 0);
        const timeText = tiempoRelativo(new Date(post.fecha_reporte));
        const ubicacion = [post.latitud, post.longitud].filter(Boolean).join(', ');
        const descripcion = escapeHtml(post.descripcion || '').replace(/\n/g, '<br>');
        const nombre = `${escapeHtml(post.nombres || post.usuario_correo || 'Usuario')} ${escapeHtml(post.apellidos || '')}`.trim();

        div.innerHTML = `
            <div class="post-header">
                <img src="${avatar}" class="avatar" onerror="this.src='../imagenes/fiveicon.png'" alt="avatar">
                <div class="user-info">
                    <div class="user-name">${nombre}</div>
                    <div class="post-meta">${ubicacion || 'Sin ubicación'} · ${timeText}</div>
                </div>
            </div>
            <div class="post-desc">${descripcion}</div>
            ${primeraImagen ? `<img class="post-img" src="${primeraImagen}" alt="reporte" onerror="this.style.display='none'">` : ''}
            <div class="post-actions">
                <button class="btn-small" data-like-button data-liked="${liked ? '1' : '0'}" data-id="${post.id_reporte}">
                    ${liked ? '♥ Ya me gusta' : '♡ Me gusta'} (${totalLikes})
                </button>
                <button class="btn-small" data-comment-button data-id="${post.id_reporte}">💬 Comentar</button>
            </div>
        `;

        const likeBtn = div.querySelector('[data-like-button]');
        likeBtn.addEventListener('click', () => toggleLike(post.id_reporte, likeBtn));

        const commentBtn = div.querySelector('[data-comment-button]');
        commentBtn.addEventListener('click', () => {
            if (window.ComentariosManager && typeof window.ComentariosManager.abrirComentarios === 'function') {
                window.ComentariosManager.abrirComentarios(post.id_reporte);
            } else {
                alert('Función de comentarios no disponible');
            }
        });

        return div;
    }

    async function cargarNotificaciones(force = false) {
        if (!notificationsView) return;

        if (force) {
            cachedNotifications = null;
        }

        notificationsView.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Cargando notificaciones...</p>
            </div>
        `;

        const data = await obtenerNotificaciones(force);
        renderNotificationsList(data);
    }

    async function obtenerNotificaciones(force = false) {
        if (!force && cachedNotifications) {
            return cachedNotifications;
        }

        if (notificationsRequest && !force) {
            return notificationsRequest;
        }

        notificationsRequest = fetch('../controllers/notificacion_controlador.php?action=listar', { cache: 'no-store' })
            .then(resp => resp.json())
            .then(data => {
                cachedNotifications = Array.isArray(data) ? data : [];
                notificationsRequest = null;
                actualizarBadge(cachedNotifications);
                return cachedNotifications;
            })
            .catch(err => {
                console.error('Error cargando notificaciones', err);
                notificationsRequest = null;
                cachedNotifications = [];
                actualizarBadge([]);
                return [];
            });

        return notificationsRequest;
    }

    async function actualizarNotificacionesPreview(force = false) {
        if (!notificationsPreview) return;
        const data = await obtenerNotificaciones(force);
        renderNotificationsPreview(data);
    }

    function renderNotificationsPreview(notifications) {
        if (!notifications || notifications.length === 0) {
            notificationsPreview.classList.remove('active');
            notificationsPreview.innerHTML = '';
            return;
        }

        const unread = notifications.filter(n => !Number(n.leida)).length;
        const topThree = notifications.slice(0, 3);

        const itemsHtml = topThree.map(n => {
            const mensaje = escapeHtml(n.mensaje || n.tipo || 'Notificación');
            const origen = escapeHtml(n.origen_nombres ? `${n.origen_nombres} ${n.origen_apellidos || ''}`.trim() : 'Usuario');
            const fecha = tiempoRelativo(new Date(n.fecha));
            const unreadClass = Number(n.leida) ? '' : 'unread';
            return `
                <div class="notifications-preview-item ${unreadClass}" data-id="${n.id_notificacion}" data-reporte="${n.id_reporte || ''}">
                    <div>
                        <strong>${origen}</strong>
                        <div style="font-size:13px; color: var(--gray-600);">${mensaje}</div>
                        <div style="font-size:12px; color: var(--gray-600);">${fecha}</div>
                    </div>
                    <button class="btn-small" data-preview-action="ver">Ver</button>
                </div>
            `;
        }).join('');

        notificationsPreview.innerHTML = `
            <div class="notifications-preview-header">
                <div>
                    <h4>Notificaciones</h4>
                    <span>${unread > 0 ? `${unread} nuevas` : 'Al día'}</span>
                </div>
                <button class="btn-small" type="button" data-open-notifications>Ver todas</button>
            </div>
            <div class="notifications-preview-list">${itemsHtml}</div>
        `;

        notificationsPreview.classList.add('active');

        const openBtn = notificationsPreview.querySelector('[data-open-notifications]');
        if (openBtn && notificationsNavItem) {
            openBtn.addEventListener('click', () => notificationsNavItem.click());
        }

        notificationsPreview.querySelectorAll('.notifications-preview-item').forEach(item => {
            item.querySelector('[data-preview-action="ver"]').addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                const reporte = item.getAttribute('data-reporte');
                verNotificacion(id, reporte);
                marcarLeida(id);
            });
        });
    }

    function renderNotificationsList(notifications) {
        if (!notificationsView) return;

        if (!notifications || notifications.length === 0) {
            notificationsView.innerHTML = '<div class="notification">No tienes notificaciones.</div>';
            return;
        }

        notificationsView.innerHTML = '';
        notifications.forEach(n => {
            const div = document.createElement('div');
            div.className = `notification${Number(n.leida) ? '' : ' unread'}`;
            const origen = escapeHtml(n.origen_nombres ? `${n.origen_nombres} ${n.origen_apellidos || ''}`.trim() : 'Usuario');
            const mensaje = escapeHtml(n.mensaje || n.tipo || 'Notificación');
            const fecha = new Date(n.fecha).toLocaleString();

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <strong>${origen}</strong>
                        <div style="font-size:13px; color:#666;">${mensaje}</div>
                        <div style="font-size:12px; color:#999;">${fecha}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <button class="btn-small" data-action="ver" data-id="${n.id_notificacion}" data-reporte="${n.id_reporte || ''}">Ver</button>
                        <button class="btn-small" data-action="leer" data-id="${n.id_notificacion}" ${Number(n.leida) ? 'disabled' : ''}>${Number(n.leida) ? 'Leída' : 'Marcar leída'}</button>
                    </div>
                </div>
            `;

            const verBtn = div.querySelector('[data-action="ver"]');
            verBtn.addEventListener('click', () => {
                verNotificacion(verBtn.getAttribute('data-id'), verBtn.getAttribute('data-reporte'));
                marcarLeida(verBtn.getAttribute('data-id'));
            });

            const leerBtn = div.querySelector('[data-action="leer"]');
            leerBtn.addEventListener('click', () => marcarLeida(leerBtn.getAttribute('data-id'), leerBtn));

            notificationsView.appendChild(div);
        });
    }

    async function cargarPerfil() {
        try {
            const resp = await fetch('../controllers/usuario_controlador.php?action=obtener', { cache: 'no-store' });
            const user = await resp.json();

            if (!user) return;

            document.getElementById('profileAvatar').src = user.foto_perfil || '../imagenes/fiveicon.png';
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar) headerAvatar.src = user.foto_perfil || '../imagenes/fiveicon.png';
            document.getElementById('profileName').textContent = `${user.nombres || ''} ${user.apellidos || ''}`.trim();
            document.getElementById('profileEmail').innerHTML = `<i class="fas fa-envelope"></i> ${user.correo || ''}`;
            document.getElementById('profilePhone').innerHTML = `<i class="fas fa-phone"></i> ${user.telefono || '-'}`;
            document.getElementById('profileLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${user.ubicacion || '-'}`;
            document.getElementById('profileBio').textContent = user.biografia || 'Sin biografía';

            document.getElementById('inpNombres').value = user.nombres || '';
            document.getElementById('inpApellidos').value = user.apellidos || '';
            document.getElementById('inpTelefono').value = user.telefono || '';
            document.getElementById('inpUbicacion').value = user.ubicacion || '';
            document.getElementById('inpBio').value = user.biografia || '';
        } catch (err) {
            console.error('Error cargar perfil', err);
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
                method: 'POST',
                body: form
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

    function actualizarBadge(notifications) {
        if (!notificationsBadge) return;
        const unread = notifications.filter(n => !Number(n.leida)).length;
        if (unread > 0) {
            notificationsBadge.style.display = 'inline-block';
            notificationsBadge.textContent = unread > 9 ? '9+' : unread;
        } else {
            notificationsBadge.style.display = 'none';
            notificationsBadge.textContent = '';
        }
    }

    function tiempoRelativo(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return diff + 's';
        if (diff < 3600) return Math.floor(diff / 60) + 'm';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd';
        return date.toLocaleDateString();
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, char => {
            switch (char) {
                case '&':
                    return '&amp;';
                case '<':
                    return '&lt;';
                case '>':
                    return '&gt;';
                case '"':
                    return '&quot;';
                case '\'':
                    return '&#39;';
                default:
                    return char;
            }
        });
    }

    window.toggleLike = async function(id_reporte, btn) {
        if (!btn) return;
        btn.disabled = true;

        try {
            const form = new FormData();
            form.append('id_reporte', id_reporte);

            const resp = await fetch('../controllers/reportecontrolador.php?action=toggle_like', {
                method: 'POST',
                body: form
            });
            const result = await resp.json();

            if (result.success) {
                const liked = result.action === 'liked';
                btn.dataset.liked = liked ? '1' : '0';
                const total = Number(result.total_likes || 0);
                btn.innerHTML = `${liked ? '♥ Ya me gusta' : '♡ Me gusta'} (${total})`;
            } else {
                alert(result.mensaje || result.error || 'Error al procesar like');
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor');
        } finally {
            btn.disabled = false;
        }
    };

    window.marcarLeida = async function(id, btn) {
        if (!id) return;
        const form = new FormData();
        form.append('id_notificacion', id);

        try {
            const resp = await fetch('../controllers/notificacion_controlador.php?action=marcar_leida', {
                method: 'POST',
                body: form
            });
            const result = await resp.json();

            if (result.success) {
                if (btn) {
                    btn.textContent = 'Leída';
                    btn.disabled = true;
                }
                if (cachedNotifications) {
                    const found = cachedNotifications.find(n => Number(n.id_notificacion) === Number(id));
                    if (found) {
                        found.leida = 1;
                    }
                }
                actualizarBadge(cachedNotifications || []);
                renderNotificationsPreview(cachedNotifications || []);
                renderNotificationsList(cachedNotifications || []);
            }
        } catch (err) {
            console.error(err);
            alert('Error al marcar como leída');
        }
    };

    window.verNotificacion = function(id_notificacion, id_reporte) {
        if (id_reporte && id_reporte !== 'null') {
            if (window.ComentariosManager && typeof window.ComentariosManager.abrirComentarios === 'function') {
                window.ComentariosManager.abrirComentarios(Number(id_reporte));
                const feedNav = document.querySelector('.nav-item[data-target="feedView"]');
                if (feedNav) feedNav.click();
            } else {
                alert('Función de comentarios no disponible');
            }
        } else {
            alert('No hay información de reporte asociada');
        }
    };
});