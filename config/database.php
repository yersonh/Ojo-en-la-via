<?php
class Database {
    // Usar variables de entorno con valores por defecto
    private $host;
    private $port; 
    private $dbname;
    private $user;
    private $password;
    private $conn;

    public function __construct() {
        // Obtener valores de variables de entorno o usar valores por defecto
        $this->host = getenv('PGHOST') ?: 'db';
        $this->port = getenv('PGPORT') ?: '5432';
        $this->dbname = getenv('PGDATABASE') ?: 'ojoEnLaVIabd';
        $this->user = getenv('PGUSER') ?: 'yerson';
        $this->password = getenv('PGPASSWORD') ?: 'admin';
    }

    public function conectar() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}",
                $this->user,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // echo "✅ Conexión exitosa a PostgreSQL";
        } catch (PDOException $e) {
            echo "❌ Error de conexión: " . $e->getMessage();
        }

        return $this->conn;
    }
}
?>