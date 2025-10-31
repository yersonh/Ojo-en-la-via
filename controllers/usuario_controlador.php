<?php
// usuario_controlador.php - VERSIÓN MEJORADA

// AL INICIO - Solo incluir database.php que ahora maneja sesiones
require_once '../config/database.php';
require_once '../models/usuario.php';

// Configuración para producción
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');

class UsuarioControlador {
    private $usuarioModel;
    
    public function __construct() {
        global $conn;
        $this->usuarioModel = new Usuario($conn);
    }
    
    // VERIFICAR QUE EL MÉTODO obtenerPorId EXISTE EN EL MODELO
    private function verificarModelo() {
        if (!method_exists($this->usuarioModel, 'obtenerPorId')) {
            throw new Exception("El método obtenerPorId no existe en el modelo Usuario");
        }
    }
    
    public function verificar_sesion() {
        try {
            $sesionActiva = isset($_SESSION['id_usuario']) && !empty($_SESSION['id_usuario']);
            
            if ($sesionActiva) {
                echo json_encode([
                    'success' => true,
                    'sesion_activa' => true,
                    'id_usuario' => $_SESSION['id_usuario'],
                    'nombres' => $_SESSION['nombres'] ?? '',
                    'correo' => $_SESSION['correo'] ?? '',
                    'session_id' => session_id()
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'sesion_activa' => false,
                    'error' => 'Sesión no activa'
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
            // Verificar sesión de manera más robusta
            if (!isset($_SESSION['id_usuario']) || empty($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Sesión no válida o expirada',
                    'session_expired' => true
                ]);
                return;
            }
            
            $id_usuario = intval($_SESSION['id_usuario']);
            
            // Verificar que el modelo tenga el método necesario
            $this->verificarModelo();
            
            $usuario = $this->usuarioModel->obtenerPorId($id_usuario);
            
            if ($usuario && !empty($usuario['id_usuario'])) {
                // Sanitizar datos antes de enviarlos
                $response = [
                    'success' => true,
                    'id_usuario' => intval($usuario['id_usuario']),
                    'nombres' => htmlspecialchars($usuario['nombres'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'apellidos' => htmlspecialchars($usuario['apellidos'] ?? 'No especificado', ENT_QUOTES, 'UTF-8'),
                    'correo' => htmlspecialchars($usuario['correo'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'telefono' => htmlspecialchars($usuario['telefono'] ?? 'No registrado', ENT_QUOTES, 'UTF-8'),
                    'foto_perfil' => $this->validarFotoPerfil($usuario['foto_perfil'] ?? ''),
                    'nombre_rol' => htmlspecialchars($usuario['nombre_rol'] ?? 'Usuario', ENT_QUOTES, 'UTF-8'),
                    'fecha_registro' => $usuario['fecha_registro'] ?? ''
                ];
                
                echo json_encode($response);
            } else {
                error_log("❌ Usuario no encontrado en BD para ID: " . $id_usuario);
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
                'error' => 'Error del servidor al obtener datos del usuario'
            ]);
        }
    }
    
    // VALIDAR FOTO DE PERFIL
    private function validarFotoPerfil($foto) {
        if (empty($foto) || $foto === 'null') {
            return '/imagenes/default-avatar.png';
        }
        
        // Si es una URL válida, mantenerla
        if (filter_var($foto, FILTER_VALIDATE_URL)) {
            return $foto;
        }
        
        // Si es una ruta relativa, asegurarse de que empiece con /
        if (strpos($foto, '/') !== 0) {
            return '/' . $foto;
        }
        
        return $foto;
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
            
            $id_usuario = intval($_SESSION['id_usuario']);
            
            // OBTENER ESTADÍSTICAS REALES - ASÍ DEBERÍA SER TU MODELO
            $estadisticas = $this->usuarioModel->obtenerEstadisticas($id_usuario);
            
            if ($estadisticas) {
                echo json_encode([
                    'success' => true,
                    'estadisticas' => $estadisticas
                ]);
            } else {
                // Estadísticas por defecto si no hay datos
                echo json_encode([
                    'success' => true,
                    'estadisticas' => [
                        'reportes' => 0,
                        'likes' => 0, 
                        'comentarios' => 0,
                        'vistas' => 0
                    ]
                ]);
            }
            
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
                'id_usuario' => intval($_SESSION['id_usuario'])
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
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = intval($_SESSION['id_usuario']);
            
            // VALIDAR Y SANITIZAR DATOS DE ENTRADA
            $datos = [
                'nombres' => trim($_POST['nombres'] ?? ''),
                'apellidos' => trim($_POST['apellidos'] ?? ''),
                'telefono' => trim($_POST['telefono'] ?? '')
            ];
            
            // Validaciones básicas
            if (empty($datos['nombres'])) {
                echo json_encode([
                    'success' => false, 
                    'error' => 'El nombre es obligatorio'
                ]);
                return;
            }
            
            if (empty($datos['apellidos'])) {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Los apellidos son obligatorios'
                ]);
                return;
            }
            
            // Validar teléfono si se proporciona
            if (!empty($datos['telefono']) && !preg_match('/^[\d\s\-\+\(\)]{8,20}$/', $datos['telefono'])) {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Formato de teléfono inválido'
                ]);
                return;
            }
            
            // Lógica para actualizar usuario
            $resultado = $this->usuarioModel->actualizar($id_usuario, $datos);
            
            if ($resultado) {
                // Actualizar sesión con nuevos datos
                $_SESSION['nombres'] = $datos['nombres'];
                $_SESSION['apellidos'] = $datos['apellidos'];
                
                echo json_encode([
                    'success' => true, 
                    'mensaje' => 'Perfil actualizado correctamente',
                    'datos_actualizados' => [
                        'nombres' => $datos['nombres'],
                        'apellidos' => $datos['apellidos'],
                        'telefono' => $datos['telefono']
                    ]
                ]);
            } else {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Error al actualizar el perfil en la base de datos'
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
    
    // NUEVO MÉTODO PARA OBTENER PERFIL COMPLETO
    public function obtener_perfil_completo() {
        try {
            if (!isset($_SESSION['id_usuario'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'No autenticado']);
                return;
            }
            
            $id_usuario = intval($_SESSION['id_usuario']);
            
            // Obtener datos básicos
            $usuario = $this->usuarioModel->obtenerPorId($id_usuario);
            
            if (!$usuario) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ]);
                return;
            }
            
            // Obtener estadísticas
            $estadisticas = $this->usuarioModel->obtenerEstadisticas($id_usuario);
            
            $response = [
                'success' => true,
                'datos' => [
                    'id_usuario' => intval($usuario['id_usuario']),
                    'nombres' => htmlspecialchars($usuario['nombres'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'apellidos' => htmlspecialchars($usuario['apellidos'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'correo' => htmlspecialchars($usuario['correo'] ?? '', ENT_QUOTES, 'UTF-8'),
                    'telefono' => htmlspecialchars($usuario['telefono'] ?? 'No registrado', ENT_QUOTES, 'UTF-8'),
                    'foto_perfil' => $this->validarFotoPerfil($usuario['foto_perfil'] ?? ''),
                    'nombre_rol' => htmlspecialchars($usuario['nombre_rol'] ?? 'Usuario', ENT_QUOTES, 'UTF-8'),
                    'fecha_registro' => $usuario['fecha_registro'] ?? ''
                ],
                'estadisticas' => $estadisticas ?: [
                    'reportes' => 0,
                    'likes' => 0,
                    'comentarios' => 0,
                    'vistas' => 0
                ]
            ];
            
            echo json_encode($response);
            
        } catch (Exception $e) {
            error_log("❌ Error en obtener_perfil_completo: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Error al cargar el perfil completo'
            ]);
        }
    }
}

// MANEJADOR PRINCIPAL MEJORADO
try {
    // Verificar que la acción existe y es válida
    if (!isset($_GET['action'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Acción no especificada'
        ]);
        exit;
    }
    
    $action = $_GET['action'];
    $controlador = new UsuarioControlador();
    
    // Lista de acciones permitidas para seguridad
    $accionesPermitidas = [
        'verificar_sesion',
        'obtener', 
        'obtener_estadisticas',
        'obtener_id',
        'actualizar',
        'obtener_perfil_completo'
    ];
    
    if (!in_array($action, $accionesPermitidas)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Acción no válida: ' . $action
        ]);
        exit;
    }
    
    // Verificar que el método existe
    if (!method_exists($controlador, $action)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Método no implementado: ' . $action
        ]);
        exit;
    }
    
    // Ejecutar la acción
    $controlador->$action();
    
} catch (Exception $e) {
    error_log("💥 ERROR GLOBAL en usuario_controlador: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor'
    ]);
}
?>