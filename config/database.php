<?php
class Database {
    private $host;
    private $port; 
    private $dbname;
    private $user;
    private $password;
    private $conn;

    public function __construct() {
        // Verificar si la extensión pdo_pgsql está instalada
        if (!extension_loaded('pdo_pgsql')) {
            error_log("❌ Extensión pdo_pgsql no está instalada");
            return;
        }

        // Obtener DATABASE_URL de Railway (producción) o DATABASE_PUBLIC_URL (local)
        $databaseUrl = getenv('DATABASE_URL');
        
        if ($databaseUrl) {
            // Parsear la URL de Railway (PRODUCCIÓN)
            $dbParts = parse_url($databaseUrl);
            
            $this->host = $dbParts['host'] ?? '';
            $this->port = $dbParts['port'] ?? '5432';
            $this->dbname = ltrim($dbParts['path'] ?? '', '/');
            $this->user = $dbParts['user'] ?? '';
            $this->password = $dbParts['pass'] ?? '';
            
            error_log("🔗 PRODUCCIÓN - Conectando a PostgreSQL en Railway INTERNO: " . $this->host);
        } else {
            // Configuración LOCAL usando DATABASE_PUBLIC_URL
            $this->host = getenv('PGHOST') ?: 'switchyard.proxy.rlwy.net';
            $this->port = getenv('PGPORT') ?: '35124';
            $this->dbname = getenv('PGDATABASE') ?: 'railway';
            $this->user = getenv('PGUSER') ?: 'postgres';
            $this->password = getenv('PGPASSWORD') ?: 'VdQIFsxyyydFBXocPZixREthKPSXCVKe';
            
            error_log("🔗 LOCAL - Conectando a PostgreSQL PÚBLICO: " . $this->host);
        }
    }

    public function conectar() {
        $this->conn = null;

        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}";
            
            error_log("🔌 Intentando conectar a: {$this->host}:{$this->port}/{$this->dbname}");
            error_log("🔌 Usuario: {$this->user}");
            
            $this->conn = new PDO($dsn, $this->user, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            
            error_log("✅ Conexión exitosa a PostgreSQL: " . $this->dbname);
            
        } catch (PDOException $e) {
            error_log("❌ Error de conexión a PostgreSQL: " . $e->getMessage());
            error_log("❌ DSN: pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}");
            error_log("❌ Usuario: " . $this->user);
            echo "Error de conexión a la base de datos. Revisa los logs.";
        }

        return $this->conn;
    }
}
?>