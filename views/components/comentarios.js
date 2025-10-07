// Módulo para gestionar comentarios
const ComentariosManager = {
    inicializar() {
        this.configurarEventos();
    },

    configurarEventos() {
        document.getElementById('formComentario').addEventListener('submit', (e) => {
            this.agregarComentario(e);
        });
    },

    async cargarComentarios(id_reporte) {
    try {
        // ✅ CORREGIR RUTA
        const posiblesRutas = [
            '../../controllers/reportecontrolador.php',
            '../controllers/reportecontrolador.php',
            'controllers/reportecontrolador.php',
            '/controllers/reportecontrolador.php'
        ];

        let comentarios = [];

        for (let ruta of posiblesRutas) {
            try {
                const url = `${ruta}?action=listar_comentarios&id_reporte=${id_reporte}`;
                console.log(`🔍 Probando ruta para comentarios: ${url}`);
                
                const resp = await fetch(url);
                if (resp.ok) {
                    comentarios = await resp.json();
                    console.log(`✅ Ruta funcionó: ${ruta}`);
                    break;
                }
            } catch (err) {
                console.log(`❌ Ruta falló: ${ruta}`);
            }
        }

        const comentariosList = document.getElementById('comentariosList');
        comentariosList.innerHTML = '';
        
        if (comentarios.length === 0) {
            comentariosList.innerHTML = '<p style="text-align: center; color: #6c757d;">No hay comentarios aún. Sé el primero en comentar.</p>';
            return;
        }
        
        comentarios.forEach(comentario => {
            const fecha = new Date(comentario.fecha_comentario).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const comentarioHTML = `
                <div class="comentario-item">
                    <div class="comentario-header">
                        <span class="comentario-usuario">${comentario.nombres} ${comentario.apellidos}</span>
                        <span class="comentario-fecha">${fecha}</span>
                    </div>
                    <div class="comentario-texto">${comentario.comentario}</div>
                </div>
            `;
            comentariosList.innerHTML += comentarioHTML;
        });
        
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
    }
},

    async agregarComentario(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const btnComentario = document.getElementById('btnComentario');
        const textoComentario = document.getElementById('textoComentario');
        
        btnComentario.disabled = true;
        
        try {
            const resp = await fetch('../../controllers/reportecontrolador.php?action=agregar_comentario', {
                method: 'POST',
                body: formData
            });
            
            const result = await resp.json();
            
            if (result.success) {
                textoComentario.value = '';
                await this.cargarComentarios(formData.get('id_reporte'));
                MapaManager.mostrarAlerta('Comentario agregado correctamente');
            } else {
                MapaManager.mostrarAlerta('Error al agregar comentario: ' + (result.mensaje || result.error), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            MapaManager.mostrarAlerta('Error de conexión', 'error');
        } finally {
            btnComentario.disabled = false;
        }
    },

    abrirComentarios(id_reporte) {
        document.getElementById('comentarioIdReporte').value = id_reporte;
        document.getElementById('comentariosSection').style.display = 'block';
        this.cargarComentarios(id_reporte);
        
        // Scroll a la sección de comentarios
        document.getElementById('comentariosSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
};