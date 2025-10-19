// Panel.js - gestiona navegación inferior, feed, notificaciones y perfil
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(i => i.addEventListener('click', onNavClick));

    // Referencias
    const feedView = document.getElementById('feedView');
    const notificationsView = document.getElementById('notificationsView');
    const profileView = document.getElementById('profileView');

    // Inicializar feed
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

    async function onNavClick(e) {
        navItems.forEach(n => n.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const target = e.currentTarget.getAttribute('data-target');
        document.querySelectorAll('#mainContent > div').forEach(d => d.style.display = 'none');
        
        const targetElement = document.getElementById(target);
        if (targetElement) {
            targetElement.style.display = 'block';
        }

        if (target === 'feedView') cargarFeed();
        if (target === 'notificationsView') cargarNotificaciones();
        if (target === 'mapView') {
            // mapa está dentro de iframe en esta vista
        }
        if (target === 'profileView') cargarPerfil();
    }

    // Cargar feed de reportes
    async function cargarFeed() {
        if (!feedView) return;
        
        feedView.innerHTML = '<p style="text-align:center; color:#666;">Cargando...</p>';
        try {
            const resp = await fetch('../controllers/reportecontrolador.php?action=listar');
            const data = await resp.json();

            if (!Array.isArray(data)) {
                feedView.innerHTML = '<p style="text-align:center; color:red;">Error al cargar feed</p>';
                return;
            }

            if (data.length === 0) {
                feedView.innerHTML = '<p style="text-align:center; color:#666;">No hay publicaciones aún.</p>';
                return;
            }

            feedView.innerHTML = '';
            data.forEach(post => {
                const avatar = post.imagen_url ? post.imagen_url : '/imagenes/fiveicon.png';
                const timeText = tiempoRelativo(new Date(post.fecha_reporte));

                const div = document.createElement('div');
                div.className = 'post';
                div.innerHTML = `
                    <div class="post-header">
                        <img src="${avatar}" class="avatar" onerror="this.src='/imagenes/fiveicon.png'">
                        <div>
                            <div style="font-weight:700">${escapeHtml(post.nombres || post.usuario_correo)} ${escapeHtml(post.apellidos || '')}</div>
                            <div class="post-meta">${post.latitud}, ${post.longitud} · ${timeText}</div>
                        </div>
                    </div>
                    <div class="post-desc">${escapeHtml(post.descripcion)}</div>
                    ${post.imagen_url ? `<img class="post-img" src="${post.imagen_url}" onerror="this.style.display='none'">` : ''}
                    <div class="post-actions">
                        <button class="btn-small" data-id="${post.id_reporte}" onclick="ComentariosManager.abrirComentarios(${post.id_reporte})">💬 Comentar</button>
                        <button class="btn-small" onclick="toggleLike(${post.id_reporte}, this)">♡ Me gusta</button>
                    </div>
                `;

                feedView.appendChild(div);
            });

            // Scroll to top
            feedView.scrollTop = 0;

        } catch (err) {
            console.error(err);
            feedView.innerHTML = '<p style="text-align:center; color:red;">Error al cargar publicaciones</p>';
        }
    }

    // Notificaciones (mock mínimo: likes/comentarios recientes cercanos a tus coords)
    async function cargarNotificaciones() {
        if (!notificationsView) return;
        
        notificationsView.innerHTML = '<p style="text-align:center; color:#666;">Cargando notificaciones...</p>';
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
            const user = await resp.json();

            if (!user) return;

            document.getElementById('profileAvatar').src = user.foto_perfil || '/imagenes/fiveicon.png';
            document.getElementById('profileName').textContent = `${user.nombres || ''} ${user.apellidos || ''}`; // 👈 CORREGIDO
            document.getElementById('profileEmail').textContent = user.correo || '';
            document.getElementById('profilePhone').textContent = 'Teléfono: ' + (user.telefono || '-');
            document.getElementById('profileBio').textContent = user.biografia || 'Sin biografía';

            // Prefill form
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
                if (r.action === 'liked') btn.textContent = '♥ Ya me gusta';
                else btn.textContent = '♡ Me gusta';
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
});