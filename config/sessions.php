<?php
// config/sessions.php

class SessionManager {
    public static function start() {
        // Configurar parámetros de cookies primero
        session_set_cookie_params([
            'lifetime' => 0, // Hasta que se cierre el navegador
            'path' => '/',
            'domain' => $_SERVER['HTTP_HOST'] ?? '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        // Nombre específico para la sesión
        session_name('OJOSESSION');
        
        // Configurar handler de sesión basado en entorno
        self::configureSessionHandler();
        
        // Iniciar sesión
        session_start();
        
        error_log("🔍 SESION INICIADA - ID: " . session_id());
        
        // Regenerar ID periódicamente para seguridad
        self::regenerateSessionId();
    }
    
    private static function configureSessionHandler() {
        $redisUrl = getenv('REDIS_URL');
        
        if ($redisUrl) {
            // PRODUCCIÓN: Usar Redis
            self::setupRedisSession($redisUrl);
        } else {
            // DESARROLLO: Usar filesystem
            self::setupFileSession();
        }
    }
    
    private static function setupRedisSession($redisUrl) {
        try {
            // Tu URL de Redis: redis://default:DRNukNuOugIPIHsJZOxwPuyrBySWqjzC@redis.railway.internal:6379
            $redisConfig = parse_url($redisUrl);
            
            $redisPath = sprintf(
                "tcp://%s:%d?auth=%s&database=0&timeout=5&read_timeout=5",
                $redisConfig['host'],
                $redisConfig['port'] ?? 6379,
                $redisConfig['pass'] ?? ''
            );
            
            ini_set('session.save_handler', 'redis');
            ini_set('session.save_path', $redisPath);
            ini_set('session.gc_maxlifetime', 3600); // 1 hora
            
            error_log("🔗 Sesiones configuradas con Redis: " . $redisConfig['host']);
            
        } catch (Exception $e) {
            error_log("❌ Error configurando Redis, usando filesystem: " . $e->getMessage());
            self::setupFileSession();
        }
    }
    
    private static function setupFileSession() {
        // Configuración optimizada para filesystem
        ini_set('session.gc_maxlifetime', 3600); // 1 hora
        ini_set('session.cookie_lifetime', 0);
        ini_set('session.use_strict_mode', 1);
        
        error_log("🔗 Sesiones configuradas con Filesystem");
    }
    
    private static function regenerateSessionId() {
        // Regenerar ID cada 30 minutos para seguridad
        if (!isset($_SESSION['last_regeneration']) || 
            time() - $_SESSION['last_regeneration'] > 1800) {
            
            session_regenerate_id(true);
            $_SESSION['last_regeneration'] = time();
            error_log("🔄 ID de sesión regenerado: " . session_id());
        }
    }
    
    public static function close() {
        session_write_close();
    }
}

// Iniciar sesión automáticamente cuando se incluya este archivo
SessionManager::start();

// Cerrar sesión automáticamente al final del script
register_shutdown_function([SessionManager::class, 'close']);
?>