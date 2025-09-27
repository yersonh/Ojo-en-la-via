<?php
class Database {
    // Host es el nombre del servicio en docker-compose.yml
    private $host = "db";  
    private $port = "5432";
    private $dbname = "ojoEnLaVIabd";
    private $user = "yerson";
    private $password = "admin";
    private $conn;

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
