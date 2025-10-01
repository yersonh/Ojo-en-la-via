<?php
echo "<h1>🔍 Prueba de Conexión a PostgreSQL</h1>";
echo "<pre>";

// 1. Verificar extensiones PHP
echo "1. ✅ Verificando extensiones PHP:\n";
$required_extensions = ['pdo_pgsql', 'pgsql'];
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "   ✅ $ext\n";
    } else {
        echo "   ❌ $ext - FALTANTE\n";
    }
}

// 2. Verificar variables de entorno
echo "\n2. 🔍 Variables de entorno:\n";
$env_vars = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER'];
foreach ($env_vars as $var) {
    $value = getenv($var);
    if ($value) {
        // Ocultar contraseña por seguridad
        if ($var === 'DATABASE_URL' || $var === 'PGPASSWORD') {
            $masked_value = preg_replace('/:(.*)@/', ':****@', $value);
            echo "   ✅ $var = $masked_value\n";
        } else {
            echo "   ✅ $var = $value\n";
        }
    } else {
        echo "   ⚠️  $var = NO DEFINIDA\n";
    }
}

// 3. Probar conexión a la base de datos
echo "\n3. 🗄️ Probando conexión a PostgreSQL:\n";
try {
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->conectar();
    
    if ($db) {
        echo "   ✅ Conexión exitosa\n";
        
        // Probar versión de PostgreSQL
        $stmt = $db->query("SELECT version()");
        $version = $stmt->fetch();
        echo "   📋 PostgreSQL: " . $version['version'] . "\n";
        
        // Probar listar tablas
        $stmt = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        $tables = $stmt->fetchAll();
        
        echo "   📊 Tablas encontradas: " . count($tables) . "\n";
        foreach ($tables as $table) {
            echo "      - " . $table['table_name'] . "\n";
        }
        
        // Probar consulta en tabla usuario (si existe)
        if (in_array('usuario', array_column($tables, 'table_name'))) {
            $stmt = $db->query("SELECT COUNT(*) as total FROM usuario");
            $result = $stmt->fetch();
            echo "   👥 Usuarios en BD: " . $result['total'] . "\n";
        }
        
    } else {
        echo "   ❌ Error en la conexión\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error de conexión: " . $e->getMessage() . "\n";
}

// 4. Información del servidor
echo "\n4. 🌐 Información del servidor:\n";
echo "   PHP: " . PHP_VERSION . "\n";
echo "   Servidor: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') . "\n";
echo "   Puerto: " . ($_SERVER['SERVER_PORT'] ?? 'N/A') . "\n";

echo "\n🎉 Prueba completada\n";
echo "</pre>";
?>