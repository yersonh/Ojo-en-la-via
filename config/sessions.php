<?php
// config/sessions.php

class SessionManager {
    public static function start() {
        // VERIFICAR si la sesión ya está iniciada
        if (session_status() === PHP_SESSION_ACTIVE) {
            error_log("🔍 Sesión ya está activa - ID: " . session_id());
            return; // No hacer nada si ya está iniciada
        }

        // DEBUG
        error_log("=== INICIANDO NUEVA SESION ===");
        error_log("APP_ENV: " . (getenv('APP_ENV') ?: 'NOT_SET'));
        error_log("REDIS_URL: " . (getenv('REDIS_URL') ?: 'NOT_SET'));

        // Configurar Redis SI la sesión no está activa
        $redisUrl = getenv('REDIS_URL') ?: 'redis://default:DRNukNuOugIPIHsJZOxwPuyrBySWqjzC@redis.railway.internal:6379';
        
        self::setupRedisSession($redisUrl);

        // Configurar cookies ANTES de iniciar sesión
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => $_SERVER['HTTP_HOST'] ?? '',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        session_name('OJOSESSION');
        session_start();
        
        error_log("✅ SESION INICIADA - ID: " . session_id());
        self::regenerateSessionId();
    }
    
    private static function setupRedisSession($redisUrl) {
        try {
            // SOLO configurar Redis si la sesión NO está activa
            if (session_status() !== PHP_SESSION_ACTIVE) {
                $redisConfig = parse_url($redisUrl);
                
                $redisPath = sprintf(
                    "tcp://%s:%d?auth=%s&database=0&timeout=5&read_timeout=5",
                    $redisConfig['host'],
                    $redisConfig['port'] ?? 6379,
                    $redisConfig['pass'] ?? ''
                );
                
                ini_set('session.save_handler', 'redis');
                ini_set('session.save_path', $redisPath);
                ini_set('session.gc_maxlifetime', 3600);
                
                error_log("✅ REDIS CONFIGURADO: " . $redisConfig['host']);
            }
            
        } catch (Exception $e) {
            error_log("❌ ERROR REDIS: " . $e->getMessage());
        }
    }
    
    private static function regenerateSessionId() {
        // Solo regenerar si la sesión está activa y no se han enviado headers
        if (session_status() === PHP_SESSION_ACTIVE && !headers_sent()) {
            if (!isset($_SESSION['last_regeneration']) || 
                time() - $_SESSION['last_regeneration'] > 1800) {
                
                session_regenerate_id(true);
                $_SESSION['last_regeneration'] = time();
                error_log("🔄 ID regenerado: " . session_id());
            }
        }
    }
    
    public static function close() {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
    }
}

// Iniciar sesión solo si no está activa
if (session_status() !== PHP_SESSION_ACTIVE) {
    SessionManager::start();
}

// Cerrar sesión al final
register_shutdown_function([SessionManager::class, 'close']);
?>