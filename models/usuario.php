<?php
class Usuario {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function insertar($id_persona, $id_rol, $id_estado, $correo, $password) {
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO usuario (id_persona, id_rol, id_estado, correo, contrasena)
                VALUES (:id_persona, :id_rol, :id_estado, :correo, :password)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id_persona', $id_persona);
        $stmt->bindParam(':id_rol', $id_rol);
        $stmt->bindParam(':id_estado', $id_estado);
        $stmt->bindParam(':correo', $correo);
        $stmt->bindParam(':password', $hash);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            echo "❌ Error al insertar usuario: " . $e->getMessage();
            return false;
        }
    }

    public function existeCorreo($correo) {
        $sql = "SELECT COUNT(*) FROM usuario WHERE correo = :correo";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':correo', $correo);

        try {
            $stmt->execute();
            $count = $stmt->fetchColumn();
            return $count > 0;
        } catch (PDOException $e) {
            echo "❌ Error al verificar correo: " . $e->getMessage();
            return true;
        }
    }

    // MÉTODO NUEVO PARA LOGIN
    public function obtenerPorCorreo($correo) {
        $sql = "SELECT u.*, p.nombres, p.apellidos, p.telefono 
                FROM usuario u 
                JOIN persona p ON u.id_persona = p.id_persona 
                WHERE u.correo = :correo";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':correo', $correo);
        
        try {
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            echo "❌ Error al obtener usuario por correo: " . $e->getMessage();
            return false;
        }
    }

    // MÉTODOS ADICIONALES (opcionales pero útiles)
    public function obtenerPorId($id_usuario) {
        $sql = "SELECT u.*, p.nombres, p.apellidos, p.telefono 
                FROM usuario u 
                JOIN persona p ON u.id_persona = p.id_persona 
                WHERE u.id_usuario = :id_usuario";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id_usuario', $id_usuario);
        
        try {
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            echo "❌ Error al obtener usuario por ID: " . $e->getMessage();
            return false;
        }
    }

    public function actualizarEstado($id_usuario, $id_estado) {
        $sql = "UPDATE usuario SET id_estado = :id_estado WHERE id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':id_estado', $id_estado);
        
        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            echo "❌ Error al actualizar estado: " . $e->getMessage();
            return false;
        }
    }

    public function listar(){
        $sql = "SELECT u.*, p.nombres, p.apellidos, p.telefono 
                FROM usuario u 
                JOIN persona p ON u.id_persona = p.id_persona";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>