<?php
session_start();
require_once '../config/database.php';
require_once '../models/Usuario.php';

header('Content-Type: application/json');

class UsuarioControlador {
    private $usuarioModel;
    
    public function __construct() {
        $this->usuarioModel = new Usuario();
    }
    
    public function obtener() {
        try {
            // Verificar sesión
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            $usuario = $this->usuarioModel->obtenerPorId($id_usuario);
            
            if ($usuario) {
                echo json_encode([
                    'success' => true,
                    'usuario' => [
                        'id_usuario' => $usuario['id_usuario'],
                        'nombres' => $usuario['nombres'],
                        'apellidos' => $usuario['apellidos'],
                        'correo' => $usuario['correo'],
                        'telefono' => $usuario['telefono'],
                        'nombre_rol' => $usuario['nombre_rol'],
                        'fecha_registro' => $usuario['fecha_registro']
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error del servidor: ' . $e->getMessage()
            ]);
        }
    }
    
    public function obtenerEstadisticas() {
        try {
            // Verificar sesión
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            
            // Aquí va tu lógica para obtener estadísticas
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
    
    public function actualizar() {
        try {
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = $_SESSION['id_usuario'];
            $datos = $_POST;
            
            // Lógica para actualizar usuario
            $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);
            
            if ($resultado) {
                echo json_encode(['success' => true, 'mensaje' => 'Perfil actualizado']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Error al actualizar']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error del servidor']);
        }
    }
}

// Ejecutar acción
if (isset($_GET['action'])) {
    $controlador = new UsuarioControlador();
    $action = $_GET['action'];
    
    if (method_exists($controlador, $action)) {
        $controlador->$action();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Acción no válida']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Acción no especificada']);
}
?>