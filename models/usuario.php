<?php
class Usuario {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Insertar un nuevo usuario
    public function insertar($nombre, $apellidos, $telefono, $cedula) {
        $sql = "INSERT INTO usuario (nombre, apellidos, telefono, cedula)
                VALUES (:nombre, :apellidos, :telefono, :cedula)
                RETURNING id_usuario";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':apellidos', $apellidos);
        $stmt->bindParam(':telefono', $telefono);
        $stmt->bindParam(':cedula', $cedula);

        try {
            $stmt->execute();
            $row = $stmt->fetch();
            return $row['id_usuario']; // devolvemos el id generado
        } catch (PDOException $e) {
            echo "❌ Error al insertar usuario: " . $e->getMessage();
            return false;
        }
    }

    // Listar usuarios
    public function listar() {
        $sql = "SELECT * FROM usuario";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
