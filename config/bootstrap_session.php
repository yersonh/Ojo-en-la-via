<?php
// config/bootstrap_session.php
require_once __DIR__ . '/sessions.php';

// Solo iniciar si no está activa
if (session_status() !== PHP_SESSION_ACTIVE) {
    SessionManager::start();
    SessionManager::verifySessionData();
    register_shutdown_function([SessionManager::class, 'close']);
} else {
    error_log("⚠️ Sesión ya estaba activa, no se reinicia.");
}
