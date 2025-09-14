<?php
class Sesion {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Crear sesión para un usuario ya existente
    public function insertar($correo, $hash, $id_usuario) {
        $sql = "INSERT INTO sesion (correo, contraseña, id_usuario)
                VALUES (:correo, :password, :id_usuario)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':correo', $correo);
        $stmt->bindParam(':password', $hash);
        $stmt->bindParam(':id_usuario', $id_usuario);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            echo "❌ Error al crear sesión: " . $e->getMessage();
            return false;
        }
    }

    // Buscar usuario por correo
    public function obtenerPorCorreo($correo) {
        $sql = "SELECT * FROM sesion WHERE correo = :correo LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':correo', $correo);
        $stmt->execute();
        return $stmt->fetch();
    }
}
