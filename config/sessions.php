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

        // Configurar Redis ANTES de iniciar sesión
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

        ini_set('session.use_strict_mode', 1);
        ini_set('session.use_cookies', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));

        session_start();

        // DEBUG: Verificar datos de sesión después de iniciar
        error_log("✅ SESION INICIADA - ID: " . session_id());
        error_log("📊 DATOS SESION: " . print_r($_SESSION, true));

        self::regenerateSessionId();
    }

    private static function setupRedisSession($redisUrl) {
        try {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                $redisConfig = parse_url($redisUrl);

                $redisPath = sprintf(
                    "tcp://%s:%d?auth=%s&database=0&timeout=5&read_timeout=5&prefix=ojo_session_",
                    $redisConfig['host'],
                    $redisConfig['port'] ?? 6379,
                    $redisConfig['pass'] ?? ''
                );

                ini_set('session.save_handler', 'redis');
                ini_set('session.save_path', $redisPath);
                ini_set('session.gc_maxlifetime', 3600); // 1 hora

                error_log("✅ REDIS CONFIGURADO: " . $redisConfig['host']);
            }
        } catch (Exception $e) {
            error_log("❌ ERROR REDIS: " . $e->getMessage());
        }
    }

    private static function regenerateSessionId() {
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

    public static function verifySessionData() {
        if (session_status() === PHP_SESSION_ACTIVE) {
            error_log("🔍 VERIFICANDO DATOS SESION:");
            error_log("  - usuario_id: " . ($_SESSION['usuario_id'] ?? 'NO'));
            error_log("  - rol: " . ($_SESSION['rol'] ?? 'NO'));
            error_log("  - nombres: " . ($_SESSION['nombres'] ?? 'NO'));
            error_log("  - session_id: " . session_id());
        }
    }
}
?>
