<?php
// AL INICIO - Solo incluir database.php que ahora maneja sesiones
require_once '../config/bootstrap_session.php';

// Configuración para producción
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

// Debug: loguear información de sesión
error_log("🎯 usuario_controlador.php cargado - SESSION ID: " . session_id());
error_log("🔍 DATOS SESION: " . print_r($_SESSION, true));

class UsuarioControlador {
    private $usuarioModel;
    
    public function __construct() {
        global $conn;
        $this->usuarioModel = new Usuario($conn);
    }
    
    // FUNCIÓN HELPER PARA OBTENER EL ID CORRECTO
    private function obtenerIdUsuarioSesion() {
        // Prioridad: usuario_id (como está en sesión) > id_usuario
        $id_usuario = $_SESSION['usuario_id'] ?? $_SESSION['id_usuario'] ?? null;
        
        error_log("🔍 MAPEO ID USUARIO:");
        error_log("  - usuario_id (sesión): " . ($_SESSION['usuario_id'] ?? 'NO'));
        error_log("  - id_usuario (sesión): " . ($_SESSION['id_usuario'] ?? 'NO'));
        error_log("  - ID final: " . ($id_usuario ?: 'NO ENCONTRADO'));
        
        return $id_usuario;
    }
    
    public function verificar_sesion() {
        try {
            $id_usuario = $this->obtenerIdUsuarioSesion();
            $sesionActiva = !empty($id_usuario);
            
            error_log("🔍 VERIFICANDO SESION - Activa: " . ($sesionActiva ? 'SI' : 'NO'));
            error_log("🔍 USER ID en sesión: " . ($id_usuario ?: 'NO'));
            
            if ($sesionActiva) {
                echo json_encode([
                    'success' => true,
                    'sesion_activa' => true,
                    'id_usuario' => $id_usuario,
                    'nombres' => $_SESSION['nombres'] ?? '',
                    'correo' => $_SESSION['correo'] ?? '',
                    'session_id' => session_id(),
                    'session_age' => isset($_SESSION['last_regeneration']) ? 
                        time() - $_SESSION['last_regeneration'] : 0
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'sesion_activa' => false,
                    'error' => 'Sesión no activa',
                    'session_id' => session_id(),
                    'session_keys' => array_keys($_SESSION)
                ]);
            }
            
        } catch (Exception $e) {
            error_log("❌ Error en verificar_sesion: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'sesion_activa' => false,
                'error' => 'Error verificando sesión'
            ]);
        }
    }
    
    public function obtener() {
        try {
            // DEBUG DETALLADO DE SESIÓN
            error_log("=== DEBUG SESIÓN EN OBTENER() ===");
            error_log("SESSION ID: " . session_id());
            error_log("SESSION STATUS: " . session_status());
            error_log("SESSION DATA: " . print_r($_SESSION, true));
            error_log("SESSION KEYS: " . implode(', ', array_keys($_SESSION)));
            
            // Obtener ID usando el mapeo inteligente
            $id_usuario = $this->obtenerIdUsuarioSesion();
            
            if (empty($id_usuario)) {
                error_log("❌ SESIÓN INVALIDA - No se encontró ID de usuario");
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Sesión no válida o expirada',
                    'session_expired' => true,
                    'session_id' => session_id(),
                    'session_keys' => array_keys($_SESSION)
                ]);
                return;
            }
            
            error_log("✅ Sesión válida, ID para BD: " . $id_usuario);
            
            $usuario = $this->usuarioModel->obtenerPorId($id_usuario);
            
            if ($usuario) {
                // DEBUG: Verificar qué datos vienen de la BD
                error_log("📊 DATOS DESDE BD:");
                error_log("  - id_usuario: " . ($usuario['id_usuario'] ?? 'NO'));
                error_log("  - nombres: " . ($usuario['nombres'] ?? 'NO'));
                error_log("  - apellidos: " . ($usuario['apellidos'] ?? 'NO'));
                error_log("  - telefono: " . ($usuario['telefono'] ?? 'NO'));
                error_log("  - correo: " . ($usuario['correo'] ?? 'NO'));
                error_log("  - foto_perfil: " . ($usuario['foto_perfil'] ?? 'NO'));
                error_log("  - nombre_rol: " . ($usuario['nombre_rol'] ?? 'NO'));
                
                // Si los campos están vacíos en la BD, usar valores por defecto
                $response = [
                    'success' => true,
                    'id_usuario' => $usuario['id_usuario'],
                    'nombres' => $usuario['nombres'] ?? '',
                    'apellidos' => $usuario['apellidos'] ?? 'No especificado',
                    'correo' => $usuario['correo'] ?? '',
                    'telefono' => $usuario['telefono'] ?? 'No registrado',
                    'foto_perfil' => $usuario['foto_perfil'] ?? '/imagenes/default-avatar.png',
                    'nombre_rol' => $usuario['nombre_rol'] ?? 'Usuario',
                    'fecha_registro' => $usuario['fecha_registro'] ?? ''
                ];
                
                error_log("🎯 RESPUESTA FINAL:");
                error_log(print_r($response, true));
                
                echo json_encode($response);
            } else {
                error_log("❌ Usuario no encontrado en BD para ID: " . $id_usuario);
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ]);
            }
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener(): " . $e->getMessage());
            error_log("❌ TRAZA: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error del servidor al obtener datos del usuario'
            ]);
        }
    }
    
    public function obtener_estadisticas() {
        try {
            // Obtener ID usando el mapeo inteligente
            $id_usuario = $this->obtenerIdUsuarioSesion();
            
            if (empty($id_usuario)) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado'
                ]);
                return;
            }
            
            // Estadísticas temporales
            $estadisticas = [
                'reportes' => 0,
                'likes' => 0, 
                'comentarios' => 0,
                'vistas' => 0
            ];
            
            echo json_encode([
                'success' => true,
                'estadisticas' => $estadisticas
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener_estadisticas: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo estadísticas'
            ]);
        }
    }
    
    public function obtener_id() {
        try {
            // Obtener ID usando el mapeo inteligente
            $id_usuario = $this->obtenerIdUsuarioSesion();
            
            if (empty($id_usuario)) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'id_usuario' => $id_usuario
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener_id: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo ID'
            ]);
        }
    }
    
    public function actualizar() {
        try {
            // Obtener ID usando el mapeo inteligente
            $id_usuario = $this->obtenerIdUsuarioSesion();
            
            if (empty($id_usuario)) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'No autenticado']);
                return;
            }
            
            $datos = $_POST;
            
            // Lógica para actualizar usuario
            $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);
            
            if ($resultado) {
                // Actualizar sesión con nuevos datos
                if (isset($datos['nombres'])) $_SESSION['nombres'] = $datos['nombres'];
                if (isset($datos['apellidos'])) $_SESSION['apellidos'] = $datos['apellidos'];
                
                echo json_encode([
                    'success' => true, 
                    'mensaje' => 'Perfil actualizado correctamente'
                ]);
            } else {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Error al actualizar el perfil'
                ]);
            }
            
        } catch (Exception $e) {
            error_log("❌ Error en actualizar: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'error' => 'Error del servidor al actualizar el perfil'
            ]);
        }
    }
    
    // NUEVO MÉTODO PARA NORMALIZAR LAS CLAVES DE SESIÓN
    public function normalizar_sesion() {
        try {
            error_log("🔄 Normalizando claves de sesión...");
            
            // Si existe usuario_id pero no id_usuario, copiar el valor
            if (isset($_SESSION['usuario_id']) && !isset($_SESSION['id_usuario'])) {
                $_SESSION['id_usuario'] = $_SESSION['usuario_id'];
                error_log("✅ Copiado usuario_id → id_usuario: " . $_SESSION['usuario_id']);
            }
            
            // Si existe id_usuario pero no usuario_id, copiar el valor (opcional)
            if (isset($_SESSION['id_usuario']) && !isset($_SESSION['usuario_id'])) {
                $_SESSION['usuario_id'] = $_SESSION['id_usuario'];
                error_log("✅ Copiado id_usuario → usuario_id: " . $_SESSION['id_usuario']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Sesión normalizada',
                'session_data' => [
                    'id_usuario' => $_SESSION['id_usuario'] ?? null,
                    'usuario_id' => $_SESSION['usuario_id'] ?? null,
                    'nombres' => $_SESSION['nombres'] ?? null
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Error normalizando sesión: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error normalizando sesión'
            ]);
        }
    }
}

// Manejar la acción
try {
    if (isset($_GET['action'])) {
        $controlador = new UsuarioControlador();
        $action = $_GET['action'];
        
        error_log("🎯 Acción usuario_controlador: " . $action);
        
        if (method_exists($controlador, $action)) {
            $controlador->$action();
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Acción no válida: ' . $action
            ]);
        }
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Acción no especificada'
        ]);
    }
} catch (Exception $e) {
    error_log("💥 ERROR GLOBAL en usuario_controlador: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor'
    ]);
}
?>