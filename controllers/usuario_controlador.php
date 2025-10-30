<?php
session_start();
require_once '../config/database.php';
require_once '../models/usuario.php';

// Configuración para producción
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

// Debug: loguear información de sesión
error_log("SESSION en usuario_controlador: " . print_r($_SESSION, true));

class UsuarioControlador {
    private $usuarioModel;
    
    public function __construct() {
        global $conn;
        $this->usuarioModel = new Usuario($conn);
    }
    
    public function obtener() {
        try {
            // Debug más detallado
            error_log("🔍 Verificando sesión en obtener(): " . (isset($_SESSION['id_usuario']) ? $_SESSION['id_usuario'] : 'NO HAY SESION'));
            
            // Verificar sesión de manera más flexible para debug
            if (!isset($_SESSION['id_usuario'])) {
                error_log("❌ SESION NO ENCONTRADA en obtener()");
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado - Sesión no encontrada',
                    'session_debug' => $_SESSION
                ]);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            error_log("✅ Sesión encontrada, ID: " . $id_usuario);
            
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
            // Verificar sesión
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado'
                ]);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            
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
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo estadísticas'
            ]);
        }
    }
    
    public function obtener_id() {
        try {
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'No autenticado'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'id_usuario' => $_SESSION['id_usuario']
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error obteniendo ID'
            ]);
        }
    }
    
    public function actualizar() {
        try {
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            $datos = $_POST;
            
            // Lógica para actualizar usuario
            $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);
            
            if ($resultado) {
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
                'error' => 'Acción no válida'
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
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}
?>