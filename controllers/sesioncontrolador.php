<?php
require_once '../models/usuario.php';
require_once '../models/sesion.php';

class SesionControlador {
    private $usuarioModel;
    private $sesionModel;

    public function __construct($db) {
        $this->usuarioModel = new Usuario($db);
        $this->sesionModel = new Sesion($db);

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // Registrar usuario + crear sesión
    public function registrar($nombre, $apellidos, $telefono, $cedula, $correo, $password) {
        // Insertar usuario primero
        $id_usuario = $this->usuarioModel->insertar($nombre, $apellidos, $telefono, $cedula);

        if ($id_usuario) {
            // Crear la sesión para ese usuario
            $hash = password_hash($password, PASSWORD_DEFAULT);
            return $this->sesionModel->insertar($correo, $hash, $id_usuario);
        }

        return false;
    }

    // Login
    public function login($correo, $password) {
        $user = $this->sesionModel->obtenerPorCorreo($correo);

        if ($user && password_verify($password, $user['contraseña'])) {
            $_SESSION['usuario'] = $user['id_usuario'];
            return true;
        }
        return false;
    }

    // Logout
    public function logout() {
        session_unset();
        session_destroy();
    }

    // Verificar sesión
    public function verificarSesion() {
        return $_SESSION['usuario'] ?? null;
    }

    // Saber si está logueado
    public function estaLogueado() {
        return isset($_SESSION['usuario']);
    }
}
