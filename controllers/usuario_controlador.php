<?php
// Configuración robusta de sesiones para producción
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', 86400); // 24 horas

session_start();

// Configurar parámetros de cookie de sesión
session_set_cookie_params([
    'lifetime' => 86400, // 24 horas
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Strict'
]);

require_once '../config/database.php';
require_once '../models/usuario.php';

// Configuración para producción - desactivar display_errors
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

class UsuarioControlador {
    private $usuarioModel;
    
    public function __construct() {
        global $conn;
        $this->usuarioModel = new Usuario($conn);
    }
    
    public function obtener() {
        try {
            // Verificar sesión de manera robusta
            if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                error_log("❌ SESION NO VALIDA en obtener() - usuario_id: " . ($_SESSION['usuario_id'] ?? 'NO') . ", loggedin: " . ($_SESSION['loggedin'] ?? 'NO'));
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado',
                    'session_expired' => true
                ]);
                return;
            }
            
            // Actualizar tiempo de última actividad
            $_SESSION['last_activity'] = time();
            
            $id_usuario = $_SESSION['usuario_id'];
            error_log("✅ Sesión válida, obteniendo datos para usuario ID: " . $id_usuario);
            
            $usuario = $this->usuarioModel->obtenerPorId($id_usuario);
            
            if ($usuario) {
                echo json_encode([
                    'success' => true,
                    'id_usuario' => $usuario['id_usuario'],
                    'nombres' => $usuario['nombres'] ?? '',
                    'apellidos' => $usuario['apellidos'] ?? '',
                    'correo' => $usuario['correo'] ?? '',
                    'telefono' => $usuario['telefono'] ?? '',
                    'nombre_rol' => $usuario['nombre_rol'] ?? 'Usuario',
                    'fecha_registro' => $usuario['fecha_registro'] ?? ''
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado en la base de datos'
                ]);
            }
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener(): " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error del servidor'
            ]);
        }
    }
    
    public function obtener_estadisticas() {
        try {
            // Verificar sesión de manera robusta
            if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado',
                    'session_expired' => true
                ]);
                return;
            }
            
            // Actualizar tiempo de última actividad
            $_SESSION['last_activity'] = time();
            
            $id_usuario = $_SESSION['usuario_id'];
            
            // Estadísticas temporales - puedes implementar la lógica real después
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
            error_log("❌ Error en obtener_estadisticas(): " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo estadísticas'
            ]);
        }
    }
    
    public function obtener_id() {
        try {
            // Verificar sesión de manera robusta
            if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado',
                    'session_expired' => true
                ]);
                return;
            }
            
            // Actualizar tiempo de última actividad
            $_SESSION['last_activity'] = time();
            
            echo json_encode([
                'success' => true,
                'id_usuario' => $_SESSION['usuario_id']
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener_id(): " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo ID'
            ]);
        }
    }
    
    public function verificar_sesion() {
        try {
            // Verificar sesión de manera robusta
            if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                echo json_encode([
                    'success' => false,
                    'sesion_activa' => false,
                    'error' => 'Sesión no activa'
                ]);
                return;
            }
            
            // Verificar si la sesión ha expirado por inactividad (30 minutos)
            $timeout = 30 * 60; // 30 minutos en segundos
            if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout)) {
                // Sesión expirada
                session_unset();
                session_destroy();
                
                echo json_encode([
                    'success' => false,
                    'sesion_activa' => false,
                    'error' => 'Sesión expirada por inactividad'
                ]);
                return;
            }
            
            // Actualizar tiempo de última actividad
            $_SESSION['last_activity'] = time();
            
            echo json_encode([
                'success' => true,
                'sesion_activa' => true,
                'usuario_id' => $_SESSION['usuario_id'],
                'nombres' => $_SESSION['nombres'] ?? '',
                'correo' => $_SESSION['correo'] ?? ''
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Error en verificar_sesion(): " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'sesion_activa' => false,
                'error' => 'Error verificando sesión'
            ]);
        }
    }
    
    public function actualizar() {
        try {
            // Verificar sesión de manera robusta
            if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'No autenticado']);
                return;
            }
            
            // Actualizar tiempo de última actividad
            $_SESSION['last_activity'] = time();
            
            $id_usuario = $_SESSION['usuario_id'];
            $datos = $_POST;
            
            // Lógica para actualizar usuario
            $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);
            
            if ($resultado) {
                // Actualizar datos en sesión si es necesario
                if (isset($datos['nombres'])) {
                    $_SESSION['nombres'] = $datos['nombres'];
                }
                
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
            error_log("❌ Error en actualizar(): " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false, 
                'error' => 'Error del servidor'
            ]);
        }
    }
}

// Manejar la acción
try {
    if (isset($_GET['action'])) {
        $controlador = new UsuarioControlador();
        $action = $_GET['action'];
        
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
    error_log("❌ Error fatal en usuario_controlador: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor'
    ]);
}
?>